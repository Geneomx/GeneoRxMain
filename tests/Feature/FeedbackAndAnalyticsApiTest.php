<?php

namespace Tests\Feature;

use App\Models\AnalyticsEvent;
use App\Models\Feedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Contract tests for the two endpoints the mobile app was just wired up to.
 * Both are deliberately guest-friendly, and both are called fire-and-forget by
 * the clients — so a silent contract change here would lose data with no
 * visible error anywhere.
 */
class FeedbackAndAnalyticsApiTest extends TestCase
{
    use RefreshDatabase;

    // ── feedback ───────────────────────────────────────────────────────────

    public function test_a_guest_can_submit_feedback_with_a_contact_email(): void
    {
        $this->postJson('/api/feedback', [
            'type' => 'bug',
            'message' => 'The results screen is blank.',
            'can_contact' => true,
            'contact_email' => 'guest@example.com',
            'source' => 'mobile',
        ])->assertCreated()
            ->assertJson(['ok' => true]);

        $this->assertDatabaseHas('feedback', [
            'user_id' => null,
            'type' => 'bug',
            'source' => 'mobile',
            'status' => 'new',
            'contact_email' => 'guest@example.com',
        ]);
    }

    public function test_a_signed_in_user_is_attributed_and_their_contact_email_is_dropped(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/feedback', [
            'type' => 'suggestion',
            'message' => 'Add a dark mode toggle.',
            'contact_email' => 'someone-else@example.com',
            'source' => 'mobile',
        ])->assertCreated();

        $feedback = Feedback::sole();

        $this->assertSame($user->id, $feedback->user_id);
        // We already know how to reach them; storing a client-supplied address
        // would let one user attach another's email to their own record.
        $this->assertNull($feedback->contact_email);
    }

    public function test_feedback_type_is_case_sensitive_and_rejects_ui_labels(): void
    {
        // The mobile UI labels are capitalised ("Bug"); they must be lowercased
        // before sending, which is what toFeedbackType() in the app does.
        $this->postJson('/api/feedback', [
            'type' => 'Bug',
            'message' => 'Capitalised type should not be accepted.',
        ])->assertStatus(422)
            ->assertJsonValidationErrors('type');
    }

    public function test_feedback_requires_a_message(): void
    {
        $this->postJson('/api/feedback', ['type' => 'other'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('message');
    }

    public function test_feedback_rejects_a_malformed_contact_email(): void
    {
        // Guards the old mobile behaviour, which sent the literal translated
        // string "Anonymous" when no address was known.
        $this->postJson('/api/feedback', [
            'type' => 'other',
            'message' => 'No real address supplied.',
            'contact_email' => 'Anonymous',
        ])->assertStatus(422)
            ->assertJsonValidationErrors('contact_email');
    }

    // ── analytics ──────────────────────────────────────────────────────────

    public function test_a_guest_event_is_recorded(): void
    {
        $this->postJson('/api/analytics/track', [
            'name' => 'wizard_step_viewed',
            'properties' => ['step' => 4, 'label' => 'Results'],
        ])->assertOk()->assertJson(['ok' => true]);

        $event = AnalyticsEvent::sole();

        $this->assertSame('wizard_step_viewed', $event->name);
        $this->assertNull($event->user_id);
        $this->assertSame(4, $event->properties['step']);
    }

    public function test_an_authenticated_event_is_attributed(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/analytics/track', ['name' => 'checkin_saved'])->assertOk();

        $this->assertSame($user->id, AnalyticsEvent::sole()->user_id);
    }

    public function test_an_unknown_event_name_is_accepted_but_not_stored(): void
    {
        // Deliberate: clients are fire-and-forget, so an unrecognised name must
        // not surface an error — but it must not pollute the table either.
        $this->postJson('/api/analytics/track', ['name' => 'not_a_real_event'])
            ->assertOk();

        $this->assertDatabaseCount('analytics_events', 0);
    }

    /**
     * Every event the clients emit must be on the server allow-list, or it is
     * silently discarded and the funnel quietly loses a step.
     */
    public function test_every_event_the_clients_emit_is_allow_listed(): void
    {
        $clientEvents = [
            'wizard_step_viewed',
            'results_viewed',
            'wizard_completed',
            'medication_added',
            'plan_started',
            'checkin_saved',
            'report_downloaded',
        ];

        foreach ($clientEvents as $name) {
            $this->postJson('/api/analytics/track', ['name' => $name])->assertOk();
        }

        $stored = AnalyticsEvent::pluck('name')->all();

        $this->assertSame(
            [],
            array_values(array_diff($clientEvents, $stored)),
            'These events are emitted by the clients but are silently dropped by the server allow-list.',
        );
    }

    public function test_properties_are_capped_to_twenty_keys(): void
    {
        $this->postJson('/api/analytics/track', [
            'name' => 'screen_viewed',
            'properties' => array_combine(
                array_map(fn ($i) => "k{$i}", range(1, 30)),
                range(1, 30),
            ),
        ])->assertOk();

        $this->assertCount(20, AnalyticsEvent::sole()->properties);
    }
}
