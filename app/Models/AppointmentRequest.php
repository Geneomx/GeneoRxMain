<?php

namespace App\Models;

use App\Support\DoctorSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A request for an appointment — not a booking.
 *
 * Nothing in this system can commit a clinician's calendar, so `preferred_date`
 * is what the patient would like and `status` stays 'requested' until a human
 * confirms it. The mobile client has to say that plainly, or the patient will
 * turn up on a day nobody agreed to.
 */
class AppointmentRequest extends Model
{
    use HasFactory;

    public const STATUSES = ['requested', 'confirmed', 'declined', 'done'];

    /** Coarse windows rather than exact times: the patient is not booking a slot. */
    public const TIME_WINDOWS = ['morning', 'afternoon', 'evening'];

    protected $fillable = [
        'user_id',
        'doctor_id',
        'preferred_date',
        'preferred_time',
        'slot_at',
        'slot_minutes',
        'note',
        'contact_mobile',
        'status',
        'admin_note',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'preferred_date' => 'date',
            'slot_at' => 'datetime',
            'slot_minutes' => 'integer',
            'responded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function isOpen(): bool
    {
        return $this->status === 'requested';
    }

    /** Clinic-local start of the booked slot; null for a plain request. */
    public function slotStart(): ?CarbonImmutable
    {
        return $this->slot_at?->toImmutable()->setTimezone(DoctorSchedule::timezone());
    }

    /** Clinic-local end of the booked slot; null for a plain request. */
    public function slotEnd(): ?CarbonImmutable
    {
        return $this->slotStart()?->addMinutes((int) ($this->slot_minutes ?: 0));
    }

    public function toPatientArray(): array
    {
        $start = $this->slotStart();

        return [
            'id' => $this->id,
            'doctor' => $this->doctor?->name,
            'doctor_specialty' => $this->doctor?->specialty,
            'preferred_date' => $this->preferred_date?->toDateString(),
            'preferred_time' => $this->preferred_time,
            // A booked slot, clinic wall-clock. Null on a plain request.
            'slot_at' => $start?->toIso8601String(),
            'slot_time' => $start?->format('H:i'),
            'slot_ends' => $this->slotEnd()?->format('H:i'),
            'note' => $this->note,
            'status' => $this->status,
            // The admin note is shown to the patient: it is where "Tuesday at 3
            // instead?" lives, and withholding it would make a confirmed request
            // meaningless.
            'response' => $this->admin_note,
            'responded_at' => $this->responded_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
