<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;

class PlanService
{
    public const FREE_CHECKIN_LIMIT = 2;

    public function subscriptionFor(User $user): Subscription
    {
        return $user->subscription ?: Subscription::firstOrCreate(
            ['user_id' => $user->id],
            ['plan' => 'free', 'status' => 'free', 'provider' => 'stripe']
        );
    }

    public function stateFor(User $user): array
    {
        $subscription = $this->subscriptionFor($user);
        $plus = $this->isPlus($user);

        return [
            'plan' => 'plus',   // All logged-in users treated as Plus in the UI
            'status' => $subscription->status,
            'isPlus' => true,     // Always unlocked
            'isTrialing' => $this->isTrialing($subscription),
            'isGrace' => $this->isGrace($subscription),
            'trialEndsAt' => $subscription->trial_ends_at?->toIso8601String(),
            'graceEndsAt' => $subscription->grace_ends_at?->toIso8601String(),
            'currentPeriodEndsAt' => $subscription->current_period_ends_at?->toIso8601String(),
            'canceledAt' => $subscription->canceled_at?->toIso8601String(),
            'features' => [
                'maxFreeCheckins' => 999,
                'doctorExport' => true,
                'pushReminderScheduling' => true,
                'advancedTrends' => true,
                'insightHistory' => true,
            ],
        ];
    }

    public function isPlus(User $user): bool
    {
        $subscription = $this->subscriptionFor($user);

        if ($subscription->admin_override_ends_at && $subscription->admin_override_ends_at->isFuture()) {
            return true;
        }

        if ($subscription->plan !== 'plus') {
            return false;
        }

        if (in_array($subscription->status, ['active', 'trialing'], true)) {
            return true;
        }

        if ($this->isGrace($subscription)) {
            return true;
        }

        return $subscription->canceled_at !== null
            && $subscription->current_period_ends_at !== null
            && $subscription->current_period_ends_at->isFuture();
    }

    public function featureLocked(User $user, string $feature, int $currentCount = 0): bool
    {
        if ($this->isPlus($user)) {
            return false;
        }

        return $feature === 'checkins' && $currentCount > self::FREE_CHECKIN_LIMIT;
    }

    private function isTrialing(Subscription $subscription): bool
    {
        return $subscription->status === 'trialing'
            && $subscription->trial_ends_at !== null
            && $subscription->trial_ends_at->isFuture();
    }

    private function isGrace(Subscription $subscription): bool
    {
        return $subscription->status === 'past_due'
            && $subscription->grace_ends_at !== null
            && $subscription->grace_ends_at->isFuture();
    }
}
