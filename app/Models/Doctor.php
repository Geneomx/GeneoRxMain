<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A clinician in the directory. Created by an admin only — there is no
 * self-registration route, because listing someone as a doctor is a claim the
 * business is making on their behalf.
 */
class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'specialty',
        'mobile',
        'email',
        'bio',
        'is_active',
        'created_by',
        'available_days',
        'available_from',
        'available_to',
        'slot_minutes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'slot_minutes' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** The account this clinician signs in with, once an admin has made one. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hasLogin(): bool
    {
        return $this->user_id !== null;
    }

    public function messages(): HasMany
    {
        return $this->hasMany(DoctorMessage::class);
    }

    public function appointmentRequests(): HasMany
    {
        return $this->hasMany(AppointmentRequest::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** @return list<int> ISO weekdays the doctor works, 1 = Monday … 7 = Sunday. */
    public function availableDays(): array
    {
        $days = array_map('intval', explode(',', (string) ($this->available_days ?? '')));
        $days = array_filter($days, fn (int $d) => $d >= 1 && $d <= 7);

        return array_values(array_unique($days));
    }

    public function worksOn(int $isoWeekday): bool
    {
        return in_array($isoWeekday, $this->availableDays(), true);
    }

    /** Whether there is a grid to book on at all. */
    public function hasAvailability(): bool
    {
        return filled($this->available_from)
            && filled($this->available_to)
            && (int) $this->slot_minutes > 0
            && $this->availableDays() !== [];
    }

    /** "Mon–Fri · 09:00–17:00 · 30 min per patient", for the admin list. */
    public function availabilitySummary(): string
    {
        if (! $this->hasAvailability()) {
            return 'No booking times set';
        }
        $names = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];
        $days = $this->availableDays();
        sort($days);
        $consecutive = count($days) > 2 && $days === range($days[0], end($days));
        $dayText = $consecutive
            ? $names[$days[0]].'–'.$names[end($days)]
            : implode(', ', array_map(fn (int $d) => $names[$d], $days));

        return "{$dayText} · {$this->available_from}–{$this->available_to} · {$this->slot_minutes} min per patient";
    }

    /**
     * What a patient is allowed to see. Deliberately excludes `mobile` and
     * `email`: those are the clinician's own contact details, held so an admin
     * can reach them, not published to every account holder.
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'specialty' => $this->specialty,
            'bio' => $this->bio,
            // The booking grid, so a client can grey out closed days before it
            // asks for a day's slots. Not contact details.
            'available_days' => $this->availableDays(),
            'available_from' => $this->available_from,
            'available_to' => $this->available_to,
            'slot_minutes' => (int) $this->slot_minutes,
        ];
    }
}
