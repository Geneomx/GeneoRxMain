<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAuditLog extends Model
{
    protected $fillable = [
        'admin_id',
        'admin_email',
        'action',
        'target_type',
        'target_id',
        'target_label',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Record an admin action. Never throws — an audit failure must not
     * block the underlying action.
     */
    public static function record(
        string $action,
        ?Model $target = null,
        array $meta = [],
        ?string $targetLabel = null,
    ): void {
        try {
            $admin = auth()->user();

            static::create([
                'admin_id' => $admin?->id,
                'admin_email' => $admin?->email,
                'action' => $action,
                'target_type' => $target ? class_basename($target) : null,
                'target_id' => $target?->getKey(),
                'target_label' => $targetLabel
                    ?? ($target->email ?? $target->name ?? null),
                'meta' => $meta ?: null,
            ]);
        } catch (\Throwable $e) {
            report($e); // logged, never blocks the admin action itself
        }
    }
}
