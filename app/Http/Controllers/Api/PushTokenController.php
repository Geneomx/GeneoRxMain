<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserPushToken;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    public function store(Request $request)
    {
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
