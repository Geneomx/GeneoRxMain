<?php

namespace Database\Factories;

use App\Models\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    protected $model = Doctor::class;

    public function definition(): array
    {
        return [
            'name' => 'Dr '.$this->faker->lastName(),
            'specialty' => $this->faker->randomElement([
                'Internal medicine', 'Endocrinology', 'Cardiology', 'General practice',
            ]),
            'mobile' => '+1'.$this->faker->numerify('##########'),
            'email' => $this->faker->unique()->safeEmail(),
            'bio' => $this->faker->sentence(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
