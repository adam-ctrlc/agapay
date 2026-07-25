<?php

namespace Database\Factories;

use App\Models\Beneficiary;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Beneficiary>
 */
class BeneficiaryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'dswd_id' => fake()->unique()->numerify('DSWD-######'),
            'household_number' => fake()->numerify('HH-#####'),
            'full_name' => fake()->name(),
            'barangay' => 'Barangay '.fake()->numerify('###'),
            'poverty_status' => 'poor',
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
