<?php

namespace Tests\Feature;

use App\Models\AppointmentRequest;
use App\Models\CheckIn;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\DoctorShare;
use App\Models\Medication;
use App\Models\Symptom;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * A patient sharing their health summary with one named doctor.
 *
 * This is the only path by which a clinician sees anything from a patient's
 * record, so the tests are about the gates: per doctor rather than blanket,
 * revocable, and never readable by a doctor the patient has not written to.
 */
class DoctorShareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Http::fake(['exp.host/*' => Http::response(['data' => []], 200)]);
    }

    private function patient(string $name = 'A Patient'): User
    {
        return User::factory()->create(['is_admin' => false, 'name' => $name]);
    }

    private function doctorWithLogin(array $overrides = []): Doctor
    {
        $user = User::factory()->create(['is_admin' => false]);

        return Doctor::factory()->create($overrides + ['user_id' => $user->id]);
    }

    /** A patient with something worth sharing, and a thread with this doctor. */
    private function patientWithRecord(Doctor $doctor): User
    {
        $patient = $this->patient('Ayesha');
        UserProfile::create([
            'user_id' => $patient->id,
            'date_of_birth' => now()->subYears(68)->toDateString(),
            'gender' => 'female',
            'kidney_disease' => true,
        ]);
        Medication::create(['user_id' => $patient->id, 'name' => 'Metformin']);
        Symptom::create(['user_id' => $patient->id, 'symptom_name' => 'Fatigue']);
        CheckIn::create([
            'user_id' => $patient->id,
            'date_checked' => now()->subDay(),
            'adherence_percentage' => 80,
            'notes' => 'Tired in the afternoons.',
            'status' => 'active',
            'data' => [
                'wellbeing' => ['energy' => 6, 'mood' => 5, 'sleep' => 4, 'focus' => 6, 'digestive' => 8],
                'sideEffects' => ['nausea'],
            ],
        ]);
        DoctorMessage::create([
            'user_id' => $patient->id, 'doctor_id' => $doctor->id,
            'body' => 'Should I take this with food?', 'status' => 'new',
        ]);

        return $patient;
    }

    // ── The patient decides ────────────────────────────────────────────────

    public function test_a_patient_shares_and_then_stops_sharing(): void
    {
        $patient = $this->patient();
        $doctor = $this->doctorWithLogin();

        Sanctum::actingAs($patient);
        $this->postJson('/api/mobile/doctor-shares', ['doctor_id' => $doctor->id, 'shared' => true])
            ->assertOk()->assertJsonPath('shared', true);
        $this->assertTrue(DoctorShare::allows($patient->id, $doctor->id));

        $this->postJson('/api/mobile/doctor-shares', ['doctor_id' => $doctor->id, 'shared' => false])
            ->assertOk()->assertJsonPath('shared', false);
        $this->assertFalse(DoctorShare::allows($patient->id, $doctor->id));

        // Revoking keeps the row, so who once had access stays answerable.
        $this->assertDatabaseCount('doctor_shares', 1);
        $this->assertNotNull(DoctorShare::first()->revoked_at);
    }

    public function test_sharing_is_per_doctor_not_blanket(): void
    {
        $patient = $this->patient();
        $told = $this->doctorWithLogin();
        $notTold = $this->doctorWithLogin();

        Sanctum::actingAs($patient);
        $this->postJson('/api/mobile/doctor-shares', ['doctor_id' => $told->id, 'shared' => true])->assertOk();

        $this->assertTrue(DoctorShare::allows($patient->id, $told->id));
        $this->assertFalse(DoctorShare::allows($patient->id, $notTold->id));
    }

    public function test_the_directory_tells_the_patient_who_they_share_with(): void
    {
        $patient = $this->patient();
        $shared = $this->doctorWithLogin(['name' => 'Dr A']);
        $this->doctorWithLogin(['name' => 'Dr B']);
        DoctorShare::grant($patient->id, $shared->id);

        Sanctum::actingAs($patient);
        $doctors = collect($this->getJson('/api/mobile/doctors')->json('doctors'));

        $this->assertTrue($doctors->firstWhere('name', 'Dr A')['shared']);
        $this->assertFalse($doctors->firstWhere('name', 'Dr B')['shared']);
    }

    public function test_sharing_again_reopens_the_same_row(): void
    {
        $patient = $this->patient();
        $doctor = $this->doctorWithLogin();

        DoctorShare::grant($patient->id, $doctor->id);
        DoctorShare::revoke($patient->id, $doctor->id);
        DoctorShare::grant($patient->id, $doctor->id);

        $this->assertDatabaseCount('doctor_shares', 1);
        $this->assertTrue(DoctorShare::allows($patient->id, $doctor->id));
        $this->assertNull(DoctorShare::first()->revoked_at);
    }

    // ── What the doctor gets ───────────────────────────────────────────────

    public function test_a_doctor_reads_the_summary_once_it_is_shared(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($doctor);
        DoctorShare::grant($patient->id, $doctor->id);

        Sanctum::actingAs($doctor->user);
        $summary = $this->getJson("/api/mobile/clinic/patients/{$patient->id}/summary")
            ->assertOk()
            ->json('summary');

        $this->assertSame('Ayesha', $summary['patient']);
        $this->assertSame(68, $summary['age']);
        $this->assertSame(['Kidney disease'], $summary['flags']);
        $this->assertSame(['Metformin'], $summary['medications']);
        $this->assertSame(['Fatigue'], $summary['symptoms']);
        $this->assertSame(80, $summary['latest_checkin']['adherence']);
        $this->assertSame('Tired in the afternoons.', $summary['latest_checkin']['notes']);
        $this->assertTrue($summary['self_reported']);
    }

    /**
     * The single most important detail in the summary. A clinician reading a
     * zero would think the patient is in a bad way; they simply did not answer.
     */
    public function test_a_rating_the_patient_skipped_reaches_the_doctor_as_null_not_zero(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($doctor);
        DoctorShare::grant($patient->id, $doctor->id);

        Sanctum::actingAs($doctor->user);
        $ratings = $this->getJson("/api/mobile/clinic/patients/{$patient->id}/summary")
            ->json('summary.latest_checkin.ratings');

        $this->assertSame(6, $ratings['energy']);
        $this->assertSame(8, $ratings['digestive']);
        // Never rated, so never a number.
        $this->assertNull($ratings['circulation']);
        $this->assertNull($ratings['immunity']);
    }

    public function test_a_doctor_cannot_read_a_summary_that_is_not_shared(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($doctor);

        Sanctum::actingAs($doctor->user);
        $this->getJson("/api/mobile/clinic/patients/{$patient->id}/summary")
            ->assertForbidden()
            ->assertJsonPath('code', 'not_shared');
    }

    public function test_revoking_closes_the_door_again(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($doctor);
        DoctorShare::grant($patient->id, $doctor->id);

        Sanctum::actingAs($doctor->user);
        $this->getJson("/api/mobile/clinic/patients/{$patient->id}/summary")->assertOk();

        DoctorShare::revoke($patient->id, $doctor->id);

        Sanctum::actingAs($doctor->user);
        $this->getJson("/api/mobile/clinic/patients/{$patient->id}/summary")->assertForbidden();
    }

    public function test_a_doctor_the_patient_never_wrote_to_cannot_read_it_even_if_shared(): void
    {
        $mine = $this->doctorWithLogin();
        $stranger = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($mine);
        // Shared with the stranger, but the patient has never contacted them.
        DoctorShare::grant($patient->id, $stranger->id);

        Sanctum::actingAs($stranger->user);
        $this->getJson("/api/mobile/clinic/patients/{$patient->id}/summary")->assertForbidden();
    }

    public function test_a_booking_alone_is_enough_to_be_this_doctors_patient(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patient();
        AppointmentRequest::create([
            'user_id' => $patient->id, 'doctor_id' => $doctor->id, 'status' => 'requested',
        ]);
        DoctorShare::grant($patient->id, $doctor->id);

        Sanctum::actingAs($doctor->user);
        $this->getJson("/api/mobile/clinic/patients/{$patient->id}/summary")->assertOk();
    }

    public function test_a_patient_cannot_read_another_patients_summary(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($doctor);
        DoctorShare::grant($patient->id, $doctor->id);

        Sanctum::actingAs($this->patient());
        $this->getJson("/api/mobile/clinic/patients/{$patient->id}/summary")->assertForbidden();
    }

    public function test_the_thread_payload_says_whether_a_summary_is_there_to_open(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($doctor);

        Sanctum::actingAs($doctor->user);
        $this->getJson('/api/mobile/clinic/messages')
            ->assertOk()
            ->assertJsonPath('threads.0.summary_shared', false)
            ->assertJsonPath('threads.0.patient_id', $patient->id);

        DoctorShare::grant($patient->id, $doctor->id);

        $this->getJson('/api/mobile/clinic/messages')
            ->assertOk()
            ->assertJsonPath('threads.0.summary_shared', true);
    }

    // ── The web side ───────────────────────────────────────────────────────

    public function test_the_web_page_shares_and_the_doctors_thread_shows_it(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($doctor);

        $this->actingAs($patient)
            ->post('/doctor/share', ['doctor_id' => $doctor->id, 'shared' => '1'])
            ->assertRedirect('/doctor')
            ->assertSessionHas('doctor_sent', 'shared');

        $thread = DoctorMessage::where('user_id', $patient->id)->sole();

        $this->actingAs($doctor->user)->get("/clinic/messages/{$thread->id}")
            ->assertOk()
            ->assertSee('Health summary')
            ->assertSee('Metformin')
            ->assertSee('Kidney disease');
    }

    public function test_the_doctors_thread_shows_nothing_until_it_is_shared(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patientWithRecord($doctor);
        $thread = DoctorMessage::where('user_id', $patient->id)->sole();

        $this->actingAs($doctor->user)->get("/clinic/messages/{$thread->id}")
            ->assertOk()
            ->assertDontSee('Health summary')
            ->assertDontSee('Metformin');
    }

    public function test_a_guest_session_cannot_share_anything(): void
    {
        $guest = User::factory()->create(['email' => 'guest@geneorx.local']);
        $doctor = $this->doctorWithLogin();

        $this->actingAs($guest)->withSession(['is_web_guest' => true])
            ->post('/doctor/share', ['doctor_id' => $doctor->id, 'shared' => '1'])
            ->assertRedirect('/doctor')
            ->assertSessionHas('doctor_error', 'guest');

        $this->assertDatabaseCount('doctor_shares', 0);
    }
}
