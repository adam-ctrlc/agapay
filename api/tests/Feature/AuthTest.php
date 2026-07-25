<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

final class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_citizen_can_register_and_receive_a_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Maria Santos',
            'email' => 'maria@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => UserRole::Citizen->value,
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', UserRole::Citizen->value)
            ->assertJsonStructure(['token', 'token_type', 'expires_in', 'user' => ['id', 'email']]);

        $this->assertDatabaseHas('users', ['email' => 'maria@example.com']);
    }

    public function test_merchant_registration_requires_a_location(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Vendor',
            'email' => 'vendor@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => UserRole::Merchant->value,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrorFor('location_id');
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'jose@example.com',
            'password' => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'identifier' => 'jose@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()->assertJsonStructure(['token', 'user' => ['id']]);
    }

    public function test_user_can_login_with_username(): void
    {
        User::factory()->create([
            'username' => 'jose',
            'password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/auth/login', [
            'identifier' => 'jose',
            'password' => 'secret123',
        ])->assertOk()->assertJsonPath('user.username', 'jose');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'jose@example.com',
            'password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/auth/login', [
            'identifier' => 'jose@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(401);
    }

    public function test_me_returns_the_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->withAuth($user)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
    }
}
