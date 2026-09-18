<?php

namespace Database\Factories;

use App\Models\CheckIn;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CheckIn>
 */
class CheckInFactory extends Factory
{
    protected $model = CheckIn::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => 'active',
            'date_checked' => now(),
            'adherence_percentage' => $this->faker->numberBetween(40, 100),
            'notes' => '',
            // The client stores the whole payload in `data`; the top-level
            // columns are denormalized copies. Default to the pre-v3 shape so a
            // plain factory call exercises the backward-compatible path.
            'data' => [
                'dateISO' => now()->toDateString(),
                'adherencePct' => 80,
                'supplementsTaken' => [],
                'symptoms' => ['items' => [], 'improvementScore' => 0],
                'wellbeing' => ['energy' => 5, 'mood' => 5, 'sleep' => 5, 'focus' => 5],
                'sideEffects' => [],
                'notes' => '',
            ],
        ];
    }
}
