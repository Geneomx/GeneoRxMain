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

    /** How the appointment happens. */
    public const MODES = ['chat', 'call', 'visit'];

    protected $fillable = [
        'user_id',
        'doctor_id',
        'preferred_date',
        'preferred_time',
        'slot_at',
        'slot_minutes',
        'mode',
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

    /** "Chat" / "Phone call" / "In person", for a human to read. */
    public function modeLabel(): string
    {
        return match ($this->mode) {
            'chat' => 'Chat',
            'call' => 'Phone call',
            default => 'In person',
        };
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

    /**
     * The clinician's view of a booking. Carries who it is with and the number
     * the patient supplied for a reply — but nothing from their health record,
     * which is theirs to share and not ours to hand over.
     *
     * @return array<string, mixed>
     */
    public function toDoctorArray(): array
    {
        $start = $this->slotStart();

        return [
            'id' => $this->id,
            'patient' => $this->user?->name,
            'patient_id' => $this->user_id,
            'contact_mobile' => $this->contact_mobile,
            'summary_shared' => DoctorShare::allows($this->user_id, $this->doctor_id),
            'preferred_date' => $this->preferred_date?->toDateString(),
            'preferred_time' => $this->preferred_time,
            'mode' => $this->mode ?? 'visit',
            'mode_label' => $this->modeLabel(),
            'slot_at' => $start?->toIso8601String(),
            'slot_date' => $start?->toDateString(),
            'slot_time' => $start?->format('H:i'),
            'slot_ends' => $this->slotEnd()?->format('H:i'),
            'note' => $this->note,
            'status' => $this->status,
            'response' => $this->admin_note,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
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
            'mode' => $this->mode ?? 'visit',
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
