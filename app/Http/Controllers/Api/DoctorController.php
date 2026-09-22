<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppointmentRequest;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Support\DoctorConsults;
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
        $items = DoctorMessage::with('doctor')
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

    /** POST /api/mobile/appointments — ask for an appointment. Not a booking. */
    public function storeAppointment(Request $request): JsonResponse
    {
        $data = $request->validate(DoctorConsults::appointmentRules());

        if (! DoctorConsults::acceptsNew(DoctorConsults::doctorId($data))) {
            return response()->json(['message' => DoctorConsults::INACTIVE_APPOINTMENT], 422);
        }

        if (DoctorConsults::hasOpenRequest($request->user())) {
            return response()->json(['message' => DoctorConsults::OPEN_REQUEST], 409);
        }

        $appointment = DoctorConsults::requestAppointment($request->user(), $data);

        return response()->json(['ok' => true, 'id' => $appointment->id], 201);
    }
}
