<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiPrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_free_chat_sends_only_the_fixed_public_question(): void
    {
        config(['services.gemini.key' => 'test-key', 'services.gemini.data_mode' => 'catalog_only']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => 'Keep a record.']]]]],
        ])]);
        $this->postJson('/api/mobile/assistant', [
            'prompt_id' => 'tracking',
            'messages' => [['role' => 'user', 'content' => 'PRIVATE-NOTE']],
            'context' => ['symptoms' => ['PRIVATE-SYMPTOM']],
        ])->assertOk()->assertJsonPath('source', 'ai');
        Http::assertSent(fn ($request) => ! str_contains(json_encode($request->data()), 'PRIVATE-')
            && ! str_contains($request->url(), 'test-key')
            && $request->hasHeader('x-goog-api-key', 'test-key'));
    }

    public function test_free_chat_does_not_forward_arbitrary_text_or_personal_summaries(): void
    {
        config(['services.gemini.key' => 'test-key', 'services.gemini.data_mode' => 'catalog_only']);
        Http::fake();
        $this->postJson('/api/mobile/assistant', ['messages' => [['role' => 'user', 'content' => 'PRIVATE-NOTE']]])
            ->assertOk()->assertJsonPath('source', 'restricted');
        $this->postJson('/api/mobile/ai-summary', ['summary' => 'PRIVATE-NOTE'])
            ->assertOk()->assertJsonPath('source', 'fallback');
        Http::assertNothingSent();
    }

    public function test_free_model_fails_over_on_quota_without_faking_an_answer(): void
    {
        config(['services.gemini.key' => 'test-key', 'services.gemini.model' => 'first',
            'services.gemini.fallback_models' => 'second', 'services.gemini.data_mode' => 'catalog_only']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::sequence()->push([], 429)->push([
            'candidates' => [['content' => ['parts' => [['text' => 'Use a simple journal.']]]]],
        ])]);
        $this->postJson('/api/mobile/assistant', ['prompt_id' => 'tracking', 'messages' => [['role' => 'user', 'content' => 'General']]])
            ->assertOk()->assertJsonPath('source', 'ai');
        Http::assertSentCount(2);
    }
}
