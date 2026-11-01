<?php

namespace Tests\Feature;

use App\Models\CheckIn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MedicationTrackingUpgradeTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(): User
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('tracking-test')->plainTextToken);

        return $user;
    }

    public function test_medication_details_survive_reload_legacy_resave_and_explicit_clear(): void
    {
        $this->signIn();
        $med = ['medId' => 'metformin', 'dose' => 'medium', 'durationMonths' => 1];
        $this->postJson('/api/mobile/profile', ['medications' => [$med + ['strength' => '500 mg', 'frequency' => 'Twice daily', 'startDate' => '2026-10-01']]])->assertOk();
        $this->getJson('/api/mobile/profile')->assertOk()->assertJsonPath('medications.0.strength', '500 mg')->assertJsonPath('medications.0.frequency', 'Twice daily')->assertJsonPath('medications.0.startDate', '2026-10-01');
        $this->postJson('/api/mobile/profile', ['medications' => [$med]])->assertOk();
        $this->getJson('/api/mobile/profile')->assertJsonPath('medications.0.strength', '500 mg');
        $this->postJson('/api/mobile/profile', ['medications' => [$med + ['strength' => '', 'frequency' => '', 'startDate' => '']]])->assertOk();
        $this->getJson('/api/mobile/profile')->assertJsonPath('medications.0.strength', null)->assertJsonPath('medications.0.startDate', null);
    }

    public function test_unknown_model_inputs_remain_unknown_after_account_sync(): void
    {
        $this->signIn();
        $this->postJson('/api/mobile/profile', ['medications' => [[
            'medId' => 'metformin', 'dose' => 'unknown', 'durationMonths' => 0,
            'startDate' => '2026-10-01', 'modelInputsConfirmed' => false,
        ]]])->assertOk();
        $this->getJson('/api/mobile/profile')->assertJsonPath('medications.0.dose', 'unknown')
            ->assertJsonPath('medications.0.modelInputsConfirmed', false);
    }

    public function test_unknown_is_not_zero_and_replaying_a_client_id_is_idempotent(): void
    {
        $user = $this->signIn();
        $entry = ['clientId' => '11111111-1111-4111-8111-111111111111', 'dateISO' => '2026-10-20', 'adherencePct' => 0, 'notes' => '', 'medicationDoses' => [['medId' => 'a', 'medicationName' => 'Medicine A', 'status' => 'unsure']]];
        $this->postJson('/api/mobile/profile', ['checkins' => [$entry]])->assertOk();
        $this->postJson('/api/mobile/profile', ['checkins' => [$entry]])->assertOk();
        $this->assertSame(1, CheckIn::where('user_id', $user->id)->count());
        $this->assertNull(CheckIn::first()->adherence_percentage);
        $this->getJson('/api/mobile/profile')->assertJsonPath('checkins.0.adherencePct', null)->assertJsonPath('checkins.0.medicationDoses.0.status', 'unsure');
        $entry['clientId'] = '22222222-2222-4222-8222-222222222222';
        $this->postJson('/api/mobile/profile', ['checkins' => [$entry]])->assertOk();
        $this->assertSame(2, CheckIn::where('user_id', $user->id)->count());
    }

    public function test_dose_counts_are_validated_before_any_profile_change_and_recomputed_server_side(): void
    {
        $user = $this->signIn();
        $this->postJson('/api/mobile/profile', ['profile' => ['phone' => 'original']])->assertOk();
        $entry = ['dateISO' => '2026-10-20', 'adherencePct' => 100, 'medicationDoses' => [['medId' => 'a', 'medicationName' => 'Medicine A', 'status' => 'some', 'scheduled' => 7, 'missed' => 8]]];
        $this->postJson('/api/mobile/profile', ['profile' => ['phone' => 'changed'], 'checkins' => [$entry]])->assertUnprocessable();
        $this->assertDatabaseHas('user_profiles', ['user_id' => $user->id, 'phone' => 'original']);
        $entry['medicationDoses'][0]['missed'] = 1;
        $this->postJson('/api/mobile/profile', ['checkins' => [$entry]])->assertOk();
        $this->getJson('/api/mobile/profile')->assertJsonPath('checkins.0.adherencePct', 86);
    }

    public function test_symptom_onset_severity_and_notes_survive_reload(): void
    {
        $this->signIn();
        $details = ['Fatigue' => ['onsetDate' => '2026-10-01', 'severity' => 'mild', 'notes' => 'Afternoon']];
        $this->postJson('/api/mobile/profile', ['symptoms' => [['name' => 'Fatigue']], 'portal_state' => ['symptoms' => ['custom' => [], 'severity' => 'mild', 'details' => $details]]])->assertOk();
        $this->getJson('/api/mobile/profile')->assertJsonPath('portal_state.symptoms.details', $details);
    }

    public function test_mobile_and_backend_use_the_same_reviewed_source_links(): void
    {
        $this->assertSame(json_decode(file_get_contents(resource_path('data/symptom-references.json')), true), json_decode(file_get_contents(base_path('mobile/src/content/symptomReferences.json')), true));
    }

    public function test_summary_overviews_persist_per_range_and_reject_invalid_edits_atomically(): void
    {
        $this->signIn();
        $this->postJson('/api/mobile/profile', ['portal_state' => ['summaryOverview' => ['7' => 'My weekly overview', '30' => 'My monthly overview']]])->assertOk();
        $this->getJson('/api/mobile/profile')->assertJsonPath('portal_state.summaryOverview.7', 'My weekly overview')->assertJsonPath('portal_state.summaryOverview.30', 'My monthly overview');
        $this->postJson('/api/mobile/profile', ['portal_state' => ['summaryOverview' => ['7' => str_repeat('x', 2001), '30' => 'Should not save']]])->assertUnprocessable();
        $this->getJson('/api/mobile/profile')->assertJsonPath('portal_state.summaryOverview.30', 'My monthly overview');
        $this->postJson('/api/mobile/profile', ['portal_state' => ['summaryOverview' => ['unsupported' => 'Not a date range']]])->assertUnprocessable();
    }

    public function test_data_less_check_in_rows_are_hydrated_with_a_full_typed_envelope(): void
    {
        $user = $this->signIn();
        CheckIn::factory()->for($user)->create(['data' => null, 'date_checked' => '2026-10-20 09:00:00', 'adherence_percentage' => 70, 'notes' => 'Legacy row']);
        CheckIn::factory()->for($user)->create(['data' => [], 'date_checked' => '2026-10-19 09:00:00', 'adherence_percentage' => null, 'notes' => '']);

        $response = $this->getJson('/api/mobile/profile')->assertOk()->assertJsonCount(2, 'checkins');
        foreach ([0, 1] as $i) {
            $response->assertJsonPath("checkins.$i.symptoms.items", [])
                ->assertJsonPath("checkins.$i.supplementsTaken", [])
                ->assertJsonPath("checkins.$i.supplementsPlanned", [])
                ->assertJsonPath("checkins.$i.sideEffects", '')
                ->assertJsonPath("checkins.$i.medicationDoses", []);
            foreach (['energy', 'mood', 'sleep', 'focus', 'digestive', 'circulation', 'immunity'] as $key) {
                $this->assertArrayHasKey($key, $response->json("checkins.$i.wellbeing"));
                $response->assertJsonPath("checkins.$i.wellbeing.$key", null);
            }
        }
        $response->assertJsonPath('checkins.0.adherencePct', 70)->assertJsonPath('checkins.0.notes', 'Legacy row')
            ->assertJsonPath('checkins.1.adherencePct', null)->assertJsonPath('checkins.1.dateISO', fn ($v) => str_starts_with($v, '2026-10-19'));
    }

    public function test_stored_check_in_values_win_over_envelope_defaults(): void
    {
        $user = $this->signIn();
        CheckIn::factory()->for($user)->create(['data' => [
            'symptoms' => ['items' => [['id' => 'Fatigue', 'rating' => 2]], 'improvementScore' => 1],
            'wellbeing' => ['energy' => 5],
            'sideEffects' => ['Nausea'],
            'supplementsTaken' => ['Vitamin D'],
        ]]);

        $this->getJson('/api/mobile/profile')->assertOk()
            ->assertJsonPath('checkins.0.symptoms.items.0.id', 'Fatigue')
            ->assertJsonPath('checkins.0.symptoms.improvementScore', 1)
            ->assertJsonPath('checkins.0.wellbeing.energy', 5)
            ->assertJsonPath('checkins.0.wellbeing.digestive', null)
            ->assertJsonPath('checkins.0.sideEffects', ['Nausea'])
            ->assertJsonPath('checkins.0.supplementsTaken', ['Vitamin D'])
            ->assertJsonPath('checkins.0.supplementsPlanned', [])
            ->assertJsonPath('checkins.0.medicationDoses', []);
    }

    public function test_numeric_string_dose_counts_are_stored_as_integers(): void
    {
        $user = $this->signIn();
        $entry = ['dateISO' => '2026-10-21', 'medicationDoses' => [
            ['medId' => 'a', 'medicationName' => 'Medicine A', 'status' => 'some', 'scheduled' => '7', 'missed' => '1'],
            ['medId' => 'b', 'medicationName' => 'Medicine B', 'status' => 'all', 'scheduled' => '14'],
        ]];
        $this->postJson('/api/mobile/profile', ['checkins' => [$entry]])->assertOk();

        $stored = CheckIn::where('user_id', $user->id)->firstOrFail()->data['medicationDoses'];
        $this->assertSame(7, $stored[0]['scheduled']);
        $this->assertSame(1, $stored[0]['missed']);
        $this->assertSame(14, $stored[1]['scheduled']);
        $this->assertArrayNotHasKey('missed', $stored[1]);
        $this->getJson('/api/mobile/profile')
            ->assertJsonPath('checkins.0.medicationDoses.0.scheduled', 7)
            ->assertJsonPath('checkins.0.medicationDoses.0.missed', 1)
            ->assertJsonPath('checkins.0.adherencePct', 95);
    }

    public function test_skipped_wellbeing_stays_unknown_after_sync_and_rejects_invalid_ratings(): void
    {
        $this->signIn();
        $entry = ['clientId' => '99999999-1111-4111-8111-111111111111', 'dateISO' => '2026-10-27', 'adherencePct' => null, 'wellbeing' => ['energy' => null, 'mood' => null, 'sleep' => 0, 'focus' => null]];
        $this->postJson('/api/mobile/profile', ['checkins' => [$entry]])->assertOk();
        $this->getJson('/api/mobile/profile')->assertJsonPath('checkins.0.wellbeing.energy', null)->assertJsonPath('checkins.0.wellbeing.sleep', 0);
        $entry['wellbeing']['energy'] = 11;
        $this->postJson('/api/mobile/profile', ['checkins' => [$entry]])->assertUnprocessable();
    }
}
