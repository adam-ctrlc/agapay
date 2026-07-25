<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BlockedReason;
use App\Enums\InterruptionStatus;
use App\Enums\InterruptionType;
use App\Models\BlockedClaim;
use App\Models\FranchiseHolder;
use App\Models\PowerInterruption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class BlockedClaimTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_unregistered_identity_is_recorded_as_blocked(): void
    {
        $scenario = $this->makeFoodScenario();

        $stranger = User::factory()->create([
            'role' => $this->citizenType(),
        ]);

        $this->withAuth($stranger)->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 1,
        ])->assertForbidden();

        $this->assertDatabaseHas('blocked_claims', [
            'reason' => BlockedReason::NotEligible->value,
            'user_id' => $stranger->id,
        ]);
    }

    public function test_a_second_claim_over_the_cap_is_recorded(): void
    {
        $scenario = $this->makeFoodScenario(['cap' => 5]);

        $this->withAuth($scenario['citizen']);

        $this->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 5,
        ])->assertCreated();

        $this->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 5,
        ])->assertStatus(422);

        $this->assertDatabaseHas('blocked_claims', [
            'reason' => BlockedReason::OverCap->value,
            'user_id' => $scenario['citizen']->id,
        ]);

        $this->assertSame(1, BlockedClaim::query()->count());
    }

    public function test_an_offline_service_point_is_recorded(): void
    {
        $scenario = $this->makeFoodScenario();
        $location = $scenario['location'];

        PowerInterruption::query()->create([
            'type' => InterruptionType::Rotating,
            'status' => InterruptionStatus::Announced,
            'utility' => 'Meralco',
            'province_code' => $location->barangay->province_code,
            'barangay_id' => $location->barangay_id,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addHour(),
        ]);

        $this->withAuth($scenario['citizen'])->postJson('/api/allocations', [
            'location_id' => $location->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 1,
        ])->assertStatus(422);

        $this->assertDatabaseHas('blocked_claims', [
            'reason' => BlockedReason::LocationOffline->value,
            'location_id' => $location->id,
        ]);
    }

    public function test_a_stock_rejection_survives_the_transaction_rollback(): void
    {
        $scenario = $this->makeFoodScenario(['stock' => 1]);

        $this->withAuth($scenario['citizen'])->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 4,
        ])->assertStatus(422);

        $this->assertDatabaseHas('blocked_claims', [
            'reason' => BlockedReason::InsufficientStock->value,
            'user_id' => $scenario['citizen']->id,
        ]);

        $this->assertDatabaseHas('inventories', [
            'location_id' => $scenario['location']->id,
            'quantity_available' => 1,
            'quantity_locked' => 0,
        ]);
    }

    public function test_the_registry_tolerates_duplicate_rows_under_one_identity(): void
    {
        $driver = User::factory()->create(['role' => $this->citizenType()]);

        FranchiseHolder::factory()->create([
            'user_id' => $driver->id,
            'driver_name' => 'Jose Dela Cruz',
            'license_number' => 'LTFRB-0001',
            'is_active' => true,
        ]);

        FranchiseHolder::factory()->create([
            'user_id' => $driver->id,
            'driver_name' => 'Jose Dela Cruz Jr.',
            'license_number' => 'LTFRB-0002',
            'is_active' => true,
        ]);

        $this->assertSame(2, FranchiseHolder::query()->where('user_id', $driver->id)->count());
    }
}
