<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppointmentRequest;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The patient side of the doctor directory. Every route here requires a
 * signed-in user (auth:sanctum) — unlike feedback, which is guest-friendly,
 * because a question to a named clinician needs an account to reply to.
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
        $data = $request->validate([
            // Nullable: "any available doctor" is a legitimate choice, and
            // forcing a pick would make the patient guess at specialties.
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'body' => ['required', 'string', 'max:4000'],
            'contact_mobile' => ['nullable', 'string', 'max:40'],
        ]);

        // An inactive doctor must not receive new questions, but existing
        // threads with them stay readable.
        if (! empty($data['doctor_id'])) {
            $active = Doctor::active()->whereKey($data['doctor_id'])->exists();
            if (! $active) {
                return response()->json([
                    'message' => 'That doctor is not currently taking questions.',
                ], 422);
            }
        }

        $message = DoctorMessage::create([
            'user_id' => $request->user()->id,
            'doctor_id' => $data['doctor_id'] ?? null,
            'body' => $data['body'],
            'contact_mobile' => $data['contact_mobile'] ?? null,
            'status' => 'new',
        ]);

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
        $data = $request->validate([
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            // today_or_after: a request for a date already gone is a mistake, not
            // a preference, and it would sit in the admin queue looking valid.
            'preferred_date' => ['nullable', 'date', 'after_or_equal:today'],
            'preferred_time' => ['nullable', 'in:'.implode(',', AppointmentRequest::TIME_WINDOWS)],
            'note' => ['nullable', 'string', 'max:2000'],
            'contact_mobile' => ['nullable', 'string', 'max:40'],
        ]);

        if (! empty($data['doctor_id'])) {
            $active = Doctor::active()->whereKey($data['doctor_id'])->exists();
            if (! $active) {
                return response()->json([
                    'message' => 'That doctor is not currently taking appointments.',
                ], 422);
            }
        }

        // One open request at a time. Without this, a patient who taps twice ends
        // up with duplicates in the admin queue and no idea which is live.
        $open = AppointmentRequest::where('user_id', $request->user()->id)
            ->where('status', 'requested')
            ->exists();

        if ($open) {
            return response()->json([
                'message' => 'You already have a request waiting for a reply.',
            ], 409);
        }

        $appointment = AppointmentRequest::create([
            'user_id' => $request->user()->id,
            'doctor_id' => $data['doctor_id'] ?? null,
            'preferred_date' => $data['preferred_date'] ?? null,
            'preferred_time' => $data['preferred_time'] ?? null,
            'note' => $data['note'] ?? null,
            'contact_mobile' => $data['contact_mobile'] ?? null,
            'status' => 'requested',
        ]);

        return response()->json(['ok' => true, 'id' => $appointment->id], 201);
    }
}
