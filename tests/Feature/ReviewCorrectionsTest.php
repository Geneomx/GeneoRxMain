<?php

namespace Tests\Feature;

use App\Models\Medication;
use App\Models\User;
use App\Support\MedicationEvidence;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewCorrectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_old_catalog_citations_are_corrected_before_being_sent_to_clients(): void
    {
        Medication::create(['name' => 'Test PPI', 'slug' => 'test-ppi', 'is_active' => true, 'claims' => [
            ['nutrient' => 'Magnesium', 'source_quality' => 'High', 'citations' => ['PMID:22392879']],
        ]]);
        $catalog = Medication::toMedDb();
        $this->assertSame([MedicationEvidence::MAGNESIUM_SOURCE], $catalog[0]['claims'][0]['citations']);
        $this->assertStringContainsString('does not establish', $catalog[0]['claims'][0]['notes'][0]);
    }

    public function test_a_future_checkin_is_rejected_before_any_profile_is_changed(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 28));
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum')->postJson('/api/mobile/profile', [
            'profile' => ['phone' => 'must not save'],
            'checkins' => [['dateISO' => '2099-01-01', 'adherencePct' => null]],
        ])->assertUnprocessable()->assertJsonValidationErrors('checkins.0.dateISO');
        $this->assertDatabaseMissing('user_profiles', ['user_id' => $user->id, 'phone' => 'must not save']);
        $this->assertDatabaseCount('check_ins', 0);
    }
}
