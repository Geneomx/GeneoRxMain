<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan',
        'status',
        'provider',
        'provider_customer_id',
        'provider_subscription_id',
        'trial_ends_at',
        'grace_ends_at',
        'current_period_ends_at',
        'canceled_at',
        'admin_override_ends_at',
        'admin_override_reason',
        'metadata',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'grace_ends_at' => 'datetime',
        'current_period_ends_at' => 'datetime',
        'canceled_at' => 'datetime',
        'admin_override_ends_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Statuses the payment provider considers paid-and-current. */
    public const ACTIVE_STATUSES = ['active', 'trialing'];

    /**
     * Whether this subscription currently entitles the user to paid features.
     *
     * Three ways to qualify, and all three must agree everywhere:
     *  - the provider says active/trialing
     *  - an admin granted a manual override that has not expired
     *  - the row is inside the post-failure grace window the Stripe webhook sets
     *
     * This exists because the admin panel and User::isSubscribed() had been
     * answering the question differently: admin listed override-only rows as
     * "Active subscribers" while the API reported subscribed:false for the same
     * user, so support saw a subscriber and the app did not. Both now call this.
     */
    public function isEntitled(): bool
    {
        if (in_array($this->status, self::ACTIVE_STATUSES, true)) {
            return true;
        }

        if ($this->admin_override_ends_at && $this->admin_override_ends_at->isFuture()) {
            return true;
        }

        return (bool) ($this->grace_ends_at && $this->grace_ends_at->isFuture());
    }

    /** Rows that isEntitled() would accept. Keeps admin queries in step. */
    public function scopeEntitled($query)
    {
        return $query->where(fn ($q) => $q
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->orWhere(fn ($qq) => $qq->whereNotNull('admin_override_ends_at')
                ->where('admin_override_ends_at', '>', now()))
            ->orWhere(fn ($qq) => $qq->whereNotNull('grace_ends_at')
                ->where('grace_ends_at', '>', now())));
    }
}
