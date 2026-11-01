<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medication;
use App\Services\MedicationSymptomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SymptomSuggestionController extends Controller
{
    public function __invoke(Request $request, MedicationSymptomService $service): JsonResponse
    {
        $data = $request->validate([
            'medications' => ['required', 'array', 'max:50'],
            'medications.*' => ['required', 'string', 'max:120'],
        ]);
        $suggestions = [];
        $references = json_decode(file_get_contents(resource_path('data/symptom-references.json')), true) ?: [];
        foreach (Medication::catalog()->active()->whereIn('slug', $data['medications'])->orderBy('name')->get() as $med) {
            foreach ($med->symptom_chips ?? [] as $symptom) {
                if (! is_string($symptom) || trim($symptom) === '') {
                    continue;
                }
                $symptom = trim($symptom);
                $suggestions[$symptom] ??= ['symptom' => $symptom, 'medications' => []];
                $suggestions[$symptom]['medications'][] = $med->name;
                if (isset($references[$med->slug][$symptom])) {
                    $suggestions[$symptom]['sources'][] = $references[$med->slug][$symptom];
                }
            }
        }
        if ($suggestions === []) {
            return response()->json(['suggestions' => [], 'source' => 'catalog']);
        }
        // Rank the same complete public catalog for every request. Never disclose a user's selection.
        $pool = Medication::catalog()->active()->get()->flatMap(fn ($med) => $med->symptom_chips ?? [])
            ->filter(fn ($name) => is_string($name) && trim($name) !== '')->map(fn ($name) => trim($name))
            ->unique()->sort()->take(200)->map(fn ($name) => ['symptom' => $name])->values()->all();
        $cacheKey = 'symptom-order:'.hash('sha256', json_encode([$pool, config('services.gemini.model'), (bool) config('services.gemini.key')]));
        $ordered = Cache::get($cacheKey);
        if (! is_array($ordered)) {
            $ordered = $service->order($pool);
            Cache::put($cacheKey, $ordered, $ordered['source'] === 'ai' ? now()->addHours(6) : now()->addMinute());
        }
        $result = [];
        foreach ($ordered['suggestions'] as $item) {
            if (isset($suggestions[$item['symptom']])) {
                $result[] = $suggestions[$item['symptom']];
                unset($suggestions[$item['symptom']]);
            }
        }

        return response()->json(['suggestions' => [...$result, ...array_values($suggestions)], 'source' => $ordered['source']]);
    }
}
