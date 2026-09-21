<?php

namespace App\Models;

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

    public function toPatientArray(): array
    {
        return [
            'id' => $this->id,
            'doctor' => $this->doctor?->name,
            'doctor_specialty' => $this->doctor?->specialty,
            'preferred_date' => $this->preferred_date?->toDateString(),
            'preferred_time' => $this->preferred_time,
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
