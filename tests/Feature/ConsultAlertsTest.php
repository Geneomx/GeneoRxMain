<?php

namespace Tests\Feature;

use App\Models\AppointmentRequest;
use App\Models\ConsultMessage;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\User;
use App\Models\UserPushToken;
use App\Support\ConsultChat;
use App\Support\DoctorConsults;
use App\Support\DoctorSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Who gets told what.
 *
 * The app has collected push tokens since launch and nothing ever sent to
 * them, so a doctor's reply sat unseen until the patient happened to open the
 * app. These pin the four moments that now send, and — just as important —
 * that a push which cannot be delivered never breaks the thing that triggered
 * it.
 */
class ConsultAlertsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Nothing in this suite may reach the real Expo service.
        Http::preventStrayRequests();
    }

    /**
     * Stub Expo's push endpoint.
     *
     * Each test calls this once, first. Http::fake() ADDS a stub rather than
     * replacing the previous one, and the earliest matching stub wins — so a
     * default set up here in setUp() would quietly shadow anything a test
     * tried to declare afterwards.
     *
     * @param  array<string, mixed>  $body
     */
    private function fakeExpo(array $body = ['data' => []], int $status = 200): void
    {
        Http::fake(['exp.host/*' => Http::response($body, $status)]);
    }

    private function patientWithPhone(string $name = 'A Patient'): User
    {
        $user = User::factory()->create(['is_admin' => false, 'name' => $name]);
        UserPushToken::create([
            'user_id' => $user->id,
            'platform' => 'ios',
            'expo_push_token' => 'ExponentPushToken[patient-'.$user->id.']',
            'last_seen_at' => now(),
        ]);

        return $user;
    }

    private function doctorWithPhone(array $overrides = []): Doctor
    {
        $user = User::factory()->create(['is_admin' => false, 'name' => 'Dr Phone']);
        UserPushToken::create([
            'user_id' => $user->id,
            'platform' => 'android',
            'expo_push_token' => 'ExponentPushToken[doctor-'.$user->id.']',
            'last_seen_at' => now(),
        ]);

        return Doctor::factory()->create($overrides + ['user_id' => $user->id]);
    }

    /** @return array<int, array<string, mixed>> Every message posted to Expo. */
    private function sentMessages(): array
    {
        $out = [];
        foreach (Http::recorded() as [$request]) {
            /** @var Request $request */
            foreach ((array) $request->data() as $message) {
                $out[] = (array) $message;
            }
        }

        return $out;
    }

    // ── The four moments ───────────────────────────────────────────────────

    public function test_a_doctor_reply_reaches_the_patients_phone(): void
    {
        $this->fakeExpo();
        $patient = $this->patientWithPhone();
        $doctor = $this->doctorWithPhone(['name' => 'Dr Reply']);
        $thread = DoctorMessage::create([
            'user_id' => $patient->id, 'doctor_id' => $doctor->id,
            'body' => 'q', 'status' => 'new',
        ]);

        ConsultChat::post($thread, ConsultMessage::DOCTOR, $doctor->user, 'Take it with a meal.');

        $sent = $this->sentMessages();
        $this->assertCount(1, $sent);
        $this->assertSame('ExponentPushToken[patient-'.$patient->id.']', $sent[0]['to']);
        $this->assertSame('Dr Reply replied', $sent[0]['title']);
        $this->assertSame('Take it with a meal.', $sent[0]['body']);
        // The tap needs to land on the right conversation.
        $this->assertSame('doctor_reply', $sent[0]['data']['type']);
        $this->assertSame($thread->id, $sent[0]['data']['thread']);
    }

    public function test_a_new_question_reaches_the_doctors_phone(): void
    {
        $this->fakeExpo();
        $patient = $this->patientWithPhone('Ayesha');
        $doctor = $this->doctorWithPhone();

        DoctorConsults::leaveQuestion($patient, [
            'doctor_id' => $doctor->id,
            'body' => 'Should I take this with food?',
        ]);

        $sent = $this->sentMessages();
        $this->assertCount(1, $sent);
        $this->assertSame('ExponentPushToken[doctor-'.$doctor->user_id.']', $sent[0]['to']);
        $this->assertSame('New question from Ayesha', $sent[0]['title']);
    }

    public function test_a_patient_follow_up_reads_differently_from_a_first_question(): void
    {
        $this->fakeExpo();
        $patient = $this->patientWithPhone('Ayesha');
        $doctor = $this->doctorWithPhone();
        $thread = DoctorMessage::create([
            'user_id' => $patient->id, 'doctor_id' => $doctor->id,
            'body' => 'q', 'status' => 'answered', 'reply_body' => 'a', 'replied_at' => now(),
        ]);

        ConsultChat::post($thread, ConsultMessage::PATIENT, $patient, 'And with coffee?');

        $sent = $this->sentMessages();
        $this->assertCount(1, $sent);
        $this->assertSame('Ayesha replied', $sent[0]['title']);
    }

    public function test_a_booking_reaches_the_doctors_phone_with_the_time(): void
    {
        $this->fakeExpo();
        $patient = $this->patientWithPhone('Ayesha');
        $doctor = $this->doctorWithPhone();
        $at = Carbon::now(DoctorSchedule::timezone())->addDays(2)->setTime(10, 0);
        while (! $doctor->worksOn($at->isoWeekday())) {
            $at = $at->addDay();
        }

        DoctorSchedule::book($patient, $doctor, $at->toImmutable(), ['mode' => 'chat']);

        $sent = $this->sentMessages();
        $this->assertCount(1, $sent);
        $this->assertSame('New appointment request', $sent[0]['title']);
        $this->assertStringContainsString('Ayesha booked', $sent[0]['body']);
        $this->assertStringContainsString('10:00', $sent[0]['body']);
        $this->assertStringContainsString('chat', $sent[0]['body']);
    }

    public function test_a_confirmation_and_a_decline_both_reach_the_patient(): void
    {
        $this->fakeExpo();
        $patient = $this->patientWithPhone();
        $doctor = $this->doctorWithPhone(['name' => 'Dr Decide']);
        $booking = AppointmentRequest::create([
            'user_id' => $patient->id, 'doctor_id' => $doctor->id, 'status' => 'requested',
        ]);

        $this->actingAs($doctor->user)
            ->post("/clinic/appointments/{$booking->id}", ['status' => 'confirmed'])
            ->assertRedirect();
        $this->assertSame('Appointment confirmed', $this->sentMessages()[0]['title']);

        $this->actingAs($doctor->user)
            ->post("/clinic/appointments/{$booking->id}", [
                'status' => 'declined',
                'admin_note' => 'Sorry, I am away that week.',
            ])
            ->assertRedirect();

        $declined = collect($this->sentMessages())->firstWhere('title', 'Appointment declined');
        $this->assertNotNull($declined);
        // The reason is the one thing that lets the patient act, so it travels.
        $this->assertSame('Sorry, I am away that week.', $declined['body']);
    }

    // ── Nothing may break because of a notification ────────────────────────

    public function test_a_doctor_without_a_sign_in_is_simply_not_notified(): void
    {
        $this->fakeExpo();
        $patient = $this->patientWithPhone();
        $doctor = Doctor::factory()->create(['user_id' => null]);

        DoctorConsults::leaveQuestion($patient, ['doctor_id' => $doctor->id, 'body' => 'hello']);

        $this->assertSame([], $this->sentMessages());
        $this->assertDatabaseCount('doctor_messages', 1);
    }

    public function test_a_reply_still_saves_when_the_push_service_is_down(): void
    {
        $this->fakeExpo(['error' => 'gateway timeout'], 504);

        $patient = $this->patientWithPhone();
        $doctor = $this->doctorWithPhone();
        $thread = DoctorMessage::create([
            'user_id' => $patient->id, 'doctor_id' => $doctor->id, 'body' => 'q', 'status' => 'new',
        ]);

        ConsultChat::post($thread, ConsultMessage::DOCTOR, $doctor->user, 'the answer');

        $this->assertSame('answered', $thread->fresh()->status);
        $this->assertSame('the answer', $thread->fresh()->reply_body);
    }

    public function test_a_token_expo_rejects_as_gone_is_retired(): void
    {
        $this->fakeExpo(['data' => [['status' => 'error', 'details' => ['error' => 'DeviceNotRegistered']]]]);
        $patient = $this->patientWithPhone();
        $doctor = $this->doctorWithPhone();

        $thread = DoctorMessage::create([
            'user_id' => $patient->id, 'doctor_id' => $doctor->id, 'body' => 'q', 'status' => 'new',
        ]);
        ConsultChat::post($thread, ConsultMessage::DOCTOR, $doctor->user, 'the answer');

        // An uninstalled app would otherwise be retried forever.
        $this->assertNotNull(
            UserPushToken::where('user_id', $patient->id)->value('disabled_at')
        );
    }

    public function test_a_patient_with_no_phone_registered_is_skipped_without_a_call(): void
    {
        $this->fakeExpo();
        $patient = User::factory()->create(['is_admin' => false]);
        $doctor = $this->doctorWithPhone();
        $thread = DoctorMessage::create([
            'user_id' => $patient->id, 'doctor_id' => $doctor->id, 'body' => 'q', 'status' => 'new',
        ]);

        ConsultChat::post($thread, ConsultMessage::DOCTOR, $doctor->user, 'the answer');

        Http::assertNothingSent();
    }
}
