<?php

namespace App\Support;

use App\Models\AppointmentRequest;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\User;

/**
 * The patient side of the doctor directory, shared by the mobile API and the
 * web portal so the two cannot drift: one set of validation rules, one
 * definition of "this doctor is taking questions", one open-request guard.
 */
final class DoctorConsults
{
    public const INACTIVE_QUESTION = 'That doctor is not currently taking questions.';

    public const INACTIVE_APPOINTMENT = 'That doctor is not currently taking appointments.';

    public const OPEN_REQUEST = 'You already have a request waiting for a reply.';

    /** @return array<string, array<int, string>> */
    public static function messageRules(): array
    {
        return [
            // Nullable: "any available doctor" is a legitimate choice, and
            // forcing a pick would make the patient guess at specialties.
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'body' => ['required', 'string', 'max:4000'],
            'contact_mobile' => ['nullable', 'string', 'max:40'],
        ];
    }

    /** @return array<string, array<int, string>> */
    public static function appointmentRules(): array
    {
        return [
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            // A request for a date already gone is a mistake, not a preference,
            // and it would sit in the admin queue looking valid.
            'preferred_date' => ['nullable', 'date', 'after_or_equal:today'],
            'preferred_time' => ['nullable', 'in:'.implode(',', AppointmentRequest::TIME_WINDOWS)],
            'note' => ['nullable', 'string', 'max:2000'],
            'contact_mobile' => ['nullable', 'string', 'max:40'],
        ];
    }

    /**
     * The chosen doctor out of a validated payload. A web form posts "" for
     * "any doctor" and the JSON API posts null; both mean no preference.
     *
     * @param  array<string, mixed>  $data
     */
    public static function doctorId(array $data): ?int
    {
        return isset($data['doctor_id']) && $data['doctor_id'] !== '' ? (int) $data['doctor_id'] : null;
    }

    /**
     * An inactive doctor must not receive anything new, but existing threads
     * with them stay readable. No preference is always acceptable.
     */
    public static function acceptsNew(?int $doctorId): bool
    {
        if ($doctorId === null) {
            return true;
        }

        return Doctor::active()->whereKey($doctorId)->exists();
    }

    /**
     * One open request at a time. Without this, a patient who taps twice ends
     * up with duplicates in the admin queue and no idea which is live.
     */
    public static function hasOpenRequest(User $user): bool
    {
        return AppointmentRequest::where('user_id', $user->id)
            ->where('status', 'requested')
            ->exists();
    }

    /** @param  array<string, mixed>  $data  Already validated against messageRules(). */
    public static function leaveQuestion(User $user, array $data): DoctorMessage
    {
        return DoctorMessage::create([
            'user_id' => $user->id,
            'doctor_id' => self::doctorId($data),
            'body' => $data['body'],
            'contact_mobile' => $data['contact_mobile'] ?? null,
            'status' => 'new',
        ]);
    }

    /** @param  array<string, mixed>  $data  Already validated against appointmentRules(). */
    public static function requestAppointment(User $user, array $data): AppointmentRequest
    {
        return AppointmentRequest::create([
            'user_id' => $user->id,
            'doctor_id' => self::doctorId($data),
            'preferred_date' => $data['preferred_date'] ?? null,
            'preferred_time' => $data['preferred_time'] ?? null,
            'note' => $data['note'] ?? null,
            'contact_mobile' => $data['contact_mobile'] ?? null,
            'status' => 'requested',
        ]);
    }
}
