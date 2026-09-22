<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One patient's permission for one doctor to see their health summary.
 *
 * Granting is an act the patient takes; revoking sets a date rather than
 * deleting the row, so "who could see this, and when" stays answerable.
 */
class DoctorShare extends Model
{
    protected $fillable = [
        'user_id',
        'doctor_id',
        'granted_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'revoked_at' => 'datetime',
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

    public function isLive(): bool
    {
        return $this->granted_at !== null && $this->revoked_at === null;
    }

    /** Is this doctor allowed to see this patient's summary right now? */
    public static function allows(int $userId, ?int $doctorId): bool
    {
        if (! $doctorId) {
            return false;
        }

        return self::where('user_id', $userId)
            ->where('doctor_id', $doctorId)
            ->whereNotNull('granted_at')
            ->whereNull('revoked_at')
            ->exists();
    }

    public static function grant(int $userId, int $doctorId): self
    {
        $share = self::firstOrNew(['user_id' => $userId, 'doctor_id' => $doctorId]);
        $share->granted_at = now();
        $share->revoked_at = null;
        $share->save();

        return $share;
    }

    public static function revoke(int $userId, int $doctorId): void
    {
        self::where('user_id', $userId)
            ->where('doctor_id', $doctorId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }
}
