<?php

namespace Tests\Feature;

use App\Http\Controllers\StripeWebhookController;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PlanService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Hardening for the (currently unrouted) Stripe billing code so it is safe and
 * correct the moment it is wired up:
 *  - the webhook must NOT accept unsigned requests when no secret is set, and
 *  - BillingController::show()'s PlanService::subscriptionFor() must exist and be
 *    null-safe (it was a fatal "undefined method" call).
 */
class BillingHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function hasValidSignature(Request $request): bool
    {
        $m = new ReflectionMethod(StripeWebhookController::class, 'hasValidSignature');
        $m->setAccessible(true);

        return $m->invoke(new StripeWebhookController, $request);
    }

    public function test_webhook_rejects_when_no_secret_is_configured(): void
    {
        config(['services.stripe.webhook_secret' => null]);

        $req = Request::create('/stripe/webhook', 'POST', [], [], [], [], '{"type":"x"}');

        // Previously returned true — an open subscription-mutation endpoint.
        $this->assertFalse($this->hasValidSignature($req));
    }

    public function test_webhook_rejects_a_bad_signature(): void
    {
        config(['services.stripe.webhook_secret' => 'whsec_test']);

        $req = Request::create('/stripe/webhook', 'POST', [], [], [], [], '{"type":"x"}');
        $req->headers->set('Stripe-Signature', 't=123,v1=deadbeef');

        $this->assertFalse($this->hasValidSignature($req));
    }

    public function test_webhook_accepts_a_correct_signature(): void
    {
        $secret = 'whsec_test';
        config(['services.stripe.webhook_secret' => $secret]);

        $payload = '{"type":"checkout.session.completed"}';
        $t = '1700000000';
        $sig = hash_hmac('sha256', $t.'.'.$payload, $secret);

        $req = Request::create('/stripe/webhook', 'POST', [], [], [], [], $payload);
        $req->headers->set('Stripe-Signature', "t={$t},v1={$sig}");

        $this->assertTrue($this->hasValidSignature($req));
    }

    public function test_subscription_for_returns_null_without_a_subscription(): void
    {
        $user = User::factory()->create();

        $this->assertNull(app(PlanService::class)->subscriptionFor($user));
    }

    public function test_subscription_for_returns_the_users_subscription(): void
    {
        $user = User::factory()->create();
        Subscription::create([
            'user_id' => $user->id,
            'provider_customer_id' => 'cus_123',
            'status' => 'active',
        ]);

        $sub = app(PlanService::class)->subscriptionFor($user);

        $this->assertNotNull($sub);
        $this->assertSame('cus_123', $sub->provider_customer_id);
    }
}
