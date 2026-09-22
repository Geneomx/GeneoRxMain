<?php

namespace App\Http\Controllers;

use App\Models\AppointmentRequest;
use App\Models\ConsultMessage;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\DoctorShare;
use App\Support\ConsultAlerts;
use App\Support\ConsultChat;
use App\Support\DoctorSchedule;
use App\Support\PatientSummary;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The doctor's own portal: their appointments and their conversations.
 *
 * Every query here is scoped to the signed-in clinician's own directory entry.
 * A doctor sees the patients who wrote to them and nobody else's — not the
 * admin inbox, not another doctor's threads, and not a patient's health
 * record. What they get is what the patient chose to send them.
 */
class ClinicController extends Controller
{
    private function doctor(Request $request): Doctor
    {
        return $request->user()->doctorProfile;
    }

    /** Today, then what is coming, then anything still waiting on them. */
    public function appointments(Request $request): View
    {
        $doctor = $this->doctor($request);
        $today = DoctorSchedule::now()->startOfDay();

        $all = AppointmentRequest::with('user')
            ->where('doctor_id', $doctor->id)
            ->whereIn('status', ['requested', 'confirmed'])
            ->orderByRaw('slot_at is null')       // booked times first
            ->orderBy('slot_at')
            ->orderBy('id')
            ->get();

        return view('clinic.appointments', [
            'doctor' => $doctor,
            'today' => $all->filter(fn (AppointmentRequest $a) => $a->slotStart()?->isSameDay($today) ?? false),
            'upcoming' => $all->filter(fn (AppointmentRequest $a) => ($s = $a->slotStart()) && $s->gt($today->endOfDay())),
            // A plain request from an older app build: no slot to sort by, so
            // it would otherwise never surface anywhere.
            'undated' => $all->filter(fn (AppointmentRequest $a) => $a->slotStart() === null),
            'past' => AppointmentRequest::with('user')
                ->where('doctor_id', $doctor->id)
                ->whereIn('status', ['declined', 'done'])
                ->latest('id')->limit(10)->get(),
            'waiting' => $all->where('status', 'requested')->count(),
            'unread' => $this->unreadCount($doctor),
        ]);
    }

    public function respondAppointment(Request $request, AppointmentRequest $appointment): RedirectResponse
    {
        $doctor = $this->doctor($request);
        abort_unless($appointment->doctor_id === $doctor->id, 403);

        $data = $request->validate([
            'status' => ['required', 'in:confirmed,declined,done'],
            // The patient sees this. A decline without a word is a dead end,
            // and declining frees the slot for somebody else.
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment->update([
            'status' => $data['status'],
            'admin_note' => $data['admin_note'] ?? $appointment->admin_note,
            'responded_at' => now(),
        ]);

        ConsultAlerts::bookingDecision($appointment->fresh(), $data['status']);

        return back()->with('clinic_success', 'appointment_'.$data['status']);
    }

    /** Their conversations, the ones needing a reply first. */
    public function messages(Request $request): View
    {
        $doctor = $this->doctor($request);

        $threads = DoctorMessage::with('user')
            ->withCount(['turns as unread_count' => fn ($q) => $q->where('sender', ConsultMessage::PATIENT)->whereNull('read_at')])
            ->where('doctor_id', $doctor->id)
            ->orderByRaw("case when status = 'new' then 0 when status = 'answered' then 1 else 2 end")
            ->latest('updated_at')
            ->paginate(20);

        return view('clinic.messages', [
            'doctor' => $doctor,
            'threads' => $threads,
            'waiting' => $this->waitingAppointments($doctor),
            'unread' => $this->unreadCount($doctor),
        ]);
    }

    public function thread(Request $request, DoctorMessage $message): View
    {
        $doctor = $this->doctor($request);
        abort_unless($message->doctor_id === $doctor->id, 403);

        // Opening the thread is what marks the patient's turns as seen.
        ConsultChat::markRead($message, ConsultMessage::DOCTOR);

        $message->load('user');

        return view('clinic.thread', [
            'doctor' => $doctor,
            'thread' => $message,
            'transcript' => ConsultChat::transcript($message),
            // Only if this patient has chosen to share it, and only while
            // they still do.
            'summary' => $message->user && DoctorShare::allows($message->user_id, $doctor->id)
                ? PatientSummary::for($message->user)
                : null,
            'waiting' => $this->waitingAppointments($doctor),
            'unread' => $this->unreadCount($doctor),
        ]);
    }

    public function reply(Request $request, DoctorMessage $message): RedirectResponse
    {
        $doctor = $this->doctor($request);
        abort_unless($message->doctor_id === $doctor->id, 403);
        abort_if($message->status === 'closed', 403, 'This conversation is closed.');

        $data = $request->validate(['body' => ['required', 'string', 'max:4000']]);

        ConsultChat::post($message, ConsultMessage::DOCTOR, $request->user(), $data['body']);

        return redirect()->route('clinic.thread', $message)->with('clinic_success', 'replied');
    }

    public function closeThread(Request $request, DoctorMessage $message): RedirectResponse
    {
        $doctor = $this->doctor($request);
        abort_unless($message->doctor_id === $doctor->id, 403);

        $message->update(['status' => 'closed']);

        return redirect()->route('clinic.messages')->with('clinic_success', 'closed');
    }

    private function waitingAppointments(Doctor $doctor): int
    {
        return AppointmentRequest::where('doctor_id', $doctor->id)->where('status', 'requested')->count();
    }

    private function unreadCount(Doctor $doctor): int
    {
        return ConsultMessage::whereHas('thread', fn ($q) => $q->where('doctor_id', $doctor->id))
            ->where('sender', ConsultMessage::PATIENT)
            ->whereNull('read_at')
            ->count();
    }
}
