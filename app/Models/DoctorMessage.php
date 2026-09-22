<?php

namespace App\Models;

use App\Support\ConsultChat;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A question a patient left for a doctor, and the reply when one comes.
 *
 * Asynchronous by design: nothing here promises a response time, and the mobile
 * client says so before the message is sent. That matters more than it looks —
 * a message box in a health app implies someone is reading it.
 */
class DoctorMessage extends Model
{
    use HasFactory;

    public const STATUSES = ['new', 'answered', 'closed'];

    protected $fillable = [
        'user_id',
        'doctor_id',
        'body',
        'contact_mobile',
        'status',
        'reply_body',
        'replied_at',
        'replied_by',
    ];

    protected function casts(): array
    {
        return [
            'replied_at' => 'datetime',
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

    public function repliedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replied_by');
    }

    /** Everything said after the opening question. */
    public function turns(): HasMany
    {
        return $this->hasMany(ConsultMessage::class);
    }

    /** The most recent thing said, for a conversation list. */
    public function latestLine(): string
    {
        return (string) ($this->turns()->latest('id')->value('body') ?? $this->body);
    }

    public function isAnswered(): bool
    {
        return filled($this->reply_body);
    }

    /**
     * The patient's own view of their thread. `replied_by` is left out on
     * purpose: the answer is attributed to the doctor, not to whichever admin
     * account happened to type it in.
     */
    /**
     * The clinician's view of a conversation: who asked, the whole transcript,
     * and how many of the patient's turns they have not opened yet.
     *
     * @return array<string, mixed>
     */
    public function toDoctorArray(): array
    {
        return [
            'id' => $this->id,
            'patient' => $this->user?->name,
            'contact_mobile' => $this->contact_mobile,
            'status' => $this->status,
            'unread' => (int) ($this->unread_count ?? ConsultChat::unreadFor($this, ConsultMessage::DOCTOR)),
            'latest' => $this->latestLine(),
            'thread' => ConsultChat::transcript($this)
                ->map(fn (ConsultMessage $m) => $m->toPatientArray())
                ->values()->all(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    public function toPatientArray(): array
    {
        return [
            'id' => $this->id,
            'doctor' => $this->doctor?->name,
            'doctor_specialty' => $this->doctor?->specialty,
            'body' => $this->body,
            'status' => $this->status,
            // The whole conversation, oldest first, opening question included.
            'thread' => ConsultChat::transcript($this)
                ->map(fn (ConsultMessage $m) => $m->toPatientArray())
                ->values()->all(),
            // The newest doctor turn. Kept for app builds that predate chat and
            // show a single reply.
            'reply' => $this->reply_body,
            'replied_at' => $this->replied_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
