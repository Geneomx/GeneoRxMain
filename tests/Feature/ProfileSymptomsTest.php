<?php

namespace Tests\Feature;

use App\Models\Symptom;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Saving a profile that carries symptoms.
 *
 * This failed outright until the symptoms table was fixed: it was created as
 * a global catalog with NOT NULL UNIQUE `name` and `slug`, then reused for
 * per-user rows written as user_id + symptom_name. Every save carrying a
 * symptom hit "NOT NULL constraint failed", and both the website and the app
 * send that field — so choosing a symptom made the whole save fail, taking
 * the rest of the payload with it.
 */
class ProfileSymptomsTest extends TestCase
{
    use RefreshDatabase;

    private function actingUser(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    public function test_a_profile_save_that_carries_symptoms_succeeds(): void
    {
        $user = $this->actingUser();

        $this->postJson('/api/profile', ['symptoms' => ['Fatigue', 'Headache', 'Nausea']])
            ->assertOk();

        $this->assertSame(
            ['Fatigue', 'Headache', 'Nausea'],
            Symptom::where('user_id', $user->id)->orderBy('id')->pluck('symptom_name')->all()
        );
    }

    /**
     * The unique index was global, so the second person to record a common
     * symptom would have been rejected.
     */
    public function test_two_patients_can_record_the_same_symptom(): void
    {
        $first = $this->actingUser();
        $this->postJson('/api/profile', ['symptoms' => ['Fatigue']])->assertOk();

        $second = $this->actingUser();
        $this->postJson('/api/profile', ['symptoms' => ['Fatigue']])->assertOk();

        $this->assertSame(1, Symptom::where('user_id', $first->id)->count());
        $this->assertSame(1, Symptom::where('user_id', $second->id)->count());
    }

    public function test_saving_symptoms_replaces_the_previous_set(): void
    {
        $user = $this->actingUser();

        $this->postJson('/api/profile', ['symptoms' => ['Fatigue', 'Headache']])->assertOk();
        $this->postJson('/api/profile', ['symptoms' => ['Nausea']])->assertOk();

        $this->assertSame(
            ['Nausea'],
            Symptom::where('user_id', $user->id)->pluck('symptom_name')->all()
        );
    }

    public function test_symptoms_come_back_on_the_next_load(): void
    {
        $this->actingUser();
        $this->postJson('/api/profile', ['symptoms' => ['Fatigue']])->assertOk();

        $this->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('symptoms.0.name', 'Fatigue');
    }

    /** The app sends objects rather than plain strings. */
    public function test_the_apps_object_shape_is_accepted_too(): void
    {
        $user = $this->actingUser();

        $this->postJson('/api/profile', ['symptoms' => [['name' => 'Dizziness']]])->assertOk();

        $this->assertSame(['Dizziness'], Symptom::where('user_id', $user->id)->pluck('symptom_name')->all());
    }
}
