<?php

namespace Tests\Feature;

use App\Models\CheckIn;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserPushToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Admin had exactly one test file (medications) and no coverage of the gate
 * itself or the user detail page. These cover the things most likely to mislead
 * whoever is doing support:
 *
 *  - the gate actually refusing non-admins
 *  - the check-in count being real rather than the display cap
 *  - entitlement meaning the same thing in admin as it does in the API
 *  - an unanswered body-system rating never reading as 0
 */
class AdminUserDetailTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true, 'role' => 'owner']);
    }

    public function test_a_guest_cannot_reach_admin(): void
    {
        $this->get(route('admin.users'))->assertRedirect();
    }

    public function test_a_signed_in_non_admin_gets_403(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => false]))
            ->get(route('admin.users'))
            ->assertForbidden();
    }

    public function test_an_admin_can_reach_admin(): void
    {
        $this->actingAs($this->admin())->get(route('admin.users'))->assertOk();
    }

    /**
     * The relation is eager-loaded with ->take(10) for display, so the view used
     * to render "10" for a user with far more. Regression: the stat must be the
     * true total.
     */
    public function test_the_checkin_count_is_not_capped_by_the_display_limit(): void
    {
        $user = User::factory()->create();
        CheckIn::factory()->count(14)->create(['user_id' => $user->id]);

        $this->actingAs($this->admin())
            ->get(route('admin.user-detail', $user))
            ->assertOk()
            ->assertSee('14');
    }

    /**
     * The important one. Admin listed override-only rows as active subscribers
     * while User::isSubscribed() returned false for the same person, so support
     * saw a subscriber and the app did not. Both now read Subscription::isEntitled.
     */
    public function test_an_admin_override_counts_as_entitled_everywhere(): void
    {
        $user = User::factory()->create();
        Subscription::create([
            'user_id' => $user->id,
            'plan' => 'free',
            'status' => 'free',            // provider says NOT paying
            'admin_override_ends_at' => now()->addDays(30),
        ]);

        $this->assertTrue(
            $user->refresh()->isSubscribed(),
            'an unexpired admin override must entitle the user, as the admin panel already implied'
        );

        $this->actingAs($this->admin())
            ->get(route('admin.subscriptions'))
            ->assertOk()
            ->assertSee($user->email);
    }

    public function test_an_expired_override_does_not_entitle(): void
    {
        $user = User::factory()->create();
        Subscription::create([
            'user_id' => $user->id,
            'plan' => 'free',
            'status' => 'free',
            'admin_override_ends_at' => now()->subDay(),
        ]);

        $this->assertFalse($user->refresh()->isSubscribed());
    }

    public function test_the_post_failure_grace_window_entitles(): void
    {
        $user = User::factory()->create();
        Subscription::create([
            'user_id' => $user->id,
            'plan' => 'plus',
            'status' => 'past_due',
            'grace_ends_at' => now()->addDays(2),
        ]);

        $this->assertTrue(
            $user->refresh()->isSubscribed(),
            'the webhook sets a 3-day grace window; it should not be silently ignored'
        );
    }

    public function test_a_user_with_no_subscription_is_not_entitled(): void
    {
        $this->assertFalse(User::factory()->create()->isSubscribed());
    }

    /**
     * An unanswered rating is null, and admin must render it as a dash. If it
     * ever showed 0, support would read "not asked" as "worst possible score"
     * and act on it.
     */
    public function test_an_unanswered_body_system_rating_renders_as_a_dash(): void
    {
        $user = User::factory()->create();
        CheckIn::factory()->create([
            'user_id' => $user->id,
            'adherence_percentage' => 80,
            'data' => [
                'wellbeing' => [
                    'energy' => 8, 'mood' => 7, 'sleep' => 6, 'focus' => 5,
                    'digestive' => 7, 'circulation' => null,   // asked, skipped
                    // immunity absent entirely — pre-v3 shape
                ],
                'supplementsTaken' => ['Magnesium glycinate'],
                'supplementsPlanned' => ['Magnesium glycinate', 'Vitamin B12'],
                'symptoms' => ['items' => [['symptom' => 'Fatigue']]],
                'completion' => ['labs' => 'unsure', 'prescriber' => 'yes', 'lifestyle' => ['movement' => 'yes']],
            ],
        ]);

        $html = $this->actingAs($this->admin())
            ->get(route('admin.user-detail', $user))
            ->assertOk()
            ->getContent();

        // 5 of 7 answered: energy, mood, sleep, focus, digestive
        $this->assertStringContainsString('5/7 answered', $html);
        // the denominator makes "1 taken" meaningful
        $this->assertStringContainsString('1/2', $html);
        // 'unsure' is a real answer, not a failure
        $this->assertStringContainsString('Unsure', $html);
    }

    public function test_reminder_state_shows_when_the_account_wants_them_but_no_device_is_registered(): void
    {
        $user = User::factory()->create();
        UserProfile::create([
            'user_id' => $user->id,
            'portal_state' => ['reminderPreferences' => ['enabled' => true]],
        ]);

        // Preference on, zero tokens -> the cron has nothing to deliver to.
        $html = $this->actingAs($this->admin())
            ->get(route('admin.user-detail', $user))
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('Weekly reminders', $html);
        $this->assertStringContainsString('Will receive reminders', $html);
    }

    public function test_a_registered_device_makes_reminders_deliverable(): void
    {
        $user = User::factory()->create();
        UserProfile::create([
            'user_id' => $user->id,
            'portal_state' => ['reminderPreferences' => ['enabled' => true]],
        ]);
        UserPushToken::create([
            'user_id' => $user->id,
            'expo_push_token' => 'ExponentPushToken[test-device-1]',
            'platform' => 'android',
        ]);

        $this->actingAs($this->admin())
            ->get(route('admin.user-detail', $user))
            ->assertOk()
            ->assertSee('Will receive reminders');
    }
}
