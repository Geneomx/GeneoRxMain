<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;

class PlanService
{
    /**
     * The user's current subscription record, or null. BillingController::show()
     * calls this; without it that route fatals with "Call to undefined method".
     */
    public function subscriptionFor(User $user): ?Subscription
    {
        return $user->subscription;
    }

    public function stateFor(User $user): array
    {
        return [
            'plan' => 'free',
            'status' => 'active',
            'isPlus' => false,
            'features' => [
                'maxFreeCheckins' => 999,
                'doctorExport' => true,
                'pushReminderScheduling' => true,
                'advancedTrends' => true,
                'insightHistory' => true,
            ],
        ];
    }

    public function featureLocked(User $user, string $feature, int $currentCount = 0): bool
    {
        return false;
    }
}
