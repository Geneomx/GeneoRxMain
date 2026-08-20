<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * POST /api/feedback (mobile, bearer optional) and web portal (session).
     * Body: { type: bug|suggestion|question|other, message: string,
     *         can_contact?: bool, contact_email?: string, source?: web|mobile }
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:bug,suggestion,question,other'],
            'message' => ['required', 'string', 'max:5000'],
            'can_contact' => ['nullable', 'boolean'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'source' => ['nullable', 'in:web,mobile'],
        ]);

        $user = $request->user() ?? $request->user('sanctum');

        Feedback::create([
            'user_id' => $user?->id,
            'type' => $data['type'],
            'message' => $data['message'],
            'can_contact' => (bool) ($data['can_contact'] ?? false),
            'contact_email' => $user ? null : ($data['contact_email'] ?? null),
            'source' => $data['source'] ?? 'web',
            'status' => 'new',
        ]);

        return response()->json(['ok' => true], 201);
    }
}
