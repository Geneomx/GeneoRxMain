<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
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

        // Audience check: the token must have been issued to one of OUR client
        // IDs, not just be any valid Google token (prevents token substitution
        // from an unrelated app).
        $tokenInfo = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'access_token' => (string) $request->string('access_token'),
        ]);

        $expectedAudiences = array_filter([
            config('services.google.client_id'),
            config('services.google.android_client_id'),
            config('services.google.ios_client_id'),
        ]);

        if (! $tokenInfo->ok()
            || ($expectedAudiences && ! in_array($tokenInfo->json('aud'), $expectedAudiences, true))) {
            return response()->json([
                'message' => 'Invalid Google token. Please try signing in again.',
            ], 422);
        }

        $response = Http::withToken($request->string('access_token'))
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (! $response->ok()) {
            return response()->json([
                'message' => 'Invalid Google token. Please try signing in again.',
            ], 422);
        }

        $profile = $response->json();
        $googleId = $profile['sub'] ?? null;
        $name = $profile['name'] ?? null;

        // Only a provider-verified address may be used to find or link an
        // existing account — an unverified one would let someone claim an
        // address they do not control.
        $email = $this->boolClaim($profile['email_verified'] ?? null)
            ? ($profile['email'] ?? null)
            : null;

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
            $claims = $this->verifyAppleToken($request->string('identity_token'));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Apple identity token could not be verified. Please try again.',
            ], 422);
        }

        // The email MUST come from the signed token. Taking it from the request
        // body would let anyone holding a valid Apple token of their own claim
        // another user's account simply by naming their address.
        $email = $this->boolClaim($claims->email_verified ?? null)
            ? ($claims->email ?? null)
            : null;

        // The display name is not part of the token (Apple sends it once, in the
        // authorization response) and is not security-sensitive.
        $name = $request->string('name') ?: null;

        return $this->loginOrCreate('apple', $claims->sub, $email, $name);
    }

    /** Apple and Google both send `email_verified` as either a bool or "true"/"false". */
    private function boolClaim(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) === true;
    }

    // ── Apple JWT verification ─────────────────────────────────────────────

    /**
     * Verify an Apple identity token (JWT) against Apple's public JWK set and
     * return its decoded claims — `sub` (permanent user ID), and `email` /
     * `email_verified` when Apple includes them.
     *
     * Callers must treat these claims as the ONLY trustworthy source of
     * identity; anything in the request body is attacker-controlled.
     *
     * Apple's keys rotate infrequently   we cache them for 1 hour to avoid
     * a round-trip to Apple on every request.
     */
    private function verifyAppleToken(string $identityToken): object
    {
        // Cache Apple's public key set for 1 hour
        $jwks = Cache::remember('apple_jwks', 3600, function () {
            $res = Http::get('https://appleid.apple.com/auth/keys');
            if (! $res->ok()) {
                throw new \RuntimeException('Failed to fetch Apple public keys.');
            }

            return $res->json(); // { "keys": [...] }
        });

        $keySet = JWK::parseKeySet($jwks);
        $decoded = JWT::decode($identityToken, $keySet);

        // The audience claim must match our iOS bundle ID.
        // config() (not env()) so it works under `php artisan config:cache`.
        $expectedAudiences = array_filter([
            config('services.apple.bundle_id'),              // iOS native
            config('services.apple.client_id'),              // web Services ID (belt+suspenders)
        ]);

        $aud = is_array($decoded->aud) ? $decoded->aud : [$decoded->aud];

        if (empty(array_intersect($aud, $expectedAudiences))) {
            throw new \RuntimeException('Apple token audience mismatch.');
        }

        if ($decoded->iss !== 'https://appleid.apple.com') {
            throw new \RuntimeException('Apple token issuer mismatch.');
        }

        if (empty($decoded->sub)) {
            throw new \RuntimeException('Apple token is missing a subject.');
        }

        return $decoded;
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
                    'social_provider' => $provider,
                    'social_provider_id' => $providerId,
                ]);
            }
        }

        // 3. Create brand-new account
        if (! $user) {
            if (! $email) {
                return response()->json([
                    'message' => 'We could not retrieve your email from '.ucfirst($provider).'. '
                        .'Please try a different sign-in method.',
                ], 422);
            }

            $user = User::create([
                'name' => $name ?: Str::beforeLast($email, '@'),
                'email' => $email,
                'password' => bcrypt(Str::random(40)), // unusable random password
                'email_verified_at' => now(),                   // social = already verified
                'social_provider' => $provider,
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
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'emailVerified' => true, // social login = email already verified by provider
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            ],
        ]);
    }
}
