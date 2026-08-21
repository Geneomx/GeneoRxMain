<?php

namespace Tests\Feature;

use App\Models\CheckIn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Check-in history is merged, not replaced. These tests pin the behaviour that
 * matters: a stale or empty client payload can never wipe stored history, while
 * genuine adds, edits and explicit deletes still work.
 *
 * The endpoint is the same for web and mobile (saveProfile), so this covers
 * both surfaces.
 */
class CheckinSyncTest extends TestCase
{
    use RefreshDatabase;

    private function actingUser(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    private function checkin(array $overrides = []): array
    {
        return array_merge([
            'dateISO' => '2026-08-01T12:00:00.000Z',
            'adherencePct' => 80,
            'notes' => '',
        ], $overrides);
    }

    private function save(array $body): void
    {
        $this->postJson('/api/profile', $body)->assertOk();
    }

    public function test_an_empty_payload_does_not_wipe_existing_history(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [$this->checkin(['dateISO' => '2026-08-01T12:00:00Z'])]]);
        $this->save(['checkins' => [$this->checkin(['dateISO' => '2026-08-08T12:00:00Z', 'adherencePct' => 90])]]);

        $this->assertSame(2, CheckIn::where('user_id', $user->id)->count());

        // A stale client resends nothing — history must survive.
        $this->save(['checkins' => []]);

        $this->assertSame(2, CheckIn::where('user_id', $user->id)->count());
    }

    public function test_a_partial_payload_preserves_rows_it_omits(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [
            $this->checkin(['dateISO' => '2026-08-01T12:00:00Z']),
            $this->checkin(['dateISO' => '2026-08-08T12:00:00Z', 'adherencePct' => 90]),
        ]]);

        $first = CheckIn::where('user_id', $user->id)->orderBy('date_checked')->first();

        // Client resends only the first, with its server id — the second stays.
        $this->save(['checkins' => [
            ['id' => $first->id, 'dateISO' => '2026-08-01T12:00:00Z', 'adherencePct' => 80, 'notes' => ''],
        ]]);

        $this->assertSame(2, CheckIn::where('user_id', $user->id)->count());
    }

    public function test_a_re_save_of_the_same_checkin_updates_in_place(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [$this->checkin(['notes' => 'first'])]]);

        $row = CheckIn::where('user_id', $user->id)->sole();

        // Same id, edited notes — one row, updated, not duplicated.
        $this->save(['checkins' => [
            ['id' => $row->id, 'dateISO' => '2026-08-01T12:00:00Z', 'adherencePct' => 95, 'notes' => 'edited'],
        ]]);

        $this->assertSame(1, CheckIn::where('user_id', $user->id)->count());
        $fresh = CheckIn::where('user_id', $user->id)->sole();
        $this->assertSame(95, (int) $fresh->adherence_percentage);
        $this->assertSame('edited', $fresh->notes);
    }

    public function test_an_id_less_re_save_does_not_duplicate_via_signature_match(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [$this->checkin(['notes' => 'stable'])]]);

        // Old client that does not round-trip the id resends the same content.
        $this->save(['checkins' => [$this->checkin(['notes' => 'stable'])]]);

        $this->assertSame(1, CheckIn::where('user_id', $user->id)->count());
    }

    public function test_a_new_checkin_is_appended(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [$this->checkin(['dateISO' => '2026-08-01T12:00:00Z'])]]);
        $this->save(['checkins' => [
            $this->checkin(['dateISO' => '2026-08-01T12:00:00Z']),
            $this->checkin(['dateISO' => '2026-08-08T12:00:00Z', 'adherencePct' => 70]),
        ]]);

        $this->assertSame(2, CheckIn::where('user_id', $user->id)->count());
    }

    public function test_explicit_deletion_removes_a_checkin(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [
            $this->checkin(['dateISO' => '2026-08-01T12:00:00Z']),
            $this->checkin(['dateISO' => '2026-08-08T12:00:00Z', 'adherencePct' => 90]),
        ]]);

        $doomed = CheckIn::where('user_id', $user->id)->orderByDesc('date_checked')->first();

        $this->save([
            'checkins' => [$this->checkin(['dateISO' => '2026-08-01T12:00:00Z'])],
            'deleted_checkins' => [$doomed->id],
        ]);

        $this->assertSame(1, CheckIn::where('user_id', $user->id)->count());
        $this->assertNull(CheckIn::find($doomed->id));
    }

    public function test_a_deleted_checkin_is_not_resurrected_by_a_stale_row_in_the_same_payload(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [$this->checkin(['notes' => 'to delete'])]]);
        $row = CheckIn::where('user_id', $user->id)->sole();

        // The client deletes it but its array still contains the stale copy.
        $this->save([
            'checkins' => [['id' => $row->id, 'dateISO' => '2026-08-01T12:00:00Z', 'adherencePct' => 80, 'notes' => 'to delete']],
            'deleted_checkins' => [$row->id],
        ]);

        $this->assertSame(0, CheckIn::where('user_id', $user->id)->count());
    }

    public function test_replace_all_performs_a_full_reset(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [
            $this->checkin(['dateISO' => '2026-08-01T12:00:00Z']),
            $this->checkin(['dateISO' => '2026-08-08T12:00:00Z', 'adherencePct' => 90]),
        ]]);

        // The account-reset path.
        $this->save(['checkins' => [], 'replace_all' => true]);

        $this->assertSame(0, CheckIn::where('user_id', $user->id)->count());
    }

    public function test_check_ins_count_reflects_the_true_row_count(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [
            $this->checkin(['dateISO' => '2026-08-01T12:00:00Z']),
            $this->checkin(['dateISO' => '2026-08-08T12:00:00Z', 'adherencePct' => 90]),
        ]]);

        // A later empty save must not report the count as 0.
        $this->save(['checkins' => []]);

        $this->assertSame(2, (int) $user->profile()->first()->check_ins_count);
    }

    public function test_omitting_the_checkins_key_entirely_leaves_history_untouched(): void
    {
        $user = $this->actingUser();
        $this->save(['checkins' => [$this->checkin()]]);

        // A profile-only save (no checkins key) must not touch check-ins.
        $this->save(['profile' => ['gender' => 'female']]);

        $this->assertSame(1, CheckIn::where('user_id', $user->id)->count());
    }
}
