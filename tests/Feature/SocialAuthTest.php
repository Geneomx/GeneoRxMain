<?php

namespace Tests\Feature;

use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

/**
 * End-to-end coverage for Google + Apple sign-in and sign-up on BOTH surfaces:
 * the mobile token API under /api/auth/social, and the web redirect callbacks.
 *
 * These lock in three things that have each broken in production before:
 *  - a brand-new social user can SIGN UP, not just sign in,
 *  - an existing password account gets LINKED rather than duplicated,
 *  - tokens issued to some other app are REJECTED (audience check).
 */
class SocialAuthTest extends TestCase
{
    use RefreshDatabase;

    private const GOOGLE_WEB = 'web-client.apps.googleusercontent.com';

    private const GOOGLE_ANDROID = 'android-client.apps.googleusercontent.com';

    private const APPLE_BUNDLE = 'com.geneorx.app';

    private const APPLE_SERVICE = 'com.geneorx.web';

    /**
     * A throwaway P-256 keypair used only to sign fake Apple identity tokens.
     * Static rather than generated at runtime: openssl_pkey_new() needs an
     * openssl.cnf that is absent on some dev machines and CI images, and a
     * fixed key keeps these tests deterministic.
     */
    private const TEST_EC_PRIVATE_KEY = <<<'PEM'
        -----BEGIN PRIVATE KEY-----
        MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgCzGr17qXhUc2/QDV
        fitKnMibnKJbTknQQtiWbbW5rmahRANCAATmfbJ8mf93XYkc27JXWDxfrbAnxQKe
        W9qwS9hdzI0Xcp2/mXFF0fqd1JMXtjnARgUzOX6LlPaYhawFP4gWXWeU
        -----END PRIVATE KEY-----
        PEM;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.google.client_id' => self::GOOGLE_WEB,
            'services.google.android_client_id' => self::GOOGLE_ANDROID,
            'services.google.ios_client_id' => 'ios-client.apps.googleusercontent.com',
            'services.apple.bundle_id' => self::APPLE_BUNDLE,
            'services.apple.client_id' => self::APPLE_SERVICE,
        ]);

        // verifyAppleToken() caches Apple's JWKS for an hour.
        Cache::flush();
    }

    // ── helpers ────────────────────────────────────────────────────────────

    /** Fake Google's tokeninfo (audience check) and userinfo (profile) calls. */
    private function fakeGoogle(string $aud, array $profile = []): void
    {
        Http::fake([
            'oauth2.googleapis.com/tokeninfo*' => Http::response(['aud' => $aud], 200),
            'www.googleapis.com/oauth2/v3/userinfo*' => Http::response(array_merge([
                'sub' => 'google-user-123',
                'email' => 'new@example.com',
                // Google's userinfo returns this as a real boolean.
                'email_verified' => true,
                'name' => 'New Google User',
            ], $profile), 200),
        ]);
    }

    /**
     * Mint a real ES256 JWT and publish a matching JWK set at Apple's keys URL,
     * so verifyAppleToken() exercises its true signature path, not a stub.
     */
    private function fakeAppleToken(array $overrides = []): string
    {
        $kid = 'test-key-id';

        $privatePem = self::TEST_EC_PRIVATE_KEY;
        $pkey = openssl_pkey_get_private($privatePem);
        $details = openssl_pkey_get_details($pkey);

        $b64u = fn (string $bin): string => rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');

        Http::fake([
            'appleid.apple.com/auth/keys' => Http::response([
                'keys' => [[
                    'kty' => 'EC',
                    'crv' => 'P-256',
                    'use' => 'sig',
                    'alg' => 'ES256',
                    'kid' => $kid,
                    'x' => $b64u($details['ec']['x']),
                    'y' => $b64u($details['ec']['y']),
                ]],
            ], 200),
        ]);

        $claims = array_merge([
            'iss' => 'https://appleid.apple.com',
            'aud' => self::APPLE_BUNDLE,
            'sub' => 'apple-user-123',
            // Real Apple identity tokens carry these; email_verified arrives as
            // the STRING "true", which is exactly why the app coerces it.
            'email' => 'apple-new@example.com',
            'email_verified' => 'true',
            'iat' => time(),
            'exp' => time() + 3600,
        ], $overrides);

        // Allow a test to simulate a token that omits the email entirely.
        $claims = array_filter($claims, fn ($v) => $v !== null);

        return JWT::encode($claims, $privatePem, 'ES256', $kid);
    }

    /**
     * Build a Socialite user for mocking the web redirect flow. The raw payload
     * mirrors what Google's userinfo and Apple's id_token actually return,
     * including the email_verified claim the controller relies on.
     */
    private function socialiteUser(
        string $id,
        ?string $email,
        ?string $name,
        mixed $emailVerified = true,
    ): SocialiteUser {
        $u = new SocialiteUser;
        $u->id = $id;
        $u->email = $email;
        $u->name = $name;
        $u->user = [
            'sub' => $id,
            'email' => $email,
            'email_verified' => $emailVerified,
        ];

        return $u;
    }

    // ── mobile: Google ─────────────────────────────────────────────────────

    public function test_mobile_google_signs_up_a_brand_new_user(): void
    {
        $this->fakeGoogle(self::GOOGLE_ANDROID);

        $this->postJson('/api/auth/social/google', ['access_token' => 'tok'])
            ->assertOk()
            ->assertJsonPath('user.email', 'new@example.com')
            ->assertJsonPath('user.emailVerified', true)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $this->assertDatabaseHas('users', [
            'email' => 'new@example.com',
            'social_provider' => 'google',
            'social_provider_id' => 'google-user-123',
        ]);

        // Social accounts are verified by the provider, so they must never be
        // stranded on the OTP screen.
        $this->assertNotNull(User::where('email', 'new@example.com')->first()->email_verified_at);
    }

    public function test_mobile_google_signs_in_existing_social_user_without_duplicating(): void
    {
        User::factory()->create([
            'email' => 'new@example.com',
            'social_provider' => 'google',
            'social_provider_id' => 'google-user-123',
        ]);

        $this->fakeGoogle(self::GOOGLE_ANDROID);

        $this->postJson('/api/auth/social/google', ['access_token' => 'tok'])->assertOk();

        $this->assertSame(1, User::where('email', 'new@example.com')->count());
    }

    public function test_mobile_google_links_to_an_existing_password_account(): void
    {
        $existing = User::factory()->create([
            'email' => 'new@example.com',
            'social_provider' => null,
            'social_provider_id' => null,
        ]);

        $this->fakeGoogle(self::GOOGLE_ANDROID);

        $this->postJson('/api/auth/social/google', ['access_token' => 'tok'])->assertOk();

        $this->assertSame(1, User::where('email', 'new@example.com')->count());
        $this->assertSame('google', $existing->fresh()->social_provider);
    }

    public function test_mobile_google_rejects_a_token_issued_to_another_app(): void
    {
        // Regression guard: this was a real token-substitution hole.
        $this->fakeGoogle('some-other-app.apps.googleusercontent.com');

        $this->postJson('/api/auth/social/google', ['access_token' => 'tok'])
            ->assertStatus(422);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_mobile_google_requires_an_access_token(): void
    {
        $this->postJson('/api/auth/social/google', [])->assertStatus(422);
    }

    // ── mobile: Apple ──────────────────────────────────────────────────────

    public function test_mobile_apple_signs_up_a_brand_new_user(): void
    {
        $token = $this->fakeAppleToken();

        $this->postJson('/api/auth/social/apple', [
            'identity_token' => $token,
            'email' => 'apple-new@example.com',
            'name' => 'Apple Person',
        ])->assertOk()
            ->assertJsonPath('user.emailVerified', true);

        $this->assertDatabaseHas('users', [
            'email' => 'apple-new@example.com',
            'social_provider' => 'apple',
            'social_provider_id' => 'apple-user-123',
        ]);
    }

    public function test_mobile_apple_relogin_without_email_finds_the_existing_user(): void
    {
        // Apple only sends the email on the FIRST authorization.
        User::factory()->create([
            'email' => 'apple-new@example.com',
            'social_provider' => 'apple',
            'social_provider_id' => 'apple-user-123',
        ]);

        // Simulate a token with no email claim at all — the user must still be
        // resolved from the Apple `sub`.
        $token = $this->fakeAppleToken(['email' => null, 'email_verified' => null]);

        $this->postJson('/api/auth/social/apple', ['identity_token' => $token])
            ->assertOk()
            ->assertJsonPath('user.email', 'apple-new@example.com');

        $this->assertSame(1, User::count());
    }

    public function test_mobile_apple_rejects_a_token_for_another_audience(): void
    {
        $token = $this->fakeAppleToken(['aud' => 'com.someone.else']);

        $this->postJson('/api/auth/social/apple', ['identity_token' => $token])
            ->assertStatus(422);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_mobile_apple_rejects_a_token_from_the_wrong_issuer(): void
    {
        $token = $this->fakeAppleToken(['iss' => 'https://evil.example.com']);

        $this->postJson('/api/auth/social/apple', ['identity_token' => $token])
            ->assertStatus(422);
    }

    public function test_mobile_apple_cannot_take_over_an_account_via_a_forged_email_field(): void
    {
        $victim = User::factory()->create([
            'email' => 'victim@example.com',
            'social_provider' => null,
            'social_provider_id' => null,
        ]);

        // The attacker holds a GENUINELY valid Apple token for their own sub —
        // correct signature, audience and issuer — so verification passes.
        $token = $this->fakeAppleToken([
            'sub' => 'attacker-sub',
            'email' => 'attacker@example.com',
        ]);

        // ...but claims the victim's address in the request body.
        $this->postJson('/api/auth/social/apple', [
            'identity_token' => $token,
            'email' => 'victim@example.com',
        ]);

        $victim->refresh();

        // Identity must come from the signed token, never the request body.
        $this->assertNull($victim->social_provider, 'Victim account was linked to the attacker.');
        $this->assertSame(0, $victim->tokens()->count(), 'An API token was issued for the victim.');
    }

    public function test_mobile_apple_uses_the_email_from_the_signed_token(): void
    {
        $token = $this->fakeAppleToken(['email' => 'from-token@example.com']);

        $this->postJson('/api/auth/social/apple', [
            'identity_token' => $token,
            // A different address here must be ignored entirely.
            'email' => 'from-body@example.com',
        ])->assertOk()
            ->assertJsonPath('user.email', 'from-token@example.com');

        $this->assertDatabaseMissing('users', ['email' => 'from-body@example.com']);
    }

    public function test_mobile_google_ignores_an_unverified_email(): void
    {
        // Google's userinfo carries email_verified; an unverified address must
        // not be usable to link onto an existing account.
        User::factory()->create(['email' => 'victim2@example.com']);

        $this->fakeGoogle(self::GOOGLE_ANDROID, [
            'sub' => 'attacker-google-sub',
            'email' => 'victim2@example.com',
            'email_verified' => false,
        ]);

        $this->postJson('/api/auth/social/google', ['access_token' => 'tok']);

        $this->assertNull(User::where('email', 'victim2@example.com')->first()->social_provider);
    }

    public function test_mobile_apple_accepts_the_web_services_id_audience(): void
    {
        $token = $this->fakeAppleToken(['aud' => self::APPLE_SERVICE]);

        $this->postJson('/api/auth/social/apple', [
            'identity_token' => $token,
            'email' => 'apple-svc@example.com',
        ])->assertOk();
    }

    // ── web: Google ────────────────────────────────────────────────────────

    public function test_web_google_callback_signs_up_and_logs_in(): void
    {
        Socialite::shouldReceive('driver->user')
            ->andReturn($this->socialiteUser('g-web-1', 'webgoogle@example.com', 'Web Google'));

        $this->get('/auth/google/callback')->assertRedirect(route('treatments'));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'webgoogle@example.com',
            'social_provider' => 'google',
        ]);
    }

    public function test_web_google_callback_redirects_to_login_on_failure(): void
    {
        Socialite::shouldReceive('driver->user')
            ->andThrow(new \RuntimeException('denied'));

        $this->get('/auth/google/callback')->assertRedirect(route('login'));

        $this->assertGuest();
    }

    // ── web: Apple ─────────────────────────────────────────────────────────

    public function test_web_apple_callback_signs_up_and_logs_in(): void
    {
        Socialite::shouldReceive('driver->stateless->user')
            ->andReturn($this->socialiteUser('a-web-1', 'webapple@example.com', 'Web Apple'));

        $this->post('/auth/apple/callback')->assertRedirect(route('treatments'));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'webapple@example.com',
            'social_provider' => 'apple',
        ]);
    }

    public function test_web_apple_callback_handles_apples_string_email_verified(): void
    {
        // Apple sends "true" as a STRING, not a boolean.
        Socialite::shouldReceive('driver->stateless->user')
            ->andReturn($this->socialiteUser('a-web-3', 'stringbool@example.com', 'String Bool', 'true'));

        $this->post('/auth/apple/callback')->assertRedirect(route('treatments'));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'stringbool@example.com']);
    }

    public function test_web_google_does_not_link_an_unverified_email(): void
    {
        User::factory()->create(['email' => 'webvictim@example.com']);

        Socialite::shouldReceive('driver->user')
            ->andReturn($this->socialiteUser('g-web-evil', 'webvictim@example.com', 'Evil', false));

        $this->get('/auth/google/callback')->assertRedirect(route('login'));

        $this->assertGuest();
        $this->assertNull(User::where('email', 'webvictim@example.com')->first()->social_provider);
    }

    public function test_web_apple_callback_is_csrf_exempt(): void
    {
        // Apple posts back cross-site with no CSRF token. A 419 here means the
        // exemption in bootstrap/app.php regressed and Apple web login is dead.
        Socialite::shouldReceive('driver->stateless->user')
            ->andReturn($this->socialiteUser('a-web-2', 'csrf@example.com', 'CSRF Apple'));

        $this->post('/auth/apple/callback')->assertStatus(302);
    }
}
