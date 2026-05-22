<?php

namespace App\Services;

use App\Models\User;

class PlanService
{
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
