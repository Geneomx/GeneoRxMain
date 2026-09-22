<?php

namespace Tests\Feature;

use App\Models\AdminAuditLog;
use App\Models\AppointmentRequest;
use App\Models\ConsultMessage;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use App\Support\ConsultChat;
use App\Support\DoctorSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * The clinician's own portal, and consults as a conversation.
 *
 * The dangerous failures here are all about reach: one doctor must never see
 * another doctor's patients, a patient must never see somebody else's thread,
 * and a deactivated clinician must lose access without their past answers
 * disappearing from the patient's history.
 */
class ClinicPortalTest extends TestCase
{
    use RefreshDatabase;

    private function patient(string $name = 'A Patient'): User
    {
        return User::factory()->create(['is_admin' => false, 'name' => $name]);
    }

    private function admin(string $role = 'owner'): User
    {
        return User::factory()->create(['is_admin' => true, 'role' => $role]);
    }

    /** A doctor with a sign-in. Returns the Doctor; its user() is the login. */
    private function doctorWithLogin(array $overrides = []): Doctor
    {
        $user = User::factory()->create(['is_admin' => false]);

        return Doctor::factory()->create($overrides + ['user_id' => $user->id]);
    }

    private function threadFor(User $patient, ?Doctor $doctor, string $body = 'Is this safe with food?'): DoctorMessage
    {
        return DoctorMessage::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor?->id,
            'body' => $body,
            'status' => 'new',
        ]);
    }

    private function booking(User $patient, Doctor $doctor, string $when = '+2 days 10:00', array $extra = []): AppointmentRequest
    {
        $at = Carbon::parse($when, DoctorSchedule::timezone());

        return AppointmentRequest::create($extra + [
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_at' => $at->copy()->utc(),
            'slot_minutes' => 30,
            'preferred_date' => $at->toDateString(),
            'status' => 'requested',
        ]);
    }

    // ── Who may enter ──────────────────────────────────────────────────────

    public function test_the_clinic_is_closed_to_everyone_who_is_not_a_doctor(): void
    {
        $this->get('/clinic')->assertRedirect('/login');

        $this->actingAs($this->patient())->get('/clinic')->assertForbidden();
        $this->actingAs($this->admin())->get('/clinic')->assertForbidden();
    }

    public function test_a_deactivated_doctor_loses_the_portal_but_not_their_past_answers(): void
    {
        $doctor = $this->doctorWithLogin(['is_active' => false]);
        $patient = $this->patient();
        $thread = $this->threadFor($patient, $doctor);
        ConsultChat::post($thread, ConsultMessage::DOCTOR, $doctor->user, 'Take it with a meal.');

        $this->actingAs($doctor->user)->get('/clinic')->assertForbidden();

        // The patient still has the answer.
        $this->actingAs($patient)->get('/doctor')->assertOk()->assertSee('Take it with a meal.');
    }

    public function test_signing_in_takes_a_doctor_to_the_clinic_and_a_patient_to_the_dashboard(): void
    {
        $doctor = $this->doctorWithLogin();
        $doctor->user->update(['password' => 'secret-pass']);

        $this->post('/login', ['email' => $doctor->user->email, 'password' => 'secret-pass'])
            ->assertRedirect('/clinic');

        $this->post('/logout');

        $patient = $this->patient();
        $patient->update(['password' => 'secret-pass']);
        $this->post('/login', ['email' => $patient->email, 'password' => 'secret-pass'])
            ->assertRedirect('/treatments');
    }

    // ── Appointments ───────────────────────────────────────────────────────

    public function test_a_doctor_sees_their_own_appointments_and_nobody_elses(): void
    {
        $mine = $this->doctorWithLogin(['name' => 'Dr Mine']);
        $theirs = $this->doctorWithLogin(['name' => 'Dr Theirs']);

        $this->booking($this->patient('My Patient'), $mine);
        $this->booking($this->patient('Their Patient'), $theirs);

        $this->actingAs($mine->user)->get('/clinic')
            ->assertOk()
            ->assertSee('My Patient')
            ->assertDontSee('Their Patient');
    }

    public function test_a_doctor_confirms_their_own_appointment_and_the_patient_sees_the_note(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patient();
        $booking = $this->booking($patient, $doctor);

        $this->actingAs($doctor->user)
            ->post("/clinic/appointments/{$booking->id}", [
                'status' => 'confirmed',
                'admin_note' => 'See you then — please bring your medication list.',
            ])
            ->assertRedirect();

        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertNotNull($booking->fresh()->responded_at);

        $this->actingAs($patient)->get('/doctor?tab=appointments')
            ->assertOk()
            ->assertSee('please bring your medication list', false);
    }

    public function test_a_doctor_cannot_answer_another_doctors_appointment(): void
    {
        $mine = $this->doctorWithLogin();
        $theirs = $this->doctorWithLogin();
        $booking = $this->booking($this->patient(), $theirs);

        $this->actingAs($mine->user)
            ->post("/clinic/appointments/{$booking->id}", ['status' => 'declined'])
            ->assertForbidden();

        $this->assertSame('requested', $booking->fresh()->status);
    }

    public function test_declining_gives_the_time_back(): void
    {
        $doctor = $this->doctorWithLogin();
        $at = Carbon::now(DoctorSchedule::timezone())->addDays(2)->setTime(10, 0);
        // A day the factory doctor works, so the grid has slots at all.
        while (! $doctor->worksOn($at->isoWeekday())) {
            $at = $at->addDay();
        }
        $booking = $this->booking($this->patient(), $doctor, $at->toDateTimeString());

        $taken = fn () => collect(DoctorSchedule::slotsFor($doctor, $at->toDateString())['slots'])
            ->firstWhere('time', '10:00')['reason'];

        $this->assertSame('booked', $taken());

        $this->actingAs($doctor->user)
            ->post("/clinic/appointments/{$booking->id}", ['status' => 'declined', 'admin_note' => 'Sorry, I am away.'])
            ->assertRedirect();

        $this->assertNull($taken());
    }

    // ── Chat ───────────────────────────────────────────────────────────────

    public function test_a_doctor_sees_their_own_threads_only(): void
    {
        $mine = $this->doctorWithLogin();
        $theirs = $this->doctorWithLogin();
        $this->threadFor($this->patient(), $mine, 'my own patients question');
        $other = $this->threadFor($this->patient(), $theirs, 'another doctors question');

        $this->actingAs($mine->user)->get('/clinic/messages')
            ->assertOk()
            ->assertSee('my own patients question')
            ->assertDontSee('another doctors question');

        $this->actingAs($mine->user)->get("/clinic/messages/{$other->id}")->assertForbidden();
        $this->actingAs($mine->user)->post("/clinic/messages/{$other->id}/reply", ['body' => 'hello'])->assertForbidden();
    }

    public function test_a_doctor_reply_reaches_the_patient_and_older_app_builds(): void
    {
        $doctor = $this->doctorWithLogin(['name' => 'Dr Chat']);
        $patient = $this->patient();
        $thread = $this->threadFor($patient, $doctor);

        $this->actingAs($doctor->user)
            ->post("/clinic/messages/{$thread->id}/reply", ['body' => 'Yes, with a meal is fine.'])
            ->assertRedirect("/clinic/messages/{$thread->id}");

        $thread->refresh();
        $this->assertSame('answered', $thread->status);
        // The single-reply field older phones read stays the newest answer.
        $this->assertSame('Yes, with a meal is fine.', $thread->reply_body);
        $this->assertSame($doctor->user->id, $thread->replied_by);

        $this->actingAs($patient)->get('/doctor')->assertOk()->assertSee('Yes, with a meal is fine.');
    }

    public function test_the_transcript_starts_with_the_patients_opening_question(): void
    {
        $doctor = $this->doctorWithLogin();
        $thread = $this->threadFor($this->patient(), $doctor, 'the opening question');
        ConsultChat::post($thread, ConsultMessage::DOCTOR, $doctor->user, 'the answer');
        ConsultChat::post($thread, ConsultMessage::PATIENT, $thread->user, 'a follow-up');

        $turns = $thread->fresh()->toPatientArray()['thread'];

        $this->assertSame(['patient', 'doctor', 'patient'], array_column($turns, 'from'));
        $this->assertSame('the opening question', $turns[0]['body']);
        $this->assertSame('a follow-up', $turns[2]['body']);
    }

    public function test_a_patient_follow_up_puts_the_thread_back_in_the_doctors_queue(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patient();
        $thread = $this->threadFor($patient, $doctor);
        ConsultChat::post($thread, ConsultMessage::DOCTOR, $doctor->user, 'Take it with a meal.');
        $this->assertSame('answered', $thread->fresh()->status);

        $this->actingAs($patient)
            ->post("/doctor/messages/{$thread->id}/reply", ['body' => 'And with coffee?'])
            ->assertRedirect('/doctor');

        $this->assertSame('new', $thread->fresh()->status);
        $this->assertSame(1, ConsultChat::unreadFor($thread->fresh(), ConsultMessage::DOCTOR));
    }

    public function test_a_patient_cannot_write_into_somebody_elses_thread(): void
    {
        $doctor = $this->doctorWithLogin();
        $thread = $this->threadFor($this->patient(), $doctor);

        $this->actingAs($this->patient())
            ->post("/doctor/messages/{$thread->id}/reply", ['body' => 'let me in'])
            ->assertForbidden();

        $this->assertSame(0, $thread->turns()->count());
    }

    public function test_opening_a_thread_marks_the_patients_turns_as_seen(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patient();
        $thread = $this->threadFor($patient, $doctor);
        ConsultChat::post($thread, ConsultMessage::PATIENT, $patient, 'one more thing');

        $this->assertSame(1, ConsultChat::unreadFor($thread, ConsultMessage::DOCTOR));

        $this->actingAs($doctor->user)->get("/clinic/messages/{$thread->id}")->assertOk();

        $this->assertSame(0, ConsultChat::unreadFor($thread->fresh(), ConsultMessage::DOCTOR));
    }

    public function test_a_closed_conversation_takes_no_more_turns_from_either_side(): void
    {
        $doctor = $this->doctorWithLogin();
        $patient = $this->patient();
        $thread = $this->threadFor($patient, $doctor);

        $this->actingAs($doctor->user)
            ->post("/clinic/messages/{$thread->id}/close")
            ->assertRedirect('/clinic/messages');
        $this->assertSame('closed', $thread->fresh()->status);

        $this->actingAs($doctor->user)
            ->post("/clinic/messages/{$thread->id}/reply", ['body' => 'one more'])
            ->assertForbidden();

        $this->actingAs($patient)
            ->post("/doctor/messages/{$thread->id}/reply", ['body' => 'one more'])
            ->assertRedirect('/doctor')
            ->assertSessionHas('doctor_error', 'closed');

        $this->assertSame(0, $thread->fresh()->turns()->count());
        $this->assertSame('closed', $thread->fresh()->status);
    }

    public function test_an_admin_answering_on_the_doctors_behalf_joins_the_same_conversation(): void
    {
        $doctor = $this->doctorWithLogin(['name' => 'Dr Absent']);
        $patient = $this->patient();
        $thread = $this->threadFor($patient, $doctor);

        $this->actingAs($this->admin())
            ->post("/admin/consults/messages/{$thread->id}/reply", ['reply_body' => 'Answered by the clinic.'])
            ->assertRedirect();

        $turns = $thread->fresh()->toPatientArray()['thread'];
        $this->assertCount(2, $turns);
        // Attributed to the doctor, not to whichever admin typed it.
        $this->assertSame('doctor', $turns[1]['from']);
        $this->assertSame('Answered by the clinic.', $thread->fresh()->reply_body);
    }

    public function test_the_reply_text_still_never_reaches_the_audit_log(): void
    {
        $doctor = $this->doctorWithLogin();
        $thread = $this->threadFor($this->patient(), $doctor);
        $secret = 'Your potassium result was 5.9 and needs a recheck.';

        $this->actingAs($this->admin())
            ->post("/admin/consults/messages/{$thread->id}/reply", ['reply_body' => $secret]);

        $this->assertDatabaseMissing('admin_audit_logs', ['meta' => json_encode(['body' => $secret])]);
        foreach (AdminAuditLog::all() as $log) {
            $this->assertStringNotContainsString('potassium', json_encode($log->toArray()));
        }
    }

    // ── Admin: handing out sign-ins ────────────────────────────────────────

    public function test_an_admin_gives_a_doctor_a_sign_in_without_ever_setting_a_password(): void
    {
        Notification::fake();
        $doctor = Doctor::factory()->create(['name' => 'Dr New', 'email' => 'new.doctor@example.test']);

        $this->actingAs($this->admin())
            ->post("/admin/doctors/{$doctor->id}/login")
            ->assertRedirect();

        $doctor->refresh();
        $this->assertTrue($doctor->hasLogin());
        $this->assertSame('new.doctor@example.test', $doctor->user->email);
        // An admin vouched for them, so they are not left in verification limbo.
        $this->assertNotNull($doctor->user->email_verified_at);
        Notification::assertSentTo($doctor->user, ResetPasswordNotification::class);

        $this->actingAs($doctor->user)->get('/clinic')->assertOk();
    }

    public function test_a_doctor_without_an_email_cannot_be_given_a_sign_in(): void
    {
        $doctor = Doctor::factory()->create(['email' => null]);

        $this->actingAs($this->admin())
            ->post("/admin/doctors/{$doctor->id}/login")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertFalse($doctor->fresh()->hasLogin());
    }

    public function test_one_account_cannot_sign_in_as_two_doctors(): void
    {
        Notification::fake();
        $shared = 'shared@example.test';
        $first = Doctor::factory()->create(['email' => $shared]);
        $second = Doctor::factory()->create(['email' => $shared]);

        $this->actingAs($this->admin())->post("/admin/doctors/{$first->id}/login")->assertRedirect();
        $this->actingAs($this->admin())->post("/admin/doctors/{$second->id}/login")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertTrue($first->fresh()->hasLogin());
        $this->assertFalse($second->fresh()->hasLogin());
    }

    public function test_a_support_admin_cannot_hand_out_a_sign_in(): void
    {
        $doctor = Doctor::factory()->create(['email' => 'nope@example.test']);

        $this->actingAs($this->admin(User::ROLE_SUPPORT))
            ->post("/admin/doctors/{$doctor->id}/login")
            ->assertForbidden();

        $this->assertFalse($doctor->fresh()->hasLogin());
    }

    public function test_revoking_a_sign_in_closes_the_portal_and_keeps_the_listing(): void
    {
        $doctor = $this->doctorWithLogin();
        $login = $doctor->user;

        $this->actingAs($this->admin())
            ->delete("/admin/doctors/{$doctor->id}/login")
            ->assertRedirect();

        $this->assertFalse($doctor->fresh()->hasLogin());
        $this->assertTrue($doctor->fresh()->is_active);
        $this->actingAs($login)->get('/clinic')->assertForbidden();
    }

    // ── Chat, call or visit ────────────────────────────────────────────────

    public function test_a_patient_chooses_chat_instead_of_a_visit(): void
    {
        $doctor = Doctor::factory()->create();
        $at = Carbon::now(DoctorSchedule::timezone())->addDays(2)->setTime(11, 0);
        while (! $doctor->worksOn($at->isoWeekday())) {
            $at = $at->addDay();
        }

        $this->actingAs($this->patient())
            ->post('/doctor/appointments', [
                'doctor_id' => $doctor->id,
                'slot_at' => $at->toIso8601String(),
                'mode' => 'chat',
            ])
            ->assertSessionHas('doctor_sent', 'appointment');

        $booking = AppointmentRequest::sole();
        $this->assertSame('chat', $booking->mode);
        $this->assertSame('Chat', $booking->modeLabel());
        $this->assertSame('chat', $booking->toPatientArray()['mode']);
    }

    public function test_an_appointment_without_a_chosen_mode_is_an_in_person_visit(): void
    {
        $doctor = Doctor::factory()->create();
        $at = Carbon::now(DoctorSchedule::timezone())->addDays(2)->setTime(11, 30);
        while (! $doctor->worksOn($at->isoWeekday())) {
            $at = $at->addDay();
        }

        $this->actingAs($this->patient())
            ->post('/doctor/appointments', ['doctor_id' => $doctor->id, 'slot_at' => $at->toIso8601String()]);

        $this->assertSame('visit', AppointmentRequest::sole()->mode);
    }

    public function test_a_made_up_mode_is_rejected(): void
    {
        $doctor = Doctor::factory()->create();

        $this->actingAs($this->patient())
            ->from('/doctor?tab=appointments')
            ->post('/doctor/appointments', ['doctor_id' => $doctor->id, 'mode' => 'telepathy'])
            ->assertSessionHasErrors('mode');

        $this->assertDatabaseCount('appointment_requests', 0);
    }

    public function test_the_doctor_sees_how_the_patient_wants_to_meet(): void
    {
        $doctor = $this->doctorWithLogin();
        $this->booking($this->patient(), $doctor, '+2 days 10:00', ['mode' => 'chat']);

        $this->actingAs($doctor->user)->get('/clinic')->assertOk()->assertSee('Chat');
    }
}
