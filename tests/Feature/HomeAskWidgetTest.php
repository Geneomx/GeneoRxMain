<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Ask GeneoRx on the public home page: visitors can open the chat and see the
 * four general questions without an account, and a general question gets a reply.
 */
class HomeAskWidgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_home_page_offers_the_chat_to_everyone(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('id="gxAskFab"', false)
            ->assertSee('js/ask-widget.js', false)
            ->assertSee('name="csrf-token"', false);
    }

    public function test_visitors_see_the_four_general_questions_without_signing_in(): void
    {
        config(['services.gemini.data_mode' => 'catalog_only']);

        $this->getJson('/api/assistant/options')
            ->assertOk()
            ->assertJsonPath('mode', 'catalog_only')
            ->assertJsonCount(4, 'prompts');
    }

    public function test_a_visitor_gets_a_general_answer_to_a_public_question(): void
    {
        config(['services.gemini.data_mode' => 'catalog_only', 'services.gemini.key' => 'test-key', 'services.gemini.model' => 'gemini-test']);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [['content' => ['parts' => [['text' => 'A journal helps you notice patterns.']]]]],
            ], 200),
        ]);

        $this->postJson('/api/assistant', [
            'messages' => [['role' => 'user', 'content' => 'General guidance']],
            'prompt_id' => 'tracking',
            'language' => 'en',
        ])->assertOk()->assertJsonPath('source', 'ai');
    }
}
