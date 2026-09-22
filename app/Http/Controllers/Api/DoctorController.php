<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppointmentRequest;
use App\Models\ConsultMessage;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Support\ConsultChat;
use App\Support\DoctorConsults;
use App\Support\DoctorSchedule;
use App\Support\SlotTakenException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The patient side of the doctor directory. Every route here requires a
 * signed-in user (auth:sanctum) — unlike feedback, which is guest-friendly,
 * because a question to a named clinician needs an account to reply to.
 *
 * The rules themselves live in DoctorConsults, shared with the web portal's
 * DoctorPortalController, so the two surfaces cannot drift.
 */
class DoctorController extends Controller
{
    /** GET /api/mobile/doctors — the active directory. */
    public function index(): JsonResponse
    {
        // toPublicArray() withholds the clinician's own mobile and email. Those
        // are held so an admin can reach them, not published to every account.
        $doctors = Doctor::active()
            ->orderBy('name')
            ->get()
            ->map(fn (Doctor $d) => $d->toPublicArray())
            ->values();

        return response()->json(['doctors' => $doctors]);
    }

    /** GET /api/mobile/doctor-messages — this user's own threads, newest first. */
    public function messages(Request $request): JsonResponse
    {
        // `turns` is eager-loaded because each thread's payload carries the
        // whole conversation; without it this is fifty extra queries.
        $items = DoctorMessage::with(['doctor', 'turns'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (DoctorMessage $m) => $m->toPatientArray())
            ->values();

        return response()->json(['messages' => $items]);
    }

    /** POST /api/mobile/doctor-messages — leave a question for a doctor. */
    public function storeMessage(Request $request): JsonResponse
    {
        $data = $request->validate(DoctorConsults::messageRules());

        if (! DoctorConsults::acceptsNew(DoctorConsults::doctorId($data))) {
            return response()->json(['message' => DoctorConsults::INACTIVE_QUESTION], 422);
        }

        $message = DoctorConsults::leaveQuestion($request->user(), $data);

        return response()->json(['ok' => true, 'id' => $message->id], 201);
    }

    /**
     * POST /api/mobile/doctor-messages/{message}/reply — a follow-up.
     *
     * A patient writing again puts the thread back in the doctor's queue, so a
     * question asked after an answer is not lost.
     */
    public function replyToMessage(Request $request, DoctorMessage $message): JsonResponse
    {
        // Somebody else's conversation is not readable, let alone writable.
        abort_unless($message->user_id === $request->user()->id, 403);

        if ($message->status === 'closed') {
            return response()->json([
                'message' => 'This conversation is closed.',
                'code' => 'closed',
            ], 409);
        }

        $data = $request->validate(['body' => ['required', 'string', 'max:4000']]);

        $turn = ConsultChat::post($message, ConsultMessage::PATIENT, $request->user(), $data['body']);

        return response()->json(['ok' => true, 'id' => $turn->id], 201);
    }

    /** GET /api/mobile/appointments — this user's own requests. */
    public function appointments(Request $request): JsonResponse
    {
        $items = AppointmentRequest::with('doctor')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (AppointmentRequest $a) => $a->toPatientArray())
            ->values();

        return response()->json(['appointments' => $items]);
    }

    /**
     * GET /api/mobile/doctors/{doctor}/slots?date=YYYY-MM-DD — the doctor's
     * times for one day, with the held and past ones marked.
     */
    public function slots(Request $request, Doctor $doctor): JsonResponse
    {
        abort_unless($doctor->is_active, 404);

        $data = $request->validate(['date' => ['required', 'date_format:Y-m-d']]);

        if (DoctorConsults::dayProblem($data['date'])) {
            return response()->json(['message' => DoctorConsults::SLOT_UNAVAILABLE], 422);
        }

        return response()->json(DoctorSchedule::slotsFor($doctor, $data['date']));
    }

    /**
     * POST /api/mobile/appointments — book a slot on the doctor's grid.
     *
     * A client that sends `slot_at` holds that time (or is told it has gone).
     * Older app builds send only a day and a time of day; that stays a plain
     * request the clinic answers by hand.
     */
    public function storeAppointment(Request $request): JsonResponse
    {
        $data = $request->validate(DoctorConsults::appointmentRules());
        $doctorId = DoctorConsults::doctorId($data);

        if (! DoctorConsults::acceptsNew($doctorId)) {
            return response()->json(['message' => DoctorConsults::INACTIVE_APPOINTMENT], 422);
        }

        if (DoctorConsults::hasOpenRequest($request->user())) {
            return response()->json(['message' => DoctorConsults::OPEN_REQUEST, 'code' => 'open_request'], 409);
        }

        if (filled($data['slot_at'] ?? null)) {
            if ($doctorId === null) {
                return response()->json(['message' => DoctorConsults::SLOT_NEEDS_DOCTOR], 422);
            }
            $doctor = Doctor::findOrFail($doctorId);
            $at = DoctorSchedule::parseSlot($data['slot_at']);
            if (! $at || DoctorConsults::slotProblem($doctor, $at)) {
                return response()->json(['message' => DoctorConsults::SLOT_UNAVAILABLE], 422);
            }

            try {
                $appointment = DoctorConsults::bookSlot($request->user(), $doctor, $at, $data);
            } catch (SlotTakenException $e) {
                return response()->json(['message' => $e->getMessage(), 'code' => 'slot_taken'], 409);
            }

            return response()->json(['ok' => true, 'id' => $appointment->id], 201);
        }

        $appointment = DoctorConsults::requestAppointment($request->user(), $data);

        return response()->json(['ok' => true, 'id' => $appointment->id], 201);
    }
}
