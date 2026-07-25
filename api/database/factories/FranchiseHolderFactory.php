<?php

namespace Database\Factories;

use App\Models\FranchiseHolder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FranchiseHolder>
 */
class FranchiseHolderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'license_number' => fake()->unique()->numerify('LTFRB-#######'),
            'plate_number' => strtoupper(fake()->unique()->bothify('???-####')),
            'driver_name' => fake()->name(),
            'franchise_type' => 'puv',
            'barangay' => 'Barangay '.fake()->numerify('###'),
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
