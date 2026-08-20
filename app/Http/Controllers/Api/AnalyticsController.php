<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /**
     * Client-reported product events. Only allow-listed names are accepted so
     * the events table stays clean and the admin dashboard stays readable.
     */
    private const ALLOWED_EVENTS = [
        // Wizard funnel
        'wizard_step_viewed',
        'wizard_completed',
        'medication_added',
        'symptom_selected',
        'results_viewed',
        'checkin_saved',
        'plan_started',
        // Engagement
        'report_downloaded',
        'snapshot_shared',
        'insight_revealed',
        'language_changed',
        // Screens (mobile)
        'screen_viewed',
    ];

    /**
     * POST /api/analytics/track  (mobile, bearer token optional)
     * POST /api/track            (web portal, session + CSRF)
     * Body: { name: string, properties?: object }
     */
    public function track(Request $request, AnalyticsService $analytics): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'properties' => ['nullable', 'array'],
        ]);

        if (! in_array($data['name'], self::ALLOWED_EVENTS, true)) {
            // Silently accept-and-drop unknown names: clients should never
            // break because the allow-list lags behind them.
            return response()->json(['ok' => true]);
        }

        // Works for web session users, mobile bearer tokens, and guests.
        $user = $request->user() ?? $request->user('sanctum');

        // Cap property payload size defensively.
        $properties = array_slice($data['properties'] ?? [], 0, 20, true);

        $analytics->track($data['name'], $properties, $user);

        return response()->json(['ok' => true]);
    }
}
