<?php

namespace Tests\Feature;

use App\Models\EmailOtp;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\EmailOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmailOtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_registration_sends_email_otp(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertCreated()
            ->assertJsonPath('user.emailVerified', false);

        $user = User::where('email', 'test@example.com')->firstOrFail();

        Notification::assertSentTo($user, EmailOtpNotification::class);
        $this->assertDatabaseHas('email_otps', ['user_id' => $user->id, 'email' => 'test@example.com']);
    }

    public function test_email_otp_verifies_user(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'verify@example.com']);

        EmailOtp::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
            'last_sent_at' => now(),
        ]);

        $this->postJson('/api/auth/email-otp/verify', [
            'email' => $user->email,
            'code' => '123456',
        ])->assertOk()
            ->assertJsonPath('emailVerified', true);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_push_token_can_be_registered(): void
    {
        $user = User::factory()->create();
        Subscription::create([
            'user_id' => $user->id,
            'plan' => 'plus',
            'status' => 'active',
            'provider' => 'stripe',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/mobile/push-token', [
            'expoPushToken' => 'ExponentPushToken[test-token]',
            'platform' => 'ios',
        ])->assertOk();

        $this->assertDatabaseHas('user_push_tokens', [
            'user_id' => $user->id,
            'expo_push_token' => 'ExponentPushToken[test-token]',
            'platform' => 'ios',
        ]);
    }
}
