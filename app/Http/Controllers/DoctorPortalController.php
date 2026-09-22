<?php

namespace App\Http\Controllers;

use App\Models\AppointmentRequest;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Support\DoctorConsults;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * "Ask a doctor" on the web portal — the screen the mobile app has under
 * Profile, server-rendered. Plain forms rather than fetch calls: a question to
 * a clinician should survive a flaky connection, and a full page round-trip is
 * the one thing every browser gets right.
 *
 * A guest demo session is signed in as the shared guest account, so the auth
 * middleware lets it through. It is gated here instead, with a sign-in card in
 * place of the forms, because a question to a named clinician needs a real
 * account to reply to — the same rule the mobile screen applies.
 */
class DoctorPortalController extends Controller
{
    /** Quick date choices, in days from today. Mirrors the mobile chips. */
    private const QUICK_DAYS = [1, 3, 7, 14];

    public function index(Request $request): View
    {
        $guest = (bool) session('is_web_guest');
        $user = $request->user();

        // toPublicArray() withholds the clinician's own mobile and email; a
        // server-rendered page can leak what a JSON endpoint withholds, so the
        // view only ever sees this shape.
        $doctors = Doctor::active()
            ->orderBy('name')
            ->get()
            ->map(fn (Doctor $d) => $d->toPublicArray())
            ->values();

        $messages = collect();
        $appointments = collect();

        if (! $guest) {
            $messages = DoctorMessage::with('doctor')
                ->where('user_id', $user->id)
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn (DoctorMessage $m) => $m->toPatientArray())
                ->values();

            $appointments = AppointmentRequest::with('doctor')
                ->where('user_id', $user->id)
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn (AppointmentRequest $a) => $a->toPatientArray())
                ->values();
        }

        return view('doctor.index', [
            'guest' => $guest,
            'doctors' => $doctors,
            'messages' => $messages,
            'appointments' => $appointments,
            'openRequest' => $appointments->first(fn (array $a) => $a['status'] === 'requested'),
            'tab' => $request->query('tab') === 'appointments' ? 'appointments' : 'ask',
            'quickDates' => array_map(fn (int $n) => now()->addDays($n)->toDateString(), self::QUICK_DAYS),
        ]);
    }

    public function storeMessage(Request $request): RedirectResponse
    {
        $to = redirect()->route('doctor');

        if (session('is_web_guest')) {
            return $to->with('doctor_error', 'guest');
        }

        $data = $request->validate(DoctorConsults::messageRules());

        if (! DoctorConsults::acceptsNew(DoctorConsults::doctorId($data))) {
            return $to->withInput()->with('doctor_error', 'inactive');
        }

        DoctorConsults::leaveQuestion($request->user(), $data);

        return $to->with('doctor_sent', 'question');
    }

    public function storeAppointment(Request $request): RedirectResponse
    {
        $to = redirect()->route('doctor', ['tab' => 'appointments']);

        if (session('is_web_guest')) {
            return $to->with('doctor_error', 'guest');
        }

        $data = $request->validate(DoctorConsults::appointmentRules());

        if (! DoctorConsults::acceptsNew(DoctorConsults::doctorId($data))) {
            return $to->withInput()->with('doctor_error', 'inactive');
        }

        if (DoctorConsults::hasOpenRequest($request->user())) {
            return $to->with('doctor_error', 'already');
        }

        DoctorConsults::requestAppointment($request->user(), $data);

        return $to->with('doctor_sent', 'appointment');
    }
}
