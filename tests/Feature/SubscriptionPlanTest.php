<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\User;
use App\Services\PlanService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionPlanTest extends TestCase
{
    use RefreshDatabase;

    public function test_free_user_is_limited_to_two_checkins(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/mobile/profile', [
            'profile' => [],
            'checkins' => [
                ['dateISO' => now()->toIso8601String(), 'adherencePct' => 90],
                ['dateISO' => now()->addDay()->toIso8601String(), 'adherencePct' => 90],
                ['dateISO' => now()->addDays(2)->toIso8601String(), 'adherencePct' => 90],
            ],
        ])->assertStatus(402)
            ->assertJsonPath('feature', 'checkins');
    }

    public function test_plus_user_can_save_more_than_two_checkins(): void
    {
        $user = User::factory()->create();
        Subscription::create([
            'user_id' => $user->id,
            'plan' => 'plus',
            'status' => 'active',
            'provider' => 'stripe',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/mobile/profile', [
            'profile' => [],
            'checkins' => [
                ['dateISO' => now()->toIso8601String(), 'adherencePct' => 90],
                ['dateISO' => now()->addDay()->toIso8601String(), 'adherencePct' => 90],
                ['dateISO' => now()->addDays(2)->toIso8601String(), 'adherencePct' => 90],
            ],
        ])->assertOk();
    }

    public function test_admin_override_grants_plus_access(): void
    {
        $user = User::factory()->create();
        Subscription::create([
            'user_id' => $user->id,
            'plan' => 'free',
            'status' => 'free',
            'provider' => 'admin',
            'admin_override_ends_at' => now()->addDays(7),
            'admin_override_reason' => 'Test override',
        ]);

        $this->assertTrue(app(PlanService::class)->isPlus($user));
    }

    public function test_stripe_webhook_activates_plus_subscription(): void
    {
        $user = User::factory()->create();

        $this->postJson('/stripe/webhook', [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'customer' => 'cus_test',
                    'subscription' => 'sub_test',
                    'metadata' => ['user_id' => (string) $user->id],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'plan' => 'plus',
            'provider_customer_id' => 'cus_test',
            'provider_subscription_id' => 'sub_test',
        ]);
    }
}
