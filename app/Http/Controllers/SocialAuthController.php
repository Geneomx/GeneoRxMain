<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\EmailOtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    // ── Google ─────────────────────────────────────────────────────────────

    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $socialUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Google sign-in was cancelled or failed. Please try again.']);
        }

        return $this->loginOrCreate('google', $socialUser->getId(), $socialUser->getEmail(), $socialUser->getName());
    }

    // ── Apple ──────────────────────────────────────────────────────────────

    public function redirectToApple(): RedirectResponse
    {
        return Socialite::driver('apple')
            ->scopes(['name', 'email'])
            ->redirect();
    }

    public function handleAppleCallback(): RedirectResponse
    {
        try {
            $socialUser = Socialite::driver('apple')->user();
        } catch (\Throwable $e) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Apple sign-in was cancelled or failed. Please try again.']);
        }

        $name = $socialUser->getName()
            ?: ($socialUser->user['name']['firstName'] ?? null)
            ?: 'Apple User';

        return $this->loginOrCreate('apple', $socialUser->getId(), $socialUser->getEmail(), $name);
    }

    // ── Shared: find-or-create and log in ──────────────────────────────────

    private function loginOrCreate(
        string $provider,
        string $providerId,
        ?string $email,
        ?string $name,
    ): RedirectResponse {
        // 1. Try to find by provider + provider_id (handles Apple re-logins without email)
        $user = User::where('social_provider', $provider)
            ->where('social_provider_id', $providerId)
            ->first();

        // 2. Fall back to email match (links existing password accounts to social)
        if (! $user && $email) {
            $user = User::where('email', $email)->first();

            if ($user && ! $user->social_provider_id) {
                // Link provider to existing account
                $user->update([
                    'social_provider'    => $provider,
                    'social_provider_id' => $providerId,
                ]);
            }
        }

        // 3. Create brand-new account
        if (! $user) {
            if (! $email) {
                return redirect()->route('login')
                    ->withErrors(['email' => 'We could not retrieve your email from ' . ucfirst($provider) . '. Please sign in with a different method.']);
            }

            $user = User::create([
                'name'               => $name ?: Str::beforeLast($email, '@'),
                'email'              => $email,
                'password'           => bcrypt(Str::random(40)), // unusable random password
                'email_verified_at'  => now(),                   // social = email verified
                'social_provider'    => $provider,
                'social_provider_id' => $providerId,
            ]);
        }

        // Ensure email is marked verified for social accounts
        if (! $user->email_verified_at) {
            $user->update(['email_verified_at' => now()]);
        }

        Auth::login($user, remember: true);

        return redirect()->intended(route('treatments'));
    }
}
