<?php

namespace Tests\Feature;

use App\Models\AppointmentRequest;
use App\Models\ConsultMessage;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\User;
use App\Support\ConsultChat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The clinician's side of the app.
 *
 * Same danger as the web portal: one doctor must never reach another doctor's
 * patients, and a patient must never reach the clinic at all. These endpoints
 * are the ones a phone talks to, so the scoping is pinned separately from the
 * browser's.
 */
class ClinicApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Replies and decisions send a push; none of it may leave the test.
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

    private function thread(User $patient, Doctor $doctor, string $body = 'a question'): DoctorMessage
    {
        return DoctorMessage::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'body' => $body,
            'status' => 'new',
        ]);
    }

    private function booking(User $patient, Doctor $doctor, array $extra = []): AppointmentRequest
    {
        return AppointmentRequest::create($extra + [
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => 'requested',
        ]);
    }

    // ── Who may reach it ───────────────────────────────────────────────────

    public function test_the_clinic_api_is_closed_to_patients_admins_and_strangers(): void
    {
        $this->getJson('/api/mobile/clinic/overview')->assertStatus(401);

        Sanctum::actingAs($this->patient());
        $this->getJson('/api/mobile/clinic/overview')->assertForbidden();
        $this->getJson('/api/mobile/clinic/appointments')->assertForbidden();
        $this->getJson('/api/mobile/clinic/messages')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['is_admin' => true, 'role' => 'owner']));
        $this->getJson('/api/mobile/clinic/overview')->assertForbidden();
    }

    public function test_a_deactivated_doctor_is_locked_out(): void
    {
        $doctor = $this->doctorWithLogin(['is_active' => false]);

        Sanctum::actingAs($doctor->user);
        $this->getJson('/api/mobile/clinic/overview')->assertForbidden();
    }

    public function test_the_profile_endpoint_tells_the_app_it_is_a_doctor(): void
    {
        $doctor = $this->doctorWithLogin(['name' => 'Dr App', 'specialty' => 'Cardiology']);

        Sanctum::actingAs($doctor->user);
        $this->getJson('/api/mobile/profile')
            ->assertOk()
            ->assertJsonPath('doctor.id', $doctor->id)
            ->assertJsonPath('doctor.name', 'Dr App')
            ->assertJsonPath('doctor.specialty', 'Cardiology');

        Sanctum::actingAs($this->patient());
        $this->getJson('/api/mobile/profile')->assertOk()->assertJsonPath('doctor', null);
    }

    // ── Appointments ───────────────────────────────────────────────────────

    public function test_a_doctor_sees_only_their_own_appointments(): void
    {
        $mine = $this->doctorWithLogin();
        $theirs = $this->doctorWithLogin();
        $this->booking($this->patient('My Patient'), $mine, ['mode' => 'chat']);
        $this->booking($this->patient('Their Patient'), $theirs);

        Sanctum::actingAs($mine->user);
        $res = $this->getJson('/api/mobile/clinic/appointments')->assertOk();

        $res->assertJsonCount(1, 'appointments')
            ->assertJsonPath('appointments.0.patient', 'My Patient')
            ->assertJsonPath('appointments.0.mode', 'chat')
            ->assertJsonPath('appointments.0.mode_label', 'Chat')
            ->assertJsonPath('waiting', 1);
    }

    public function test_a_doctor_confirms_their_own_booking_and_the_patient_is_told(): void
    {
        $doctor = $this->doctorWithLogin();
        $booking = $this->booking($this->patient(), $doctor);

        Sanctum::actingAs($doctor->user);
        $this->postJson("/api/mobile/clinic/appointments/{$booking->id}", [
            'status' => 'confirmed',
            'admin_note' => 'See you then.',
        ])->assertOk()->assertJsonPath('appointment.status', 'confirmed');

        $this->assertSame('See you then.', $booking->fresh()->admin_note);
        $this->assertNotNull($booking->fresh()->responded_at);
    }

    public function test_a_doctor_cannot_touch_another_doctors_booking(): void
    {
        $mine = $this->doctorWithLogin();
        $theirs = $this->doctorWithLogin();
        $booking = $this->booking($this->patient(), $theirs);

        Sanctum::actingAs($mine->user);
        $this->postJson("/api/mobile/clinic/appointments/{$booking->id}", ['status' => 'declined'])
            ->assertForbidden();

        $this->assertSame('requested', $booking->fresh()->status);
    }

    // ── Conversations ──────────────────────────────────────────────────────

    public function test_a_doctor_sees_only_their_own_threads_with_the_transcript(): void
    {
        $mine = $this->doctorWithLogin();
        $theirs = $this->doctorWithLogin();
        $thread = $this->thread($this->patient('Mine'), $mine, 'my own patients question');
        ConsultChat::post($thread, ConsultMessage::DOCTOR, $mine->user, 'the answer');
        $this->thread($this->patient('Theirs'), $theirs, 'another doctors question');

        Sanctum::actingAs($mine->user);
        $this->getJson('/api/mobile/clinic/messages')
            ->assertOk()
            ->assertJsonCount(1, 'threads')
            ->assertJsonPath('threads.0.patient', 'Mine')
            ->assertJsonPath('threads.0.thread.0.body', 'my own patients question')
            ->assertJsonPath('threads.0.thread.1.body', 'the answer')
            ->assertJsonPath('threads.0.latest', 'the answer');
    }

    public function test_a_doctor_cannot_read_or_answer_another_doctors_thread(): void
    {
        $mine = $this->doctorWithLogin();
        $theirs = $this->doctorWithLogin();
        $other = $this->thread($this->patient(), $theirs);

        Sanctum::actingAs($mine->user);
        $this->postJson("/api/mobile/clinic/messages/{$other->id}/reply", ['body' => 'hello'])->assertForbidden();
        $this->postJson("/api/mobile/clinic/messages/{$other->id}/read")->assertForbidden();
        $this->postJson("/api/mobile/clinic/messages/{$other->id}/close")->assertForbidden();

        $this->assertSame(0, $other->turns()->count());
    }

    public function test_replying_answers_the_thread_and_reaches_the_patient(): void
    {
        $patient = $this->patient();
        $doctor = $this->doctorWithLogin();
        $thread = $this->thread($patient, $doctor);

        Sanctum::actingAs($doctor->user);
        $this->postJson("/api/mobile/clinic/messages/{$thread->id}/reply", ['body' => 'Take it with a meal.'])
            ->assertCreated()
            ->assertJsonPath('thread.status', 'answered');

        $thread->refresh();
        $this->assertSame('Take it with a meal.', $thread->reply_body);
        $this->assertSame($doctor->user_id, $thread->replied_by);

        // And the patient's own app sees it.
        Sanctum::actingAs($patient);
        $this->getJson('/api/mobile/doctor-messages')
            ->assertOk()
            ->assertJsonPath('messages.0.thread.1.body', 'Take it with a meal.');
    }

    public function test_opening_a_thread_clears_its_unread_count(): void
    {
        $patient = $this->patient();
        $doctor = $this->doctorWithLogin();
        $thread = $this->thread($patient, $doctor);
        ConsultChat::post($thread, ConsultMessage::PATIENT, $patient, 'one more thing');

        Sanctum::actingAs($doctor->user);
        $this->getJson('/api/mobile/clinic/overview')->assertOk()->assertJsonPath('unread', 1);

        $this->postJson("/api/mobile/clinic/messages/{$thread->id}/read")
            ->assertOk()
            ->assertJsonPath('unread', 0);
    }

    public function test_a_closed_conversation_refuses_a_reply(): void
    {
        $doctor = $this->doctorWithLogin();
        $thread = $this->thread($this->patient(), $doctor);

        Sanctum::actingAs($doctor->user);
        $this->postJson("/api/mobile/clinic/messages/{$thread->id}/close")->assertOk();
        $this->assertSame('closed', $thread->fresh()->status);

        $this->postJson("/api/mobile/clinic/messages/{$thread->id}/reply", ['body' => 'one more'])
            ->assertStatus(409)
            ->assertJsonPath('code', 'closed');
    }

    public function test_a_doctor_is_not_handed_a_patients_health_record(): void
    {
        $patient = $this->patient();
        $doctor = $this->doctorWithLogin();
        $this->thread($patient, $doctor);
        $this->booking($patient, $doctor, ['note' => 'just this note']);

        Sanctum::actingAs($doctor->user);
        $threads = $this->getJson('/api/mobile/clinic/messages')->json('threads.0');
        $appointment = $this->getJson('/api/mobile/clinic/appointments')->json('appointments.0');

        // What the patient chose to send, and nothing else.
        foreach (['medications', 'symptoms', 'checkins', 'email'] as $forbidden) {
            $this->assertArrayNotHasKey($forbidden, $threads);
            $this->assertArrayNotHasKey($forbidden, $appointment);
        }
    }
}
