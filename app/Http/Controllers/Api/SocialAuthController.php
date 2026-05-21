<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\JWK;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    // ── Google ─────────────────────────────────────────────────────────────

    /**
     * POST /api/auth/social/google
     * Body: { access_token: string }
     *
     * The mobile app obtains an access token via expo-auth-session and passes it
     * here. We verify it by calling Google's userinfo endpoint.
     */
    public function google(Request $request): JsonResponse
    {
        $request->validate(['access_token' => ['required', 'string']]);

        $response = Http::withToken($request->string('access_token'))
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (! $response->ok()) {
            return response()->json([
                'message' => 'Invalid Google token. Please try signing in again.',
            ], 422);
        }

        $profile  = $response->json();
        $googleId = $profile['sub']   ?? null;
        $email    = $profile['email'] ?? null;
        $name     = $profile['name']  ?? null;

        if (! $googleId) {
            return response()->json([
                'message' => 'Could not retrieve your Google profile. Please try again.',
            ], 422);
        }

        return $this->loginOrCreate('google', $googleId, $email, $name);
    }

    // ── Apple ──────────────────────────────────────────────────────────────

    /**
     * POST /api/auth/social/apple
     * Body: { identity_token: string, email?: string, name?: string }
     *
     * Apple only provides email + name on the very first sign-in.
     * Subsequent logins only carry the identity_token.
     */
    public function apple(Request $request): JsonResponse
    {
        $request->validate(['identity_token' => ['required', 'string']]);

        try {
            $appleId = $this->verifyAppleToken($request->string('identity_token'));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Apple identity token could not be verified. Please try again.',
            ], 422);
        }

        $email = $request->string('email') ?: null;
        $name  = $request->string('name')  ?: null;

        return $this->loginOrCreate('apple', $appleId, $email, $name);
    }

    // ── Apple JWT verification ─────────────────────────────────────────────

    /**
     * Verify an Apple identity token (JWT) against Apple's public JWK set.
     * Returns the Apple `sub` (permanent unique user ID).
     *
     * Apple's keys rotate infrequently   we cache them for 1 hour to avoid
     * a round-trip to Apple on every request.
     */
    private function verifyAppleToken(string $identityToken): string
    {
        // Cache Apple's public key set for 1 hour
        $jwks = Cache::remember('apple_jwks', 3600, function () {
            $res = Http::get('https://appleid.apple.com/auth/keys');
            if (! $res->ok()) {
                throw new \RuntimeException('Failed to fetch Apple public keys.');
            }
            return $res->json(); // { "keys": [...] }
        });

        $keySet  = JWK::parseKeySet($jwks);
        $decoded = JWT::decode($identityToken, $keySet);

        // The audience claim must match our iOS bundle ID
        $expectedAudiences = array_filter([
            env('APPLE_BUNDLE_ID', 'com.geneorx.app'),      // iOS native
            config('services.apple.client_id'),              // web Services ID (belt+suspenders)
        ]);

        $aud = is_array($decoded->aud) ? $decoded->aud : [$decoded->aud];

        if (empty(array_intersect($aud, $expectedAudiences))) {
            throw new \RuntimeException('Apple token audience mismatch.');
        }

        if ($decoded->iss !== 'https://appleid.apple.com') {
            throw new \RuntimeException('Apple token issuer mismatch.');
        }

        return $decoded->sub; // Apple user ID
    }

    // ── Shared: find-or-create and return a Sanctum token ─────────────────

    private function loginOrCreate(
        string $provider,
        string $providerId,
        ?string $email,
        ?string $name,
    ): JsonResponse {
        // 1. Look up by provider + provider_id (handles Apple re-logins without email)
        $user = User::where('social_provider', $provider)
            ->where('social_provider_id', $providerId)
            ->first();

        // 2. Fall back to email match (links existing accounts to social provider)
        if (! $user && $email) {
            $user = User::where('email', $email)->first();

            if ($user && ! $user->social_provider_id) {
                $user->update([
                    'social_provider'    => $provider,
                    'social_provider_id' => $providerId,
                ]);
            }
        }

        // 3. Create brand-new account
        if (! $user) {
            if (! $email) {
                return response()->json([
                    'message' => 'We could not retrieve your email from ' . ucfirst($provider) . '. '
                        . 'Please try a different sign-in method.',
                ], 422);
            }

            $user = User::create([
                'name'               => $name ?: Str::beforeLast($email, '@'),
                'email'              => $email,
                'password'           => bcrypt(Str::random(40)), // unusable random password
                'email_verified_at'  => now(),                   // social = already verified
                'social_provider'    => $provider,
                'social_provider_id' => $providerId,
            ]);
        }

        // Ensure email is marked verified for social accounts
        if (! $user->email_verified_at) {
            $user->update(['email_verified_at' => now()]);
        }

        // Revoke any old mobile token so only one device is active at a time
        $user->tokens()->where('name', 'mobile')->delete();
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'emailVerified' => true, // social login = email already verified by provider
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            ],
        ]);
    }
}
