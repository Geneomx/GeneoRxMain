<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileAccountLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_second_device_login_keeps_first_device_signed_in(): void
    {
        $user = User::factory()->create(['password' => 'ReviewOnly!2026']);
        $first = $user->createToken('mobile');
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'ReviewOnly!2026'])->assertOk();
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $first->accessToken->id]);
        $this->assertSame(2, $user->tokens()->count());
    }

    public function test_logout_revokes_only_the_current_device(): void
    {
        $user = User::factory()->create();
        $first = $user->createToken('mobile');
        $second = $user->createToken('mobile');
        $this->withToken($first->plainTextToken)->postJson('/api/auth/logout')->assertOk();
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $first->accessToken->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $second->accessToken->id]);
    }

    public function test_malformed_tracking_data_is_rejected_before_partial_profile_changes(): void
    {
        $user = User::factory()->create();
        UserProfile::create(['user_id' => $user->id, 'phone' => 'old']);
        $this->withToken($user->createToken('mobile')->plainTextToken)->postJson('/api/mobile/profile', [
            'profile' => ['phone' => 'new'],
            'checkins' => [['dateISO' => 'not-a-date', 'adherencePct' => 170]],
        ])->assertUnprocessable()->assertJsonValidationErrors(['checkins.0.dateISO', 'checkins.0.adherencePct']);
        $this->assertDatabaseHas('user_profiles', ['user_id' => $user->id, 'phone' => 'old']);
    }

    public function test_optional_profile_fields_can_be_cleared_and_other_flags_survive(): void
    {
        $user = User::factory()->create();
        UserProfile::create(['user_id' => $user->id, 'phone' => '123', 'date_of_birth' => '1980-01-01', 'kidney_disease' => true]);
        $this->withToken($user->createToken('mobile')->plainTextToken)->postJson('/api/mobile/profile', [
            'profile' => ['phone' => '', 'age' => ''],
        ])->assertOk();
        $profile = $user->profile()->first();
        $this->assertNull($profile->phone);
        $this->assertNull($profile->date_of_birth);
        $this->assertTrue($profile->kidney_disease);
    }
}
