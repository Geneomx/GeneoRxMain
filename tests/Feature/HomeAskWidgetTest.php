<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The public home page: it explains how GeneoRx works in four cards, and
 * visitors can open Ask GeneoRx and see the four general questions without an
 * account. "Ask a doctor" is not offered in the website navigation for now.
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

    public function test_the_home_page_explains_how_geneorx_works_in_four_cards(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('What is GeneoRx?')
            ->assertSee('How does it work?')
            ->assertSee('How does it help you?')
            ->assertSee('In short')
            ->assertDontSee('href="#features"', false);
    }

    public function test_ask_a_doctor_is_not_offered_in_the_website_navigation_for_now(): void
    {
        $user = User::factory()->create();

        $link = 'href="'.route('doctor').'"';

        $this->actingAs($user)->get('/treatments')->assertOk()->assertDontSee($link, false);
        $this->actingAs($user)->get('/account/settings')->assertOk()->assertDontSee($link, false);
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

    public function test_the_top_menu_offers_create_account_and_guest_to_visitors(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('href="'.route('register').'"', false)
            ->assertSee('href="'.route('guest').'"', false)
            ->assertSee('href="'.route('login').'"', false)
            ->assertDontSee('action="'.route('logout').'"', false);
    }

    public function test_a_signed_in_user_sees_sign_out_in_the_top_menu(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/')
            ->assertOk()
            ->assertSee('action="'.route('logout').'"', false)
            ->assertSee('href="'.route('treatments').'"', false);
    }
}
