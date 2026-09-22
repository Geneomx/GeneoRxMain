<?php

namespace App\Support;

use App\Models\AppointmentRequest;
use App\Models\Doctor;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * A doctor's bookable grid — working days, hours and minutes per patient —
 * and which of those slots are already held.
 *
 * Everything here is in the clinic's own timezone (config clinic.timezone).
 * A slot is identified by its start. `slot_at` is stored in UTC and turned
 * back into clinic wall-clock time on the way out, so "09:30" is 09:30 at the
 * clinic on every phone and every server.
 */
final class DoctorSchedule
{
    public const DEFAULT_DAYS = [1, 2, 3, 4, 5];

    public const DEFAULT_FROM = '09:00';

    public const DEFAULT_TO = '17:00';

    public const DEFAULT_SLOT_MINUTES = 30;

    /** How far ahead a patient may book. */
    public const DAYS_AHEAD = 30;

    /** Statuses that hold a slot. Declined and done give it back. */
    public const HOLDING = ['requested', 'confirmed'];

    public static function timezone(): string
    {
        return (string) config('clinic.timezone', 'Asia/Karachi');
    }

    /** The clinic's clock now. Goes through Carbon so test clocks apply. */
    public static function now(): CarbonImmutable
    {
        return Carbon::now(self::timezone())->toImmutable();
    }

    /**
     * The next $count days from today at the clinic, for a day picker.
     *
     * @return list<array{date: string, dow: int}>
     */
    public static function upcomingDays(int $count = 14): array
    {
        $today = self::now()->startOfDay();
        $out = [];
        for ($i = 0; $i < $count; $i++) {
            $d = $today->addDays($i);
            $out[] = ['date' => $d->toDateString(), 'dow' => $d->isoWeekday()];
        }

        return $out;
    }

    /**
     * Every slot on the doctor's grid for one day, with the ones already held
     * or already gone marked, so a client can disable them rather than hide
     * them — a patient should see that 10:30 exists and is taken.
     *
     * @return array{date: string, open: bool, slots: list<array{at: string, time: string, ends: string, available: bool, reason: ?string}>}
     */
    public static function slotsFor(Doctor $doctor, string $date, ?CarbonImmutable $now = null): array
    {
        $now ??= self::now();
        $day = CarbonImmutable::parse($date, self::timezone())->startOfDay();

        if (! $doctor->hasAvailability() || ! $doctor->worksOn($day->isoWeekday())) {
            return ['date' => $day->toDateString(), 'open' => false, 'slots' => []];
        }

        $held = self::heldOn($doctor, $day);
        $minutes = (int) $doctor->slot_minutes;
        $start = $day->setTimeFromTimeString($doctor->available_from);
        $end = $day->setTimeFromTimeString($doctor->available_to);

        $slots = [];
        for ($t = $start; $t->addMinutes($minutes)->lte($end); $t = $t->addMinutes($minutes)) {
            $reason = null;
            if ($t->lt($now)) {
                $reason = 'past';
            } elseif (self::overlaps($held, $t, $minutes)) {
                $reason = 'booked';
            }
            $slots[] = [
                'at' => $t->toIso8601String(),
                'time' => $t->format('H:i'),
                'ends' => $t->addMinutes($minutes)->format('H:i'),
                'available' => $reason === null,
                'reason' => $reason,
            ];
        }

        return ['date' => $day->toDateString(), 'open' => true, 'slots' => $slots];
    }

    /** A client-supplied slot start, in clinic time. Null if it does not parse. */
    public static function parseSlot(?string $value): ?CarbonImmutable
    {
        if (! $value) {
            return null;
        }
        try {
            return CarbonImmutable::parse($value)->setTimezone(self::timezone());
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Is $at exactly one of the doctor's grid slots on its day? This is what
     * stops a client posting 09:07 on a 30-minute grid, or a time outside the
     * doctor's hours, or a day they do not work.
     */
    public static function isGridSlot(Doctor $doctor, CarbonImmutable $at): bool
    {
        if (! $doctor->hasAvailability() || ! $doctor->worksOn($at->isoWeekday())) {
            return false;
        }
        $minutes = (int) $doctor->slot_minutes;
        $day = $at->startOfDay();
        $start = $day->setTimeFromTimeString($doctor->available_from);
        $end = $day->setTimeFromTimeString($doctor->available_to);
        if ($at->lt($start) || $at->addMinutes($minutes)->gt($end)) {
            return false;
        }

        return ((int) round($start->diffInMinutes($at))) % $minutes === 0;
    }

    /**
     * Hold a slot, or throw SlotTakenException. The doctor row is locked for
     * the check-and-insert so two patients cannot both pass the check at once.
     *
     * @param  array<string, mixed>  $extra  note, contact_mobile
     */
    public static function book(User $user, Doctor $doctor, CarbonImmutable $at, array $extra = []): AppointmentRequest
    {
        return DB::transaction(function () use ($user, $doctor, $at, $extra) {
            $locked = Doctor::whereKey($doctor->id)->lockForUpdate()->firstOrFail();
            $minutes = (int) $locked->slot_minutes;

            if (self::overlaps(self::heldOn($locked, $at->startOfDay()), $at, $minutes)) {
                throw new SlotTakenException;
            }

            $appointment = AppointmentRequest::create($extra + [
                'user_id' => $user->id,
                'doctor_id' => $locked->id,
                'slot_at' => $at->utc(),
                'slot_minutes' => $minutes,
                // Kept in step for older app builds and the admin list, which
                // still read the preference columns.
                'preferred_date' => $at->toDateString(),
                'preferred_time' => self::windowFor($at),
                'status' => 'requested',
            ]);

            ConsultAlerts::bookingToDoctor($appointment->fresh());

            return $appointment;
        });
    }

    /** morning | afternoon | evening for a clinic-local time. */
    public static function windowFor(CarbonImmutable $at): string
    {
        $hour = (int) $at->format('G');

        return $hour < 12 ? 'morning' : ($hour < 17 ? 'afternoon' : 'evening');
    }

    /**
     * Held bookings that start on the given clinic-local day.
     *
     * @return Collection<int, AppointmentRequest>
     */
    private static function heldOn(Doctor $doctor, CarbonImmutable $day): Collection
    {
        return AppointmentRequest::where('doctor_id', $doctor->id)
            ->whereIn('status', self::HOLDING)
            ->whereNotNull('slot_at')
            ->whereBetween('slot_at', [$day->utc(), $day->endOfDay()->utc()])
            ->get(['id', 'slot_at', 'slot_minutes']);
    }

    /** @param  Collection<int, AppointmentRequest>  $held */
    private static function overlaps(Collection $held, CarbonImmutable $start, int $minutes): bool
    {
        $end = $start->addMinutes($minutes);
        foreach ($held as $h) {
            $hs = $h->slot_at->toImmutable();
            $he = $hs->addMinutes((int) ($h->slot_minutes ?: $minutes));
            if ($hs->lt($end) && $he->gt($start)) {
                return true;
            }
        }

        return false;
    }
}
