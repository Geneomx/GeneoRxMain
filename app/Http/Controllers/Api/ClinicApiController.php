<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppointmentRequest;
use App\Models\ConsultMessage;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\DoctorShare;
use App\Models\User;
use App\Support\ConsultAlerts;
use App\Support\ConsultChat;
use App\Support\PatientSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The clinician's own side of the app — the same thing /clinic gives them in
 * a browser.
 *
 * Every query is scoped to the signed-in clinician's own directory entry.
 * Another doctor's patient is a 403, not a filtered list. A doctor sees who
 * wrote to them and the number that patient supplied for a reply; they do not
 * see a patient's health record unless the patient has shared it.
 */
class ClinicApiController extends Controller
{
    private function doctor(Request $request): Doctor
    {
        return $request->user()->doctorProfile;
    }

    /** GET /api/mobile/clinic/overview — who am I, and what is waiting. */
    public function overview(Request $request): JsonResponse
    {
        $doctor = $this->doctor($request);

        return response()->json([
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialty' => $doctor->specialty,
            ],
            'waiting' => $this->waitingCount($doctor),
            'unread' => $this->unreadCount($doctor),
        ]);
    }

    // ── Appointments ───────────────────────────────────────────────────────

    /** GET /api/mobile/clinic/appointments — live ones, then recently finished. */
    public function appointments(Request $request): JsonResponse
    {
        $doctor = $this->doctor($request);

        $live = AppointmentRequest::with('user')
            ->where('doctor_id', $doctor->id)
            ->whereIn('status', ['requested', 'confirmed'])
            ->orderByRaw('slot_at is null')     // booked times first
            ->orderBy('slot_at')
            ->orderBy('id')
            ->get();

        $finished = AppointmentRequest::with('user')
            ->where('doctor_id', $doctor->id)
            ->whereIn('status', ['declined', 'done'])
            ->latest('id')
            ->limit(10)
            ->get();

        return response()->json([
            'appointments' => $live->concat($finished)
                ->map(fn (AppointmentRequest $a) => $a->toDoctorArray())
                ->values(),
            'waiting' => $this->waitingCount($doctor),
            'unread' => $this->unreadCount($doctor),
        ]);
    }

    /** POST /api/mobile/clinic/appointments/{appointment} — confirm, decline, done. */
    public function respondAppointment(Request $request, AppointmentRequest $appointment): JsonResponse
    {
        abort_unless($appointment->doctor_id === $this->doctor($request)->id, 403);

        $data = $request->validate([
            'status' => ['required', 'in:confirmed,declined,done'],
            // The patient reads this. Declining without a word is a dead end,
            // and declining frees the time for somebody else.
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment->update([
            'status' => $data['status'],
            'admin_note' => $data['admin_note'] ?? $appointment->admin_note,
            'responded_at' => now(),
        ]);

        ConsultAlerts::bookingDecision($appointment->fresh(), $data['status']);

        return response()->json(['ok' => true, 'appointment' => $appointment->fresh()->toDoctorArray()]);
    }

    // ── Conversations ──────────────────────────────────────────────────────

    /** GET /api/mobile/clinic/messages — the ones waiting on them first. */
    public function messages(Request $request): JsonResponse
    {
        $doctor = $this->doctor($request);

        $threads = DoctorMessage::with(['user', 'turns'])
            ->withCount(['turns as unread_count' => fn ($q) => $q->where('sender', ConsultMessage::PATIENT)->whereNull('read_at')])
            ->where('doctor_id', $doctor->id)
            ->orderByRaw("case when status = 'new' then 0 when status = 'answered' then 1 else 2 end")
            ->latest('updated_at')
            ->limit(50)
            ->get();

        return response()->json([
            'threads' => $threads->map(fn (DoctorMessage $m) => $m->toDoctorArray())->values(),
            'waiting' => $this->waitingCount($doctor),
            'unread' => $this->unreadCount($doctor),
        ]);
    }

    /** POST /api/mobile/clinic/messages/{message}/read — opening a conversation. */
    public function markRead(Request $request, DoctorMessage $message): JsonResponse
    {
        abort_unless($message->doctor_id === $this->doctor($request)->id, 403);

        ConsultChat::markRead($message, ConsultMessage::DOCTOR);

        return response()->json(['ok' => true, 'unread' => $this->unreadCount($this->doctor($request))]);
    }

    /** POST /api/mobile/clinic/messages/{message}/reply */
    public function reply(Request $request, DoctorMessage $message): JsonResponse
    {
        abort_unless($message->doctor_id === $this->doctor($request)->id, 403);

        if ($message->status === 'closed') {
            return response()->json(['message' => 'This conversation is closed.', 'code' => 'closed'], 409);
        }

        $data = $request->validate(['body' => ['required', 'string', 'max:4000']]);

        ConsultChat::post($message, ConsultMessage::DOCTOR, $request->user(), $data['body']);

        return response()->json(['ok' => true, 'thread' => $message->fresh()->load('turns')->toDoctorArray()], 201);
    }

    /** POST /api/mobile/clinic/messages/{message}/close */
    public function close(Request $request, DoctorMessage $message): JsonResponse
    {
        abort_unless($message->doctor_id === $this->doctor($request)->id, 403);

        $message->update(['status' => 'closed']);

        return response()->json(['ok' => true]);
    }

    /**
     * GET /api/mobile/clinic/patients/{user}/summary
     *
     * Only what that patient chose to share, and only while they still share
     * it. Two gates: the patient must have granted this doctor access, and
     * the patient must actually be one of this doctor's own.
     */
    public function patientSummary(Request $request, User $user): JsonResponse
    {
        $doctor = $this->doctor($request);

        abort_unless($this->isMyPatient($doctor, $user), 403);

        if (! DoctorShare::allows($user->id, $doctor->id)) {
            return response()->json(['message' => 'This patient has not shared their profile.', 'code' => 'not_shared'], 403);
        }

        return response()->json(['summary' => PatientSummary::for($user)]);
    }

    /** Somebody who has written to, or booked with, this doctor. */
    private function isMyPatient(Doctor $doctor, User $user): bool
    {
        return DoctorMessage::where('doctor_id', $doctor->id)->where('user_id', $user->id)->exists()
            || AppointmentRequest::where('doctor_id', $doctor->id)->where('user_id', $user->id)->exists();
    }

    private function waitingCount(Doctor $doctor): int
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
