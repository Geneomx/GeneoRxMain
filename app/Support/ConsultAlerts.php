<?php

namespace App\Support;

use App\Models\AppointmentRequest;
use App\Models\DoctorMessage;
use App\Services\PushService;
use Illuminate\Support\Str;

/**
 * Who gets told what, for consults and appointments.
 *
 * Kept apart from ConsultChat and DoctorSchedule so those stay about state,
 * and so there is one place to read if you want to know what the product
 * sends to people. Nothing here may throw: PushService already swallows
 * delivery failures, and the wording is built defensively.
 */
final class ConsultAlerts
{
    /** Enough to recognise the message, not enough to leak it on a lock screen. */
    private const PREVIEW = 90;

    private static function push(): PushService
    {
        return app(PushService::class);
    }

    /** A doctor answered — tell the patient. */
    public static function replyToPatient(DoctorMessage $thread, string $body): void
    {
        $who = $thread->doctor?->name ?? 'Your doctor';

        self::push()->toUser(
            $thread->user,
            $who.' replied',
            Str::limit($body, self::PREVIEW),
            ['type' => 'doctor_reply', 'thread' => $thread->id],
        );
    }

    /** A patient wrote — tell the doctor, if they have a sign-in. */
    public static function messageToDoctor(DoctorMessage $thread, string $body, bool $isFollowUp): void
    {
        $patient = $thread->user?->name ?: 'A patient';

        self::push()->toUser(
            $thread->doctor?->user,
            $isFollowUp ? $patient.' replied' : 'New question from '.$patient,
            Str::limit($body, self::PREVIEW),
            ['type' => 'patient_message', 'thread' => $thread->id],
        );
    }

    /** A patient booked a time — tell the doctor. */
    public static function bookingToDoctor(AppointmentRequest $appointment): void
    {
        $patient = $appointment->user?->name ?: 'A patient';
        $when = $appointment->slotStart()?->format('D j M, H:i');

        self::push()->toUser(
            $appointment->doctor?->user,
            'New appointment request',
            $when
                ? $patient.' booked '.$when.' ('.strtolower($appointment->modeLabel()).')'
                : $patient.' asked for an appointment',
            ['type' => 'appointment_new', 'appointment' => $appointment->id],
        );
    }

    /** The clinic answered a booking — tell the patient. */
    public static function bookingDecision(AppointmentRequest $appointment, string $status): void
    {
        $when = $appointment->slotStart()?->format('D j M, H:i');
        $who = $appointment->doctor?->name ?? 'The clinic';

        $title = match ($status) {
            'confirmed' => 'Appointment confirmed',
            'declined' => 'Appointment declined',
            default => 'Appointment updated',
        };

        $body = match ($status) {
            'confirmed' => $when ? $who.' confirmed '.$when : $who.' confirmed your appointment',
            // A decline without the reason is a dead end, and the reason is the
            // one thing the patient needs in order to do something next.
            'declined' => $appointment->admin_note
                ? Str::limit($appointment->admin_note, self::PREVIEW)
                : $who.' could not take this time. Please choose another.',
            default => $who.' updated your appointment',
        };

        self::push()->toUser(
            $appointment->user,
            $title,
            $body,
            ['type' => 'appointment_'.$status, 'appointment' => $appointment->id],
        );
    }
}
