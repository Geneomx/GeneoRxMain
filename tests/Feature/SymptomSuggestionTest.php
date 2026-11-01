<?php

namespace Tests\Feature;

use App\Models\Medication;
use App\Models\Symptom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SymptomSuggestionTest extends TestCase
{
    use RefreshDatabase;

    private function catalog(string $name, string $slug, array $symptoms, bool $active = true): void
    {
        Medication::create(['name' => $name, 'slug' => $slug, 'symptom_chips' => $symptoms, 'is_active' => $active]);
    }

    public function test_catalog_fallback_deduplicates_and_preserves_medication_provenance_without_recording_symptoms(): void
    {
        config(['services.gemini.key' => null]);
        $this->catalog('Medicine A', 'a', ['Fatigue', 'Nausea']);
        $this->catalog('Medicine B', 'b', ['Fatigue']);
        $this->catalog('Inactive', 'inactive', ['Excluded symptom'], false);

        $this->postJson('/api/symptom-suggestions', ['medications' => ['a', 'b', 'inactive', 'unknown']])
            ->assertOk()->assertJsonPath('source', 'catalog')
            ->assertJsonPath('suggestions.0', ['symptom' => 'Fatigue', 'medications' => ['Medicine A', 'Medicine B']])
            ->assertJsonCount(2, 'suggestions');
        $this->assertSame(0, Symptom::count());
    }

    public function test_native_mobile_endpoint_returns_suggestions_without_confirming_them(): void
    {
        config(['services.gemini.key' => null]);
        $this->catalog('Medicine A', 'a', ['Fatigue']);
        $this->postJson('/api/mobile/symptom-suggestions', ['medications' => ['a']])
            ->assertOk()->assertJsonPath('source', 'catalog')
            ->assertJsonPath('suggestions.0.symptom', 'Fatigue');
        $this->assertSame(0, Symptom::count());
    }

    public function test_ai_cannot_add_invented_symptoms_or_duplicate_suggestions(): void
    {
        $this->catalog('Medicine A', 'a', ['Fatigue', 'Nausea']);
        config(['services.gemini.key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => '["Invented diagnosis", "Nausea", "Nausea"]']]]]],
        ])]);

        $this->postJson('/api/symptom-suggestions', ['medications' => ['a']])
            ->assertOk()->assertJsonPath('source', 'ai')
            ->assertJsonPath('suggestions.0.symptom', 'Nausea')
            ->assertJsonPath('suggestions.1.symptom', 'Fatigue')
            ->assertJsonCount(2, 'suggestions');
        Http::assertSent(fn ($request) => str_contains($request['contents'][0]['parts'][0]['text'], '<<<CATALOG'));
    }

    public function test_malformed_provider_output_falls_back_to_catalog(): void
    {
        $this->catalog('Medicine A', 'a', ['Fatigue']);
        config(['services.gemini.key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => 'Not JSON']]]]],
        ])]);
        $this->postJson('/api/symptom-suggestions', ['medications' => ['a']])
            ->assertOk()->assertJsonPath('source', 'catalog')->assertJsonPath('suggestions.0.symptom', 'Fatigue');
    }

    public function test_unknown_medication_returns_no_suggestions_and_never_calls_provider(): void
    {
        config(['services.gemini.key' => 'test-key']);
        Http::fake();
        $this->postJson('/api/symptom-suggestions', ['medications' => ['custom_unknown']])
            ->assertOk()->assertJsonPath('suggestions', []);
        Http::assertNothingSent();
    }

    public function test_request_is_bounded_and_requires_medication_identifiers(): void
    {
        $this->postJson('/api/symptom-suggestions', ['medications' => [['symptoms' => ['Injected']]]])->assertUnprocessable();
        $this->postJson('/api/symptom-suggestions', ['medications' => array_fill(0, 51, 'a')])->assertUnprocessable();
    }
}
