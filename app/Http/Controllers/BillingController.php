<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use App\Services\PlanService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BillingController extends Controller
{
    public function show(Request $request, PlanService $plans, AnalyticsService $analytics)
    {
        $analytics->track('pricing_viewed', ['source' => 'billing'], $request->user());

        $subscription = $plans->subscriptionFor($request->user());

        return view('billing.index', [
            'subscription' => $plans->stateFor($request->user()),
            'hasBillingPortal' => (bool) $subscription->provider_customer_id,
            'stripeKey' => config('services.stripe.key'),
        ]);
    }

    public function checkout(Request $request, AnalyticsService $analytics)
    {
        $user = $request->user();
        $priceId = config('services.stripe.plus_price_id');
        $secret = config('services.stripe.secret');

        if (! $priceId || ! $secret) {
            return back()->withErrors(['billing' => 'Stripe is not configured yet.']);
        }

        $analytics->track('checkout_started', ['plan' => 'plus'], $user);
        $analytics->track('upgrade_clicked', ['source' => $request->input('source', 'billing')], $user);

        $response = Http::asForm()
            ->withToken($secret)
            ->post('https://api.stripe.com/v1/checkout/sessions', [
                'mode' => 'subscription',
                'customer_email' => $user->email,
                'success_url' => route('billing.show').'?checkout=success',
                'cancel_url' => route('billing.show').'?checkout=cancel',
                'line_items' => [
                    [
                        'price' => $priceId,
                        'quantity' => 1,
                    ],
                ],
                'subscription_data' => [
                    'trial_period_days' => 14,
                    'metadata' => [
                        'user_id' => (string) $user->id,
                    ],
                ],
                'metadata' => [
                    'user_id' => (string) $user->id,
                    'plan' => 'plus',
                ],
            ]);

        if (! $response->successful()) {
            return back()->withErrors(['billing' => 'Could not start Stripe Checkout.']);
        }

        return redirect()->away((string) $response->json('url'));
    }

    public function portal(Request $request)
    {
        $subscription = $request->user()->subscription;
        $secret = config('services.stripe.secret');

        if (! $secret || ! $subscription?->provider_customer_id) {
            return back()->withErrors(['billing' => 'No Stripe billing account is connected yet.']);
        }

        $response = Http::asForm()
            ->withToken($secret)
            ->post('https://api.stripe.com/v1/billing_portal/sessions', [
                'customer' => $subscription->provider_customer_id,
                'return_url' => route('billing.show'),
            ]);

        if (! $response->successful()) {
            return back()->withErrors(['billing' => 'Could not open the billing portal.']);
        }

        return redirect()->away((string) $response->json('url'));
    }
}
