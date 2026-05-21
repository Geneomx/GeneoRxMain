<?php

namespace App\Services;

use App\Models\AnalyticsEvent;
use App\Models\User;

class AnalyticsService
{
    public function track(string $name, array $properties = [], ?User $user = null): void
    {
        AnalyticsEvent::create([
            'user_id' => $user?->id,
            'name' => $name,
            'properties' => $properties,
        ]);
    }
}
