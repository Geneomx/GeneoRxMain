<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\User;
use App\Notifications\BillingStatusNotification;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, AnalyticsService $analytics)
    {
        if (! $this->hasValidSignature($request)) {
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $event = $request->json()->all();
        $type = (string) data_get($event, 'type');
        $object = (array) data_get($event, 'data.object', []);

        match ($type) {
            'checkout.session.completed' => $this->handleCheckoutCompleted($object, $analytics),
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted' => $this->handleSubscriptionUpdated($object, $analytics),
            'invoice.payment_failed' => $this->handlePaymentFailed($object, $analytics),
            'invoice.payment_succeeded' => $this->handlePaymentSucceeded($object, $analytics),
            default => null,
        };

        return response()->json(['ok' => true]);
    }

    private function handleCheckoutCompleted(array $session, AnalyticsService $analytics): void
    {
        $user = $this->userFromObject($session);
        if (! $user) {
            return;
        }

        $subscription = Subscription::updateOrCreate(
            ['user_id' => $user->id],
            [
                'plan' => 'plus',
                'status' => 'trialing',
                'provider' => 'stripe',
                'provider_customer_id' => data_get($session, 'customer'),
                'provider_subscription_id' => data_get($session, 'subscription'),
                'metadata' => $session,
            ]
        );

        $analytics->track('checkout_completed', ['plan' => 'plus'], $user);
        $analytics->track('trial_started', ['subscription_id' => $subscription->provider_subscription_id], $user);
        $user->notify(new BillingStatusNotification('GeneoRx Plus trial started', 'Your GeneoRx Plus trial is active.'));
    }

    private function handleSubscriptionUpdated(array $stripeSubscription, AnalyticsService $analytics): void
    {
        $user = $this->userFromObject($stripeSubscription);
        $providerSubscriptionId = (string) data_get($stripeSubscription, 'id');

        $subscription = Subscription::where('provider_subscription_id', $providerSubscriptionId)->first();
        if (! $subscription && $user) {
            $subscription = Subscription::firstOrNew(['user_id' => $user->id]);
        }

        if (! $subscription) {
            return;
        }

        $status = (string) data_get($stripeSubscription, 'status', 'active');
        $canceledAt = data_get($stripeSubscription, 'canceled_at');
        $periodEnd = data_get($stripeSubscription, 'current_period_end');
        $trialEnd = data_get($stripeSubscription, 'trial_end');

        $subscription->fill([
            'plan' => 'plus',
            'status' => $status,
            'provider' => 'stripe',
            'provider_customer_id' => data_get($stripeSubscription, 'customer', $subscription->provider_customer_id),
            'provider_subscription_id' => $providerSubscriptionId,
            'trial_ends_at' => $trialEnd ? now()->setTimestamp((int) $trialEnd) : null,
            'grace_ends_at' => $status === 'past_due' ? now()->addDays(3) : null,
            'current_period_ends_at' => $periodEnd ? now()->setTimestamp((int) $periodEnd) : null,
            'canceled_at' => $canceledAt ? now()->setTimestamp((int) $canceledAt) : null,
            'metadata' => $stripeSubscription,
        ])->save();

        $user = $subscription->user;
        if ($user && $status === 'canceled') {
            $analytics->track('subscription_canceled', ['subscription_id' => $providerSubscriptionId], $user);
            $user->notify(new BillingStatusNotification('GeneoRx Plus canceled', 'Your Plus plan was canceled. You keep access until the current period ends if applicable.'));
        }
    }

    private function handlePaymentFailed(array $invoice, AnalyticsService $analytics): void
    {
        $subscription = Subscription::where('provider_subscription_id', data_get($invoice, 'subscription'))->first();
        if (! $subscription) {
            return;
        }

        $subscription->update([
            'status' => 'past_due',
            'grace_ends_at' => now()->addDays(3),
            'metadata' => array_merge($subscription->metadata ?? [], ['last_failed_invoice' => $invoice]),
        ]);

        $analytics->track('payment_failed', ['subscription_id' => $subscription->provider_subscription_id], $subscription->user);
        $subscription->user?->notify(new BillingStatusNotification('GeneoRx payment needs attention', 'Your Plus plan is in a short grace period. Please update your payment method.'));
    }

    private function handlePaymentSucceeded(array $invoice, AnalyticsService $analytics): void
    {
        $subscription = Subscription::where('provider_subscription_id', data_get($invoice, 'subscription'))->first();
        if (! $subscription) {
            return;
        }

        $subscription->update(['status' => 'active', 'grace_ends_at' => null]);
        $analytics->track('payment_recovered', ['subscription_id' => $subscription->provider_subscription_id], $subscription->user);
    }

    private function userFromObject(array $object): ?User
    {
        $userId = data_get($object, 'metadata.user_id') ?: data_get($object, 'subscription_details.metadata.user_id');

        return $userId ? User::find($userId) : null;
    }

    private function hasValidSignature(Request $request): bool
    {
        $secret = config('services.stripe.webhook_secret');
        if (! $secret) {
            return true;
        }

        $signature = (string) $request->header('Stripe-Signature');
        $timestamp = Arr::first(explode(',', $signature), fn ($part) => str_starts_with($part, 't='));
        $signed = Arr::first(explode(',', $signature), fn ($part) => str_starts_with($part, 'v1='));

        if (! $timestamp || ! $signed) {
            return false;
        }

        $t = substr($timestamp, 2);
        $v1 = substr($signed, 3);
        $expected = hash_hmac('sha256', $t.'.'.$request->getContent(), $secret);

        return hash_equals($expected, $v1);
    }
}
