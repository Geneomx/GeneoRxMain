<?php

namespace App\Http\Controllers;

use App\Models\AppointmentRequest;
use App\Models\ConsultMessage;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Support\ConsultChat;
use App\Support\DoctorConsults;
use App\Support\DoctorSchedule;
use App\Support\SlotTakenException;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
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
            $messages = DoctorMessage::with(['doctor', 'turns'])
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
            // The day picker: two weeks from today at the clinic. Which of them
            // a given doctor works is decided in the browser from the directory.
            'days' => DoctorSchedule::upcomingDays(14),
        ]);
    }

    /** GET /doctor/slots?doctor=ID&date=YYYY-MM-DD — same shape as the app's endpoint. */
    public function slots(Request $request): JsonResponse
    {
        abort_if(session('is_web_guest'), 403);

        $data = $request->validate([
            'doctor' => ['required', 'integer'],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);
        $doctor = Doctor::active()->findOrFail($data['doctor']);

        if (DoctorConsults::dayProblem($data['date'])) {
            return response()->json(['message' => DoctorConsults::SLOT_UNAVAILABLE], 422);
        }

        return response()->json(DoctorSchedule::slotsFor($doctor, $data['date']));
    }

    /**
     * A follow-up in an existing conversation. Posting one puts the thread
     * back in the doctor's queue.
     */
    public function replyToThread(Request $request, DoctorMessage $message): RedirectResponse
    {
        $to = redirect()->route('doctor');

        if (session('is_web_guest')) {
            return $to->with('doctor_error', 'guest');
        }

        // Somebody else's conversation is not readable, let alone writable.
        abort_unless($message->user_id === $request->user()->id, 403);

        if ($message->status === 'closed') {
            return $to->with('doctor_error', 'closed');
        }

        $data = $request->validate(['body' => ['required', 'string', 'max:4000']]);

        ConsultChat::post($message, ConsultMessage::PATIENT, $request->user(), $data['body']);

        return $to->with('doctor_sent', 'question');
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
        $doctorId = DoctorConsults::doctorId($data);

        if (! DoctorConsults::acceptsNew($doctorId)) {
            return $to->withInput()->with('doctor_error', 'inactive');
        }

        if (DoctorConsults::hasOpenRequest($request->user())) {
            return $to->with('doctor_error', 'already');
        }

        // The web form always books a time; there is no plain-request path
        // here, so a post without one is a form that was not finished.
        if ($doctorId === null) {
            return $to->withInput()->with('doctor_error', 'slot_needs_doctor');
        }
        $doctor = Doctor::findOrFail($doctorId);
        $at = DoctorSchedule::parseSlot($data['slot_at'] ?? null);
        if (! $at || DoctorConsults::slotProblem($doctor, $at)) {
            return $to->withInput()->with('doctor_error', 'slot_unavailable');
        }

        try {
            DoctorConsults::bookSlot($request->user(), $doctor, $at, $data);
        } catch (SlotTakenException) {
            return $to->withInput()->with('doctor_error', 'slot_taken');
        }

        return $to->with('doctor_sent', 'appointment');
    }
}
