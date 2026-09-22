<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One turn in a consult conversation.
 *
 * `sender` is the side, not the account: an admin answering on a doctor's
 * behalf writes a 'doctor' turn, because that is what the patient is owed —
 * an answer attributed to the clinician. `user_id` records who actually typed
 * it, so the attribution stays honest internally.
 */
class ConsultMessage extends Model
{
    use HasFactory;

    public const PATIENT = 'patient';

    public const DOCTOR = 'doctor';

    protected $fillable = [
        'doctor_message_id',
        'sender',
        'user_id',
        'body',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(DoctorMessage::class, 'doctor_message_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function fromDoctor(): bool
    {
        return $this->sender === self::DOCTOR;
    }

    /** @return array<string, mixed> */
    public function toPatientArray(): array
    {
        return [
            'id' => $this->id,
            'from' => $this->sender,
            'body' => $this->body,
            'at' => $this->created_at?->toIso8601String(),
        ];
    }
}
