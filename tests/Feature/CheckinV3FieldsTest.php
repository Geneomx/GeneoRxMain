<?php

namespace Tests\Feature;

use App\Models\CheckIn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The v3 check-in fields (body-system ratings, the monthly treatment check and
 * the supplement-plan snapshot) ride inside the existing JSON blob — no
 * migration. These tests pin the properties that makes safe:
 *
 *  - a null rating survives as null and is NEVER coerced to 0
 *  - unknown keys round-trip verbatim
 *  - a save from a client that omits a field does not erase it
 *  - the dedupe signature still ignores the new fields, so an older client
 *    resending a check-in does not duplicate the row
 */
class CheckinV3FieldsTest extends TestCase
{
    use RefreshDatabase;

    private function actingUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        return $user;
    }

    private function checkinPayload(array $over = []): array
    {
        return array_replace([
            'dateISO' => '2026-05-18',
            'adherencePct' => 80,
            'supplementsTaken' => ['Magnesium glycinate'],
            'supplementsPlanned' => ['Magnesium glycinate', 'Vitamin B12'],
            'symptoms' => ['items' => [], 'improvementScore' => 0],
            'wellbeing' => [
                'energy' => 8, 'mood' => 7, 'sleep' => 6, 'focus' => 5,
                'digestive' => 7, 'circulation' => null, 'immunity' => 0,
            ],
            'completion' => [
                'labs' => 'unsure',
                'labsDateISO' => null,
                'prescriber' => 'yes',
                'prescriberDateISO' => '2026-05-10',
                'lifestyle' => ['movement' => 'yes', 'hydration' => 'no'],
            ],
            'sideEffects' => [],
            'notes' => '',
        ], $over);
    }

    public function test_the_new_fields_round_trip_verbatim(): void
    {
        $this->actingUser();

        $this->postJson('/api/mobile/profile', ['checkins' => [$this->checkinPayload()]])
            ->assertOk();

        $data = $this->getJson('/api/mobile/profile')->assertOk()->json('checkins.0');

        $this->assertSame(7, $data['wellbeing']['digestive']);
        $this->assertSame('unsure', $data['completion']['labs']);
        $this->assertSame('2026-05-10', $data['completion']['prescriberDateISO']);
        $this->assertSame(['Magnesium glycinate', 'Vitamin B12'], $data['supplementsPlanned']);
        $this->assertSame(['movement' => 'yes', 'hydration' => 'no'], $data['completion']['lifestyle']);
    }

    /**
     * The single most important guarantee in the feature. If a null ever comes
     * back as 0, every unanswered body system reads as the worst possible score
     * and the chart draws a flat zero line that looks like collapse.
     */
    public function test_a_null_rating_is_never_coerced_to_zero(): void
    {
        $this->actingUser();

        $this->postJson('/api/mobile/profile', ['checkins' => [$this->checkinPayload()]])
            ->assertOk();

        $wellbeing = $this->getJson('/api/mobile/profile')->json('checkins.0.wellbeing');

        $this->assertArrayHasKey('circulation', $wellbeing);
        $this->assertNull($wellbeing['circulation'], 'null must survive as null');
        $this->assertNotSame(0, $wellbeing['circulation']);

        // ...and a real 0 must survive as a real 0, not become null.
        $this->assertSame(0, $wellbeing['immunity'], '0 is a real answer the user asserted');
    }

    public function test_a_save_that_omits_a_field_does_not_erase_it(): void
    {
        $user = $this->actingUser();

        $this->postJson('/api/mobile/profile', ['checkins' => [$this->checkinPayload()]])->assertOk();

        // An older client resends the same check-in without knowing about
        // `completion`. The stored value must survive.
        $legacy = $this->checkinPayload();
        unset($legacy['completion'], $legacy['supplementsPlanned']);

        $this->postJson('/api/mobile/profile', ['checkins' => [$legacy]])->assertOk();

        $data = $this->getJson('/api/mobile/profile')->json('checkins.0');

        $this->assertArrayHasKey('completion', $data, 'the older client erased a field it did not know about');
        $this->assertSame('yes', $data['completion']['prescriber']);
        $this->assertSame(1, CheckIn::where('user_id', $user->id)->count());
    }

    public function test_a_resent_list_field_replaces_wholesale(): void
    {
        $this->actingUser();

        $this->postJson('/api/mobile/profile', ['checkins' => [$this->checkinPayload()]])->assertOk();

        $cleared = $this->checkinPayload(['supplementsTaken' => []]);
        $this->postJson('/api/mobile/profile', ['checkins' => [$cleared]])->assertOk();

        $data = $this->getJson('/api/mobile/profile')->json('checkins.0');

        $this->assertSame(
            [],
            $data['supplementsTaken'],
            'lists must replace wholesale — a recursive merge would resurrect removed entries'
        );
    }

    public function test_the_dedupe_signature_ignores_the_new_fields(): void
    {
        $user = $this->actingUser();

        $withCompletion = $this->checkinPayload();
        $withoutCompletion = $this->checkinPayload();
        unset($withoutCompletion['completion']);

        $this->postJson('/api/mobile/profile', ['checkins' => [$withCompletion]])->assertOk();
        $this->postJson('/api/mobile/profile', ['checkins' => [$withoutCompletion]])->assertOk();

        $this->assertSame(
            1,
            CheckIn::where('user_id', $user->id)->count(),
            'adding the new fields to checkinSignature would duplicate rows for older clients'
        );
    }

    public function test_wellbeing_baseline_accepts_an_explicit_null_over_a_number(): void
    {
        $this->actingUser();

        $this->postJson('/api/mobile/profile', [
            'portal_state' => ['wellbeingBaseline' => ['energy' => 5, 'digestive' => 7]],
        ])->assertOk();

        $this->postJson('/api/mobile/profile', [
            'portal_state' => ['wellbeingBaseline' => ['energy' => 5, 'digestive' => null]],
        ])->assertOk();

        $baseline = $this->getJson('/api/mobile/profile')->json('portal_state.wellbeingBaseline');

        $this->assertNull(
            $baseline['digestive'],
            'a cleared baseline rating must persist, not resurrect the old number'
        );
    }
}
