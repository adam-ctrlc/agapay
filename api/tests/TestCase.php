<?php

declare(strict_types=1);

namespace Tests;

use App\Enums\LocationType;
use App\Enums\ProgramType;
use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Beneficiary;
use App\Models\Commodity;
use App\Models\Inventory;
use App\Models\Location;
use App\Models\Program;
use App\Models\User;
use App\Services\Auth\JwtService;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function tokenFor(User $user): string
    {
        return app(JwtService::class)->issue($user)['token'];
    }

    protected function withAuth(User $user): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user));
    }

    /**
     * Build a complete, self-consistent food-relief scenario for tests.
     *
     * @param  array<string, mixed>  $overrides
     * @return array{citizen: User, merchant: User, location: Location, commodity: Commodity, program: Program, inventory: Inventory, barangay: Barangay}
     */
    protected function makeFoodScenario(array $overrides = []): array
    {
        $barangay = Barangay::factory()->create();

        $program = Program::factory()->food()->create([
            'per_beneficiary_cap' => $overrides['cap'] ?? 5,
        ]);

        $commodity = Commodity::factory()->create([
            'program_id' => $program->id,
            'name' => 'Rice',
            'unit' => 'kg',
        ]);

        $location = Location::factory()->kadiwaStore()->create([
            'barangay_id' => $barangay->id,
        ]);

        $inventory = Inventory::factory()->create([
            'location_id' => $location->id,
            'commodity_id' => $commodity->id,
            'quantity_available' => $overrides['stock'] ?? 500,
            'quantity_locked' => 0,
        ]);

        $citizen = User::factory()->citizen()->create([
            'barangay_id' => $barangay->id,
        ]);

        Beneficiary::factory()->create([
            'user_id' => $citizen->id,
            'is_active' => true,
        ]);

        $merchant = User::factory()->merchant()->create([
            'location_id' => $location->id,
        ]);

        return compact('citizen', 'merchant', 'location', 'commodity', 'program', 'inventory', 'barangay');
    }

    protected function lguAdmin(): User
    {
        return User::factory()->lguAdmin()->create();
    }

    protected function citizenType(): string
    {
        return UserRole::Citizen->value;
    }

    protected function foodType(): string
    {
        return ProgramType::Food->value;
    }

    protected function kadiwaType(): string
    {
        return LocationType::KadiwaStore->value;
    }
}
