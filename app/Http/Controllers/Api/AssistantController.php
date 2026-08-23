<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Medication;
use App\Models\Symptom;
use App\Services\GeminiAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * POST /api/mobile/assistant  (bearer optional) and the web session route.
 *
 * Body: {
 *   messages: [{ role: "user"|"assistant", content: string }],  // oldest-first
 *   context?: { medications?: string[], symptoms?: string[] }   // guests only
 * }
 *
 * For signed-in users the grounding context is assembled SERVER-SIDE from their
 * own records and the client-supplied `context` is ignored — a client cannot
 * make the assistant speak about data the user does not own. Guests (no token,
 * empty server profile) may pass a minimal context, which is fenced as data.
 */
class AssistantController extends Controller
{
    public function __invoke(Request $request, GeminiAssistantService $assistant): JsonResponse
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:20'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:2000'],
            'context' => ['nullable', 'array'],
            'context.medications' => ['nullable', 'array'],
            'context.medications.*' => ['string', 'max:200'],
            'context.symptoms' => ['nullable', 'array'],
            'context.symptoms.*' => ['string', 'max:200'],
            'language' => ['nullable', 'string', 'max:10'],
        ]);

        // Keep only the trailing turns to bound the prompt, and the final turn
        // must come from the user.
        $messages = array_slice($validated['messages'], -12);
        if (($messages[array_key_last($messages)]['role'] ?? null) !== 'user') {
            return response()->json(['message' => 'The last message must be from the user.'], 422);
        }

        $user = $request->user() ?? $request->user('sanctum');

        $context = $user
            ? $this->contextForUser($user->id)
            : $this->contextFromRequest($validated['context'] ?? []);

        $reply = $assistant->reply($messages, $context, $validated['language'] ?? 'en');

        if (! $reply) {
            return response()->json([
                'reply' => null,
                'source' => 'unavailable',
            ]);
        }

        return response()->json([
            'reply' => $reply,
            'source' => 'ai',
        ]);
    }

    /** Grounding assembled from the signed-in user's own records. */
    private function contextForUser(int $userId): array
    {
        $medications = Medication::where('user_id', $userId)->get();
        $symptoms = Symptom::where('user_id', $userId)->pluck('symptom_name')->filter()->values();

        $latest = CheckIn::where('user_id', $userId)->latest('date_checked')->first();

        // Nutrient claims + citations for the user's medications, so answers can
        // carry provenance (a PMID) rather than free-invention.
        $medNames = $medications->pluck('medication_name')->filter()->values();
        $claims = Medication::whereNotNull('slug')
            ->whereIn('name', $medNames)
            ->get()
            ->flatMap(fn ($m) => collect($m->claims ?? [])->map(fn ($c) => [
                'medication' => $m->name,
                'nutrient' => $c['nutrient'] ?? null,
                'citations' => $c['citations'] ?? [],
            ]))
            ->values();

        return array_filter([
            'medications' => $medNames,
            'symptoms' => $symptoms,
            'latest_checkin' => $latest ? [
                'date' => $latest->date_checked?->toDateString(),
                'adherence_percentage' => $latest->adherence_percentage,
                'notes' => $latest->notes,
            ] : null,
            'nutrient_claims' => $claims,
        ], fn ($v) => $v !== null && $v !== [] && (! $v instanceof Collection || $v->isNotEmpty()));
    }

    /** Minimal, client-supplied grounding for guest sessions. */
    private function contextFromRequest(array $context): array
    {
        return array_filter([
            'medications' => array_values($context['medications'] ?? []),
            'symptoms' => array_values($context['symptoms'] ?? []),
        ], fn ($v) => $v !== []);
    }
}
