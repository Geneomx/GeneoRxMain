<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiSummaryController extends Controller
{
    public function __invoke(Request $request, GeminiSummaryService $gemini): JsonResponse
    {
        $validated = $request->validate([
            'medications' => 'nullable|array',
            'medications.*' => 'string|max:200',
            'symptoms' => 'nullable|array',
            'symptoms.*' => 'string|max:200',
            'summary' => 'nullable|string|max:2000',
            'meaning' => 'nullable|string|max:2000',
            'doctor_prompt' => 'nullable|string|max:2000',
            'language' => 'nullable|string|max:10',
        ]);

        $facts = [
            'medications' => array_values($validated['medications'] ?? []),
            'symptoms' => array_values($validated['symptoms'] ?? []),
            'engine_summary' => $validated['summary'] ?? '',
            'engine_meaning' => $validated['meaning'] ?? '',
            'doctor_prompt' => $validated['doctor_prompt'] ?? '',
            'language' => $validated['language'] ?? 'en',
        ];

        $aiText = $gemini->summarize($facts);

        if (! $aiText) {
            $fallback = trim(
                ($validated['summary'] ?? '')."\n\n".($validated['meaning'] ?? '')
            );

            return response()->json([
                'summary' => $fallback !== '' ? $fallback : null,
                'source' => 'fallback',
            ]);
        }

        return response()->json([
            'summary' => $aiText,
            'source' => 'ai',
        ]);
    }
}
