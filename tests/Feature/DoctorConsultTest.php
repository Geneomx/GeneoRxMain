<?php

namespace Tests\Feature;

use App\Models\AdminAuditLog;
use App\Models\AppointmentRequest;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The doctor directory, async questions and appointment requests.
 *
 * This feature handles patient health information and makes a claim about real
 * clinicians, so the tests concentrate on the things that would be damaging
 * rather than merely broken:
 *
 *  - one patient must never see another patient's thread
 *  - a clinician's own phone number must never reach the app
 *  - an inactive doctor must not receive new questions
 *  - a read-only admin must not be able to answer as a doctor
 *  - a request must not be silently duplicated
 */
class DoctorConsultTest extends TestCase
{
    use RefreshDatabase;

    private function admin(string $role = 'owner'): User
    {
        return User::factory()->create(['is_admin' => true, 'role' => $role]);
    }

    private function patient(): User
    {
        return User::factory()->create(['is_admin' => false]);
    }

    // ── Directory ──────────────────────────────────────────────────────────

    public function test_the_directory_lists_only_active_doctors(): void
    {
        $active = Doctor::factory()->create(['name' => 'Dr Active']);
        Doctor::factory()->inactive()->create(['name' => 'Dr Retired']);

        Sanctum::actingAs($this->patient());

        $this->getJson('/api/mobile/doctors')
            ->assertOk()
            ->assertJsonCount(1, 'doctors')
            ->assertJsonPath('doctors.0.id', $active->id)
            ->assertJsonPath('doctors.0.name', 'Dr Active');
    }

    /**
     * The most important test here. The clinician's mobile and email are stored
     * so an admin can reach them — they are not a public directory listing.
     */
    public function test_the_directory_never_exposes_a_doctors_own_contact_details(): void
    {
        Doctor::factory()->create([
            'name' => 'Dr Alvarez',
            'mobile' => '+15550001111',
            'email' => 'alvarez@clinic.example',
        ]);

        Sanctum::actingAs($this->patient());

        $body = $this->getJson('/api/mobile/doctors')->assertOk()->getContent();

        $this->assertStringNotContainsString('+15550001111', $body);
        $this->assertStringNotContainsString('alvarez@clinic.example', $body);
        $this->assertStringContainsString('Dr Alvarez', $body);
    }

    public function test_the_directory_requires_a_signed_in_user(): void
    {
        $this->getJson('/api/mobile/doctors')->assertUnauthorized();
    }

    // ── Asking a question ──────────────────────────────────────────────────

    public function test_a_patient_can_leave_a_question_with_a_mobile_number(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = $this->patient();
        Sanctum::actingAs($patient);

        $this->postJson('/api/mobile/doctor-messages', [
            'doctor_id' => $doctor->id,
            'body' => 'Should I take Metformin with food?',
            'contact_mobile' => '+15557654321',
        ])->assertCreated();

        $this->assertDatabaseHas('doctor_messages', [
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => 'new',
            'contact_mobile' => '+15557654321',
        ]);
    }

    public function test_a_question_can_be_addressed_to_any_doctor(): void
    {
        Sanctum::actingAs($this->patient());

        $this->postJson('/api/mobile/doctor-messages', [
            'body' => 'Any advice on timing my tablets?',
        ])->assertCreated();

        $this->assertDatabaseHas('doctor_messages', ['doctor_id' => null, 'status' => 'new']);
    }

    public function test_an_inactive_doctor_cannot_receive_a_new_question(): void
    {
        $retired = Doctor::factory()->inactive()->create();
        Sanctum::actingAs($this->patient());

        $this->postJson('/api/mobile/doctor-messages', [
            'doctor_id' => $retired->id,
            'body' => 'Hello?',
        ])->assertStatus(422);

        $this->assertDatabaseCount('doctor_messages', 0);
    }

    public function test_an_empty_question_is_rejected(): void
    {
        Sanctum::actingAs($this->patient());

        $this->postJson('/api/mobile/doctor-messages', ['body' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors('body');
    }

    /**
     * Patient health information. A leak here is the worst thing this feature
     * could do, so it is asserted directly rather than assumed from the scope.
     */
    public function test_a_patient_only_ever_sees_their_own_threads(): void
    {
        $mine = $this->patient();
        $theirs = $this->patient();

        DoctorMessage::create([
            'user_id' => $mine->id, 'body' => 'my own question', 'status' => 'new',
        ]);
        DoctorMessage::create([
            'user_id' => $theirs->id, 'body' => 'somebody elses private question', 'status' => 'new',
        ]);

        Sanctum::actingAs($mine);

        $res = $this->getJson('/api/mobile/doctor-messages')->assertOk();

        $res->assertJsonCount(1, 'messages');
        $this->assertStringContainsString('my own question', $res->getContent());
        $this->assertStringNotContainsString('somebody elses private question', $res->getContent());
    }

    // ── Appointment requests ───────────────────────────────────────────────

    public function test_a_patient_can_request_an_appointment(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = $this->patient();
        Sanctum::actingAs($patient);

        $this->postJson('/api/mobile/appointments', [
            'doctor_id' => $doctor->id,
            'preferred_date' => now()->addWeek()->toDateString(),
            'preferred_time' => 'morning',
            'note' => 'Follow-up about my B12 result.',
            'contact_mobile' => '+15551230000',
        ])->assertCreated();

        $this->assertDatabaseHas('appointment_requests', [
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => 'requested',
            'preferred_time' => 'morning',
        ]);
    }

    public function test_a_date_in_the_past_is_rejected(): void
    {
        Sanctum::actingAs($this->patient());

        $this->postJson('/api/mobile/appointments', [
            'preferred_date' => now()->subDay()->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors('preferred_date');
    }

    /**
     * A double tap must not put two live requests in the admin queue, or nobody
     * can tell which one is real.
     */
    public function test_a_second_open_request_is_refused(): void
    {
        $patient = $this->patient();
        Sanctum::actingAs($patient);

        $this->postJson('/api/mobile/appointments', ['note' => 'first'])->assertCreated();
        $this->postJson('/api/mobile/appointments', ['note' => 'second'])->assertStatus(409);

        $this->assertDatabaseCount('appointment_requests', 1);
    }

    public function test_a_new_request_is_allowed_once_the_previous_one_is_closed(): void
    {
        $patient = $this->patient();
        Sanctum::actingAs($patient);

        $this->postJson('/api/mobile/appointments', ['note' => 'first'])->assertCreated();
        AppointmentRequest::where('user_id', $patient->id)->update(['status' => 'done']);

        $this->postJson('/api/mobile/appointments', ['note' => 'next one'])->assertCreated();
        $this->assertDatabaseCount('appointment_requests', 2);
    }

    // ── Admin: registration ────────────────────────────────────────────────

    public function test_only_an_admin_can_reach_the_doctor_directory(): void
    {
        $this->get(route('admin.doctors'))->assertRedirect();
        $this->actingAs($this->patient())->get(route('admin.doctors'))->assertForbidden();
        $this->actingAs($this->admin())->get(route('admin.doctors'))->assertOk();
    }

    public function test_an_admin_registers_a_doctor_and_is_recorded_as_the_creator(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('admin.doctors.store'), [
            'name' => 'Dr Chen',
            'specialty' => 'Endocrinology',
            'mobile' => '+15559998888',
        ])->assertRedirect();

        $this->assertDatabaseHas('doctors', [
            'name' => 'Dr Chen',
            'is_active' => true,
            'created_by' => $admin->id,
        ]);

        // Listing someone as a clinician is a claim, so it is audited.
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'doctor.created']);
    }

    public function test_a_support_admin_cannot_register_a_doctor(): void
    {
        $this->actingAs($this->admin('support'))
            ->post(route('admin.doctors.store'), ['name' => 'Dr Nope'])
            ->assertForbidden();

        $this->assertDatabaseCount('doctors', 0);
    }

    /**
     * Deactivating must not orphan a patient's history — the answer stays
     * attached to the thread.
     */
    public function test_deactivating_a_doctor_keeps_their_existing_answers(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = $this->patient();

        $message = DoctorMessage::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'body' => 'a question',
            'reply_body' => 'an answer from the doctor',
            'status' => 'answered',
            'replied_at' => now(),
        ]);

        $this->actingAs($this->admin())
            ->post(route('admin.doctors.toggle', $doctor))
            ->assertRedirect();

        $this->assertFalse($doctor->fresh()->is_active);

        Sanctum::actingAs($patient);
        $this->getJson('/api/mobile/doctor-messages')
            ->assertOk()
            ->assertJsonPath('messages.0.reply', 'an answer from the doctor')
            ->assertJsonPath('messages.0.doctor', $doctor->name);

        $this->assertNotNull($message->fresh()->doctor_id);
    }

    // ── Admin: replying ────────────────────────────────────────────────────

    public function test_an_admin_reply_reaches_the_patient_attributed_to_the_doctor(): void
    {
        $doctor = Doctor::factory()->create(['name' => 'Dr Alvarez']);
        $patient = $this->patient();
        $admin = $this->admin();

        $message = DoctorMessage::create([
            'user_id' => $patient->id, 'body' => 'Is this normal?', 'status' => 'new',
        ]);

        $this->actingAs($admin)->post(route('admin.consults.reply', $message), [
            'reply_body' => 'Take it with food and let us review at your next visit.',
            'doctor_id' => $doctor->id,
        ])->assertRedirect();

        $fresh = $message->fresh();
        $this->assertSame('answered', $fresh->status);
        $this->assertSame($admin->id, $fresh->replied_by, 'the admin who typed it is recorded');
        $this->assertNotNull($fresh->replied_at);

        // The patient sees the doctor's name, not the admin's.
        Sanctum::actingAs($patient);
        $res = $this->getJson('/api/mobile/doctor-messages')->assertOk();
        $res->assertJsonPath('messages.0.doctor', 'Dr Alvarez');
        $this->assertStringNotContainsString($admin->email, $res->getContent());
    }

    public function test_a_support_admin_cannot_reply(): void
    {
        $patient = $this->patient();
        $message = DoctorMessage::create([
            'user_id' => $patient->id, 'body' => 'q', 'status' => 'new',
        ]);

        $this->actingAs($this->admin('support'))
            ->post(route('admin.consults.reply', $message), ['reply_body' => 'not allowed'])
            ->assertForbidden();

        $this->assertNull($message->fresh()->reply_body);
    }

    public function test_the_reply_text_is_not_copied_into_the_audit_log(): void
    {
        $patient = $this->patient();
        $message = DoctorMessage::create([
            'user_id' => $patient->id, 'body' => 'q', 'status' => 'new',
        ]);

        $secret = 'patient specific clinical detail that must not be duplicated';

        $this->actingAs($this->admin())
            ->post(route('admin.consults.reply', $message), ['reply_body' => $secret])
            ->assertRedirect();

        $logs = AdminAuditLog::all()->toJson();
        $this->assertStringNotContainsString($secret, $logs);
    }

    public function test_an_admin_responds_to_an_appointment_and_the_patient_sees_the_note(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = $this->patient();

        $request = AppointmentRequest::create([
            'user_id' => $patient->id,
            'preferred_date' => now()->addWeek()->toDateString(),
            'status' => 'requested',
        ]);

        $this->actingAs($this->admin())
            ->post(route('admin.consults.respond', $request), [
                'status' => 'confirmed',
                'admin_note' => 'Confirmed for Tuesday at 3pm instead.',
                'doctor_id' => $doctor->id,
            ])->assertRedirect();

        $this->assertSame('confirmed', $request->fresh()->status);

        Sanctum::actingAs($patient);
        $this->getJson('/api/mobile/appointments')
            ->assertOk()
            ->assertJsonPath('appointments.0.status', 'confirmed')
            ->assertJsonPath('appointments.0.response', 'Confirmed for Tuesday at 3pm instead.');
    }

    public function test_the_consult_inbox_loads_for_an_admin(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = $this->patient();
        DoctorMessage::create(['user_id' => $patient->id, 'doctor_id' => $doctor->id, 'body' => 'hello', 'status' => 'new']);
        AppointmentRequest::create(['user_id' => $patient->id, 'status' => 'requested']);

        $this->actingAs($this->admin())
            ->get(route('admin.consults'))
            ->assertOk()
            ->assertSee('hello')
            ->assertSee($doctor->name);
    }
}
