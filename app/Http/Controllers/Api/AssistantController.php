<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Medication;
use App\Models\Symptom;
use App\Models\UserProfile;
use App\Services\GeminiAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * POST /api/mobile/assistant  (bearer optional) and the web session route.
 *
 * Body: {
 *   messages: [{ role: "user"|"assistant", content: string }],  // oldest-first
 *   context?: { medications?: string[], symptoms?: string[], checkins?: string[] }   // guests only
 * }
 *
 * For signed-in users the grounding context is assembled SERVER-SIDE from their
 * own records and the client-supplied `context` is ignored — a client cannot
 * make the assistant speak about data the user does not own. Guests (no token,
 * empty server profile) may pass a minimal context, which is fenced as data.
 */
class AssistantController extends Controller
{
    public const PUBLIC_PROMPTS = [
        'tracking' => 'How can a medication and symptom journal help between visits?',
        'suggestions' => 'How should someone review optional symptom suggestions without treating them as a diagnosis?',
        'side_effects' => 'Explain possible medicine side effects in general and when to contact a pharmacist.',
        'summary' => 'What makes a medication tracking summary useful to review?',
    ];

    public function options(): JsonResponse
    {
        return response()->json([
            'mode' => config('services.gemini.data_mode') === 'personalized' ? 'personalized' : 'catalog_only',
            'prompts' => collect([
                'tracking' => 'Tracking between visits',
                'suggestions' => 'Understanding symptom suggestions',
                'side_effects' => 'Understanding possible side effects',
                'summary' => 'Making a useful summary',
            ])->map(fn ($label, $id) => ['id' => $id, 'label' => $label])->values(),
        ]);
    }

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
            'context.checkins' => ['nullable', 'array', 'max:8'],
            'context.checkins.*' => ['string', 'max:500'],
            'language' => ['nullable', 'string', 'max:10'],
            'prompt_id' => ['nullable', 'string', 'in:tracking,suggestions,side_effects,summary'],
        ]);

        // Keep only the trailing turns to bound the prompt, and the final turn
        // must come from the user.
        $messages = array_slice($validated['messages'], -12);
        if (($messages[array_key_last($messages)]['role'] ?? null) !== 'user') {
            return response()->json(['message' => 'The last message must be from the user.'], 422);
        }

        if (! config('services.gemini.key') || config('services.gemini.key') === '0') {
            return response()->json(['reply' => null, 'source' => 'unavailable']);
        }

        if (config('services.gemini.data_mode') !== 'personalized') {
            $question = self::PUBLIC_PROMPTS[$validated['prompt_id'] ?? ''] ?? null;
            if (! $question) {
                return response()->json(['reply' => 'Personal chat is not enabled on this connection. Choose a general question; your medication records and symptom notes stay in GeneoRx.', 'source' => 'restricted']);
            }
            // Ignore every client turn and context field; only the fixed public question reaches Gemini.
            $reply = $assistant->reply([['role' => 'user', 'content' => $question]], [], $validated['language'] ?? 'en');

            return response()->json(['reply' => $reply, 'source' => $reply ? 'ai' : 'unavailable']);
        }

        $user = $request->user() ?? $request->user('sanctum');
        // Personal answers need their own opt-in (account.aiConsent), separate from the
        // symptom-suggestions consent: it says plainly that entries go to the AI provider.
        if ($user && ! data_get($user->profile?->portal_state, 'account.aiConsent', false)) {
            return response()->json(['reply' => 'Turn on personal answers in Account (Tracking privacy) before using personal chat.', 'source' => 'restricted']);
        }

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
            'recent_checkins' => $this->recentCheckins($userId),
            'nutrient_claims' => $claims,
        ], fn ($v) => $v !== null && $v !== [] && (! $v instanceof Collection || $v->isNotEmpty()));
    }

    /**
     * The user's track record: their own last eight check-ins from the saved
     * portal state, oldest first, kept to what they entered (no scores inferred).
     *
     * @return array<int, array<string, mixed>>
     */
    private function recentCheckins(int $userId): array
    {
        $checkins = data_get(UserProfile::where('user_id', $userId)->first()?->portal_state, 'checkins', []);
        if (! is_array($checkins)) {
            return [];
        }

        $doseStatus = ['all' => 'all taken', 'some' => 'missed some', 'unsure' => 'not sure', 'not-scheduled' => 'not scheduled'];

        return collect($checkins)
            ->filter(fn ($c) => is_array($c) && is_string($c['dateISO'] ?? null))
            ->sortBy('dateISO')
            ->values()
            ->slice(-8)
            ->values()
            ->map(function (array $c) use ($doseStatus) {
                $medicines = collect($c['medicationDoses'] ?? [])
                    ->filter(fn ($d) => is_array($d) && is_string($d['medicationName'] ?? null))
                    ->map(fn ($d) => Str::limit($d['medicationName'], 80).' '.($doseStatus[$d['status'] ?? ''] ?? 'recorded'))
                    ->values()
                    ->all();
                $symptoms = collect(data_get($c, 'symptoms.items', []))
                    ->filter(fn ($i) => is_array($i) && is_string($i['symptom'] ?? null) && ($i['change'] ?? 'Not answered') !== 'Not answered')
                    ->map(fn ($i) => Str::limit($i['symptom'], 80).' '.strtolower((string) $i['change'])
                        .(is_numeric($i['severityNow'] ?? null) ? ' ('.(int) $i['severityNow'].'/10)' : ''))
                    ->values()
                    ->all();
                $wellbeing = collect(['energy', 'mood', 'sleep', 'focus'])
                    ->mapWithKeys(fn ($key) => [$key => data_get($c, "wellbeing.$key")])
                    ->filter(fn ($value) => is_numeric($value))
                    ->all();
                $note = is_string($c['notes'] ?? null) ? trim($c['notes']) : '';

                return array_filter([
                    'date' => substr($c['dateISO'], 0, 10),
                    'medicines' => $medicines ?: (is_numeric($c['adherencePct'] ?? null) ? ['taken '.(int) $c['adherencePct'].'%'] : []),
                    'symptoms' => $symptoms,
                    'wellbeing' => $wellbeing,
                    'note' => $note !== '' ? Str::limit($note, 200) : null,
                ], fn ($v) => $v !== null && $v !== []);
            })
            ->all();
    }

    /** Minimal, client-supplied grounding for guest sessions. */
    private function contextFromRequest(array $context): array
    {
        return array_filter([
            'medications' => array_values($context['medications'] ?? []),
            'symptoms' => array_values($context['symptoms'] ?? []),
            'recent_checkins' => array_values($context['checkins'] ?? []),
        ], fn ($v) => $v !== []);
    }
}
