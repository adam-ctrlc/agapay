<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\AllocationStatus;
use App\Models\Beneficiary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AllocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_eligible_citizen_locks_stock_and_receives_a_voucher(): void
    {
        $scenario = $this->makeFoodScenario(['stock' => 500]);

        $response = $this->withAuth($scenario['citizen'])->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 5,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', AllocationStatus::Locked->value)
            ->assertJsonStructure(['data' => ['voucher' => ['token', 'qr_payload', 'sms_code', 'expires_at']]]);

        $this->assertDatabaseHas('inventories', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity_available' => 495,
            'quantity_locked' => 5,
        ]);
    }

    public function test_ineligible_citizen_cannot_lock(): void
    {
        $scenario = $this->makeFoodScenario();

        $stranger = User::factory()->citizen()->create();

        $this->withAuth($stranger)->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 5,
        ])->assertStatus(403);
    }

    public function test_lock_is_rejected_when_stock_is_insufficient(): void
    {
        $scenario = $this->makeFoodScenario(['stock' => 3]);

        $this->withAuth($scenario['citizen'])->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 5,
        ])->assertStatus(422);

        $this->assertDatabaseHas('inventories', [
            'location_id' => $scenario['location']->id,
            'quantity_available' => 3,
            'quantity_locked' => 0,
        ]);
    }

    public function test_lock_respects_per_beneficiary_cap(): void
    {
        $scenario = $this->makeFoodScenario(['cap' => 5]);

        $this->withAuth($scenario['citizen'])->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 6,
        ])->assertStatus(422);
    }

    public function test_stock_is_not_oversold_across_two_citizens(): void
    {
        $scenario = $this->makeFoodScenario(['stock' => 5, 'cap' => 5]);

        $second = User::factory()->citizen()->create([
            'barangay_id' => $scenario['barangay']->id,
        ]);
        Beneficiary::factory()->create(['user_id' => $second->id, 'is_active' => true]);

        $this->withAuth($scenario['citizen'])->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 5,
        ])->assertCreated();

        $this->withAuth($second)->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 5,
        ])->assertStatus(422);

        $this->assertDatabaseHas('inventories', [
            'location_id' => $scenario['location']->id,
            'quantity_available' => 0,
            'quantity_locked' => 5,
        ]);
    }

    public function test_citizen_can_release_a_locked_allocation(): void
    {
        $scenario = $this->makeFoodScenario(['stock' => 100]);

        $lock = $this->withAuth($scenario['citizen'])->postJson('/api/allocations', [
            'location_id' => $scenario['location']->id,
            'commodity_id' => $scenario['commodity']->id,
            'quantity' => 5,
        ])->assertCreated();

        $allocationId = $lock->json('data.id');

        $this->withAuth($scenario['citizen'])->deleteJson("/api/allocations/{$allocationId}")
            ->assertOk();

        $this->assertDatabaseHas('inventories', [
            'location_id' => $scenario['location']->id,
            'quantity_available' => 100,
            'quantity_locked' => 0,
        ]);

        $this->assertDatabaseHas('allocations', [
            'id' => $allocationId,
            'status' => AllocationStatus::Cancelled->value,
        ]);
    }
}
