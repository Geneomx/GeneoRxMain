<?php

namespace Tests\Feature;

use App\Models\AppointmentRequest;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "Ask a doctor" on the web portal. DoctorConsultTest pins the rules
 * themselves through the API; these pin what the web surface adds — a guest
 * demo session is signed in as a real account and must still be kept out, and
 * a server-rendered page can leak what a JSON endpoint withholds.
 */
class DoctorPortalTest extends TestCase
{
    use RefreshDatabase;

    private function patient(): User
    {
        return User::factory()->create(['is_admin' => false]);
    }

    /** The shared guest account, tagged the way GuestController tags it. */
    private function guestSession(): static
    {
        $guest = User::factory()->create(['email' => 'guest@geneorx.local', 'name' => 'Guest']);

        return $this->actingAs($guest)->withSession(['is_web_guest' => true]);
    }

    public function test_the_page_requires_a_signed_in_user(): void
    {
        $this->get('/doctor')->assertRedirect('/login');
    }

    public function test_a_guest_session_is_shown_the_sign_in_card_instead_of_the_forms(): void
    {
        Doctor::factory()->create(['name' => 'Dr Visible']);

        $this->guestSession()->get('/doctor')
            ->assertOk()
            ->assertSee('Sign in to ask a doctor')
            ->assertDontSee('name="body"', false)
            ->assertDontSee('Dr Visible');
    }

    public function test_a_guest_session_cannot_leave_a_question(): void
    {
        $this->guestSession()
            ->post('/doctor/messages', ['body' => 'Is this safe with food?'])
            ->assertRedirect('/doctor')
            ->assertSessionHas('doctor_error', 'guest');

        $this->assertSame(0, DoctorMessage::count());
    }

    /**
     * The most important one here. The clinician's mobile and email are held so
     * an admin can reach them; a rendered page must not print them.
     */
    public function test_the_page_lists_active_doctors_but_never_their_own_contact_details(): void
    {
        Doctor::factory()->create([
            'name' => 'Dr Listed',
            'specialty' => 'Cardiology',
            'mobile' => '+44 7700 900123',
            'email' => 'listed.private@example.com',
        ]);
        Doctor::factory()->inactive()->create(['name' => 'Dr Retired']);

        $this->actingAs($this->patient())->get('/doctor')
            ->assertOk()
            ->assertSee('Dr Listed')
            ->assertSee('Cardiology')
            ->assertDontSee('Dr Retired')
            ->assertDontSee('+44 7700 900123')
            ->assertDontSee('listed.private@example.com');
    }

    public function test_a_patient_can_leave_a_question_from_the_web(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = $this->patient();

        $this->actingAs($patient)
            ->post('/doctor/messages', [
                'doctor_id' => $doctor->id,
                'body' => 'Should I take this with food?',
                'contact_mobile' => '+92 300 1234567',
            ])
            ->assertRedirect('/doctor')
            ->assertSessionHas('doctor_sent', 'question');

        $this->assertDatabaseHas('doctor_messages', [
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'body' => 'Should I take this with food?',
            'contact_mobile' => '+92 300 1234567',
            'status' => 'new',
        ]);
    }

    public function test_any_doctor_is_the_empty_choice_on_the_web_form(): void
    {
        $patient = $this->patient();

        $this->actingAs($patient)
            ->post('/doctor/messages', ['doctor_id' => '', 'body' => 'Anyone available?'])
            ->assertRedirect('/doctor')
            ->assertSessionHas('doctor_sent', 'question');

        $this->assertDatabaseHas('doctor_messages', [
            'user_id' => $patient->id,
            'doctor_id' => null,
            'body' => 'Anyone available?',
        ]);
    }

    public function test_an_empty_question_is_rejected_on_the_web(): void
    {
        $this->actingAs($this->patient())
            ->from('/doctor')
            ->post('/doctor/messages', ['body' => ''])
            ->assertRedirect('/doctor')
            ->assertSessionHasErrors('body');

        $this->assertSame(0, DoctorMessage::count());
    }

    public function test_an_inactive_doctor_cannot_receive_a_question_from_the_web(): void
    {
        $retired = Doctor::factory()->inactive()->create();

        $this->actingAs($this->patient())
            ->post('/doctor/messages', ['doctor_id' => $retired->id, 'body' => 'Hello?'])
            ->assertRedirect('/doctor')
            ->assertSessionHas('doctor_error', 'inactive');

        $this->assertSame(0, DoctorMessage::count());
    }

    public function test_a_patient_only_sees_their_own_threads(): void
    {
        $me = $this->patient();
        $someoneElse = $this->patient();
        DoctorMessage::create(['user_id' => $me->id, 'body' => 'my own question', 'status' => 'new']);
        DoctorMessage::create(['user_id' => $someoneElse->id, 'body' => 'somebody elses question', 'status' => 'new']);

        $this->actingAs($me)->get('/doctor')
            ->assertOk()
            ->assertSee('my own question')
            ->assertDontSee('somebody elses question');
    }

    public function test_a_reply_is_shown_to_the_patient_attributed_to_the_doctor(): void
    {
        $me = $this->patient();
        $doctor = Doctor::factory()->create(['name' => 'Dr Reply']);
        DoctorMessage::create([
            'user_id' => $me->id,
            'doctor_id' => $doctor->id,
            'body' => 'q',
            'status' => 'answered',
            'reply_body' => 'Yes, with food is fine.',
            'replied_at' => now(),
        ]);

        $this->actingAs($me)->get('/doctor')
            ->assertOk()
            ->assertSee('Yes, with food is fine.')
            ->assertSee('Reply from Dr Reply');
    }

    public function test_a_patient_can_request_an_appointment_from_the_web(): void
    {
        $patient = $this->patient();
        $date = now()->addDays(3)->toDateString();

        $this->actingAs($patient)
            ->post('/doctor/appointments', [
                'preferred_date' => $date,
                'preferred_time' => 'morning',
                'note' => 'Mornings are easier for me.',
            ])
            ->assertRedirect('/doctor?tab=appointments')
            ->assertSessionHas('doctor_sent', 'appointment');

        $this->assertDatabaseHas('appointment_requests', [
            'user_id' => $patient->id,
            'preferred_time' => 'morning',
            'note' => 'Mornings are easier for me.',
            'status' => 'requested',
        ]);
    }

    public function test_a_date_in_the_past_is_rejected_on_the_web(): void
    {
        $this->actingAs($this->patient())
            ->from('/doctor?tab=appointments')
            ->post('/doctor/appointments', ['preferred_date' => now()->subDay()->toDateString()])
            ->assertRedirect('/doctor?tab=appointments')
            ->assertSessionHasErrors('preferred_date');

        $this->assertSame(0, AppointmentRequest::count());
    }

    public function test_a_second_open_request_is_refused_on_the_web(): void
    {
        $patient = $this->patient();
        AppointmentRequest::create(['user_id' => $patient->id, 'status' => 'requested']);

        $this->actingAs($patient)
            ->post('/doctor/appointments', ['preferred_time' => 'evening'])
            ->assertRedirect('/doctor?tab=appointments')
            ->assertSessionHas('doctor_error', 'already');

        $this->assertSame(1, AppointmentRequest::count());
    }

    public function test_an_open_request_replaces_the_form_with_a_waiting_card(): void
    {
        $patient = $this->patient();
        AppointmentRequest::create(['user_id' => $patient->id, 'status' => 'requested']);

        $this->actingAs($patient)->get('/doctor?tab=appointments')
            ->assertOk()
            ->assertSee('You have a request waiting')
            ->assertDontSee('name="preferred_time"', false);
    }

    public function test_the_portal_links_to_the_doctor_page(): void
    {
        $this->actingAs($this->patient())->get('/treatments')
            ->assertOk()
            ->assertSee(route('doctor'));
    }
}
