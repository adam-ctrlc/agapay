<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class EligibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_registered_beneficiary_is_eligible_for_food_program(): void
    {
        $scenario = $this->makeFoodScenario();

        $response = $this->withAuth($scenario['citizen'])->postJson('/api/eligibility/verify');

        $response->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonFragment(['name' => $scenario['program']->name]);
    }

    public function test_non_beneficiary_is_not_eligible(): void
    {
        $this->makeFoodScenario();

        $stranger = User::factory()->citizen()->create();

        $this->withAuth($stranger)->postJson('/api/eligibility/verify')
            ->assertOk()
            ->assertJsonPath('eligible', false)
            ->assertJsonPath('programs', []);
    }
}
