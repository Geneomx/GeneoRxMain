<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserPushToken;
use App\Services\AnalyticsService;
use App\Services\PlanService;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    public function store(Request $request, PlanService $plans, AnalyticsService $analytics)
    {
        if ($plans->featureLocked($request->user(), 'push_reminders')) {
            $analytics->track('locked_feature_viewed', ['feature' => 'reminder_schedule'], $request->user());

            return response()->json([
                'message' => 'Upgrade to Plus to schedule check-in reminders.',
                'feature' => 'push_reminders',
                'subscription' => $plans->stateFor($request->user()),
            ], 402);
        }

        $validated = $request->validate([
            'expoPushToken' => 'required|string|max:255',
            'platform' => 'nullable|string|max:40',
        ]);

        UserPushToken::updateOrCreate(
            ['expo_push_token' => $validated['expoPushToken']],
            [
                'user_id' => $request->user()->id,
                'platform' => $validated['platform'] ?? null,
                'last_seen_at' => now(),
                'disabled_at' => null,
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request)
    {
        $validated = $request->validate(['expoPushToken' => 'required|string|max:255']);

        UserPushToken::where('user_id', $request->user()->id)
            ->where('expo_push_token', $validated['expoPushToken'])
            ->update(['disabled_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
