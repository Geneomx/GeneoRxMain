<?php

namespace Tests\Feature;

use App\Models\AppointmentRequest;
use App\Models\Doctor;
use App\Models\User;
use App\Support\DoctorSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Real appointment slots. The grid comes from the doctor's days, hours and
 * minutes per patient; a booking holds one slot; a held slot cannot be booked
 * again. The clock is pinned to a Monday morning at the clinic so none of this
 * depends on when the suite runs.
 */
class DoctorScheduleTest extends TestCase
{
    use RefreshDatabase;

    private const MONDAY = '2026-10-05';

    private const TUESDAY = '2026-10-06';

    private const SATURDAY = '2026-10-10';

    protected function setUp(): void
    {
        parent::setUp();
        $this->clockAt(self::MONDAY.' 08:00');
    }

    /**
     * Freeze the clock at a clinic-local time — as a UTC instant. Carbon uses
     * the frozen instance's timezone as the default for every instance it
     * creates afterwards, including Eloquent's datetime casts; freezing a
     * Karachi-zoned instance would make the stored UTC slots read back as
     * Karachi wall-clock, which is nothing production ever does.
     */
    private function clockAt(string $clinicTime): void
    {
        Carbon::setTestNow(Carbon::parse($clinicTime, DoctorSchedule::timezone())->utc());
    }

    private function doctor(array $overrides = []): Doctor
    {
        return Doctor::factory()->create($overrides + [
            'available_days' => '1,2,3,4,5',
            'available_from' => '09:00',
            'available_to' => '17:00',
            'slot_minutes' => 30,
        ]);
    }

    private function patient(): User
    {
        return User::factory()->create(['is_admin' => false]);
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true, 'role' => 'owner']);
    }

    /** A slot start the way a client sends it: ISO 8601 with the clinic offset. */
    private function at(string $date, string $time): string
    {
        return Carbon::parse("$date $time", DoctorSchedule::timezone())->toIso8601String();
    }

    private function clinic(string $date, string $time): CarbonImmutable
    {
        return CarbonImmutable::parse("$date $time", DoctorSchedule::timezone());
    }

    // ── The grid ───────────────────────────────────────────────────────────

    public function test_a_working_day_has_one_slot_per_slot_length_between_the_hours(): void
    {
        $grid = DoctorSchedule::slotsFor($this->doctor(), self::TUESDAY);

        $this->assertTrue($grid['open']);
        $this->assertCount(16, $grid['slots']); // 09:00 … 16:30
        $this->assertSame('09:00', $grid['slots'][0]['time']);
        $this->assertSame('09:30', $grid['slots'][0]['ends']);
        $this->assertSame('16:30', $grid['slots'][15]['time']);
        $this->assertTrue(collect($grid['slots'])->every(fn ($s) => $s['available']));
    }

    public function test_a_day_the_doctor_does_not_work_has_no_slots(): void
    {
        $grid = DoctorSchedule::slotsFor($this->doctor(), self::SATURDAY);

        $this->assertFalse($grid['open']);
        $this->assertSame([], $grid['slots']);
    }

    public function test_slots_already_gone_today_are_marked_past(): void
    {
        $this->clockAt(self::MONDAY.' 10:10');

        $reasons = collect(DoctorSchedule::slotsFor($this->doctor(), self::MONDAY)['slots'])->pluck('reason', 'time');

        $this->assertSame('past', $reasons['09:00']);
        $this->assertSame('past', $reasons['10:00']);
        $this->assertNull($reasons['10:30']);
    }

    public function test_a_held_booking_marks_its_slot_booked_and_a_declined_one_frees_it(): void
    {
        $doctor = $this->doctor();
        $booking = DoctorSchedule::book($this->patient(), $doctor, $this->clinic(self::TUESDAY, '09:30'));

        $reasons = collect(DoctorSchedule::slotsFor($doctor, self::TUESDAY)['slots'])->pluck('reason', 'time');
        $this->assertSame('booked', $reasons['09:30']);
        $this->assertNull($reasons['09:00']);
        $this->assertNull($reasons['10:00']);

        $booking->update(['status' => 'declined']);

        $reasons = collect(DoctorSchedule::slotsFor($doctor, self::TUESDAY)['slots'])->pluck('reason', 'time');
        $this->assertNull($reasons['09:30']);
    }

    // ── API ────────────────────────────────────────────────────────────────

    public function test_the_slots_endpoint_lists_the_doctors_times_for_a_day(): void
    {
        $doctor = $this->doctor();
        Sanctum::actingAs($this->patient());

        $this->getJson("/api/mobile/doctors/{$doctor->id}/slots?date=".self::TUESDAY)
            ->assertOk()
            ->assertJsonPath('open', true)
            ->assertJsonCount(16, 'slots')
            ->assertJsonPath('slots.0.time', '09:00')
            ->assertJsonPath('slots.0.available', true);
    }

    public function test_the_slots_endpoint_needs_a_signed_in_user_and_an_active_doctor(): void
    {
        $doctor = $this->doctor();
        $this->getJson("/api/mobile/doctors/{$doctor->id}/slots?date=".self::TUESDAY)->assertStatus(401);

        $retired = $this->doctor(['is_active' => false]);
        Sanctum::actingAs($this->patient());
        $this->getJson("/api/mobile/doctors/{$retired->id}/slots?date=".self::TUESDAY)->assertNotFound();
    }

    public function test_the_directory_tells_the_app_which_days_a_doctor_works(): void
    {
        $this->doctor(['name' => 'Dr Grid', 'available_days' => '1,3,5', 'slot_minutes' => 20]);
        Sanctum::actingAs($this->patient());

        $this->getJson('/api/mobile/doctors')
            ->assertOk()
            ->assertJsonPath('doctors.0.available_days', [1, 3, 5])
            ->assertJsonPath('doctors.0.slot_minutes', 20)
            ->assertJsonMissingPath('doctors.0.mobile');
    }

    public function test_a_patient_books_a_free_slot(): void
    {
        $doctor = $this->doctor();
        $patient = $this->patient();
        Sanctum::actingAs($patient);

        $this->postJson('/api/mobile/appointments', [
            'doctor_id' => $doctor->id,
            'slot_at' => $this->at(self::TUESDAY, '11:00'),
            'note' => 'Follow-up',
        ])->assertCreated();

        $a = AppointmentRequest::sole();
        $this->assertSame($patient->id, $a->user_id);
        $this->assertSame(30, $a->slot_minutes);
        $this->assertSame('11:00', $a->slotStart()->format('H:i'));
        $this->assertSame(self::TUESDAY, $a->preferred_date->toDateString());
        $this->assertSame('morning', $a->preferred_time);
        $this->assertSame('11:00', $a->toPatientArray()['slot_time']);
        $this->assertSame('11:30', $a->toPatientArray()['slot_ends']);
    }

    public function test_a_slot_somebody_else_holds_cannot_be_booked_again(): void
    {
        $doctor = $this->doctor();
        Sanctum::actingAs($this->patient());
        $this->postJson('/api/mobile/appointments', [
            'doctor_id' => $doctor->id,
            'slot_at' => $this->at(self::TUESDAY, '11:00'),
        ])->assertCreated();

        Sanctum::actingAs($this->patient());
        $this->postJson('/api/mobile/appointments', [
            'doctor_id' => $doctor->id,
            'slot_at' => $this->at(self::TUESDAY, '11:00'),
        ])->assertStatus(409)->assertJsonPath('code', 'slot_taken');

        $this->assertDatabaseCount('appointment_requests', 1);
    }

    public function test_a_time_off_the_grid_outside_hours_on_a_closed_day_or_without_a_doctor_is_refused(): void
    {
        $doctor = $this->doctor();
        Sanctum::actingAs($this->patient());

        foreach (['11:07', '08:30', '17:00'] as $time) {
            $this->postJson('/api/mobile/appointments', [
                'doctor_id' => $doctor->id,
                'slot_at' => $this->at(self::TUESDAY, $time),
            ])->assertStatus(422);
        }
        $this->postJson('/api/mobile/appointments', [
            'doctor_id' => $doctor->id,
            'slot_at' => $this->at(self::SATURDAY, '10:00'),
        ])->assertStatus(422);
        $this->postJson('/api/mobile/appointments', [
            'slot_at' => $this->at(self::TUESDAY, '10:00'),
        ])->assertStatus(422);

        $this->assertDatabaseCount('appointment_requests', 0);
    }

    public function test_a_slot_that_has_already_started_cannot_be_booked(): void
    {
        $doctor = $this->doctor();
        Sanctum::actingAs($this->patient());

        // The clock says Monday 08:00; last Friday is gone.
        $this->postJson('/api/mobile/appointments', [
            'doctor_id' => $doctor->id,
            'slot_at' => $this->at('2026-10-02', '10:00'),
        ])->assertStatus(422);
    }

    public function test_an_older_app_build_can_still_send_a_plain_request(): void
    {
        $doctor = $this->doctor();
        Sanctum::actingAs($this->patient());

        $this->postJson('/api/mobile/appointments', [
            'doctor_id' => $doctor->id,
            'preferred_date' => self::TUESDAY,
            'preferred_time' => 'morning',
        ])->assertCreated();

        $this->assertNull(AppointmentRequest::sole()->slot_at);
    }

    // ── Web ────────────────────────────────────────────────────────────────

    public function test_the_web_portal_serves_the_same_slots(): void
    {
        $doctor = $this->doctor();

        $this->actingAs($this->patient())
            ->getJson('/doctor/slots?doctor='.$doctor->id.'&date='.self::TUESDAY)
            ->assertOk()
            ->assertJsonCount(16, 'slots');
    }

    public function test_a_patient_books_a_slot_from_the_web_form(): void
    {
        $doctor = $this->doctor();

        $this->actingAs($this->patient())
            ->post('/doctor/appointments', [
                'doctor_id' => $doctor->id,
                'slot_at' => $this->at(self::TUESDAY, '14:00'),
                'note' => 'from the website',
            ])
            ->assertRedirect('/doctor?tab=appointments')
            ->assertSessionHas('doctor_sent', 'appointment');

        $this->assertSame('14:00', AppointmentRequest::sole()->slotStart()->format('H:i'));
    }

    public function test_the_web_form_reports_a_taken_slot(): void
    {
        $doctor = $this->doctor();
        DoctorSchedule::book($this->patient(), $doctor, $this->clinic(self::TUESDAY, '14:00'));

        $this->actingAs($this->patient())
            ->post('/doctor/appointments', [
                'doctor_id' => $doctor->id,
                'slot_at' => $this->at(self::TUESDAY, '14:00'),
            ])
            ->assertRedirect('/doctor?tab=appointments')
            ->assertSessionHas('doctor_error', 'slot_taken');

        $this->assertDatabaseCount('appointment_requests', 1);
    }

    public function test_the_web_form_needs_a_time(): void
    {
        $doctor = $this->doctor();

        $this->actingAs($this->patient())
            ->post('/doctor/appointments', ['doctor_id' => $doctor->id, 'note' => 'no time picked'])
            ->assertRedirect('/doctor?tab=appointments')
            ->assertSessionHas('doctor_error', 'slot_unavailable');

        $this->assertDatabaseCount('appointment_requests', 0);
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    public function test_an_admin_sets_a_doctors_days_hours_and_minutes_per_patient(): void
    {
        $this->actingAs($this->admin())->post('/admin/doctors', [
            'name' => 'Dr Hours',
            'available_days' => [1, 3, 5],
            'available_from' => '10:00',
            'available_to' => '13:00',
            'slot_minutes' => 20,
        ])->assertRedirect();

        $doctor = Doctor::where('name', 'Dr Hours')->sole();
        $this->assertSame([1, 3, 5], $doctor->availableDays());
        $this->assertSame('10:00', $doctor->available_from);
        $this->assertSame(20, $doctor->slot_minutes);
        $this->assertCount(9, DoctorSchedule::slotsFor($doctor, '2026-10-07')['slots']); // Wednesday, 3h in 20s
        $this->assertFalse(DoctorSchedule::slotsFor($doctor, self::TUESDAY)['open']);
    }

    public function test_hours_that_end_before_they_start_are_rejected(): void
    {
        $this->actingAs($this->admin())->from('/admin/doctors')->post('/admin/doctors', [
            'name' => 'Dr Backwards',
            'available_days' => [1],
            'available_from' => '15:00',
            'available_to' => '09:00',
            'slot_minutes' => 30,
        ])->assertRedirect('/admin/doctors')->assertSessionHasErrors('available_to');

        $this->assertDatabaseMissing('doctors', ['name' => 'Dr Backwards']);
    }

    public function test_a_doctor_registered_without_hours_gets_the_default_week(): void
    {
        $this->actingAs($this->admin())->post('/admin/doctors', ['name' => 'Dr Default'])->assertRedirect();

        $doctor = Doctor::where('name', 'Dr Default')->sole();
        $this->assertSame([1, 2, 3, 4, 5], $doctor->availableDays());
        $this->assertSame('09:00', $doctor->available_from);
        $this->assertSame('17:00', $doctor->available_to);
        $this->assertSame(30, $doctor->slot_minutes);
    }

    public function test_the_admin_inbox_shows_the_booked_time(): void
    {
        $doctor = $this->doctor(['name' => 'Dr Inbox']);
        DoctorSchedule::book($this->patient(), $doctor, $this->clinic(self::TUESDAY, '15:30'));

        $this->actingAs($this->admin())->get('/admin/consults')
            ->assertOk()
            ->assertSee('15:30')
            ->assertSee('16:00');
    }
}
