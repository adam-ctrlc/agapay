<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

final class AuthService
{
    public function __construct(
        private readonly JwtService $jwt,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @return array{user: User, auth: array<string, mixed>}
     */
    public function register(array $data): array
    {
        $parts = preg_split('/\s+/', trim((string) $data['name'])) ?: [];
        $first = $parts[0] ?? null;
        $last = count($parts) > 1 ? end($parts) : null;
        $middle = count($parts) > 2 ? implode(' ', array_slice($parts, 1, -1)) : null;

        $user = User::query()->create([
            'name' => $data['name'],
            'first_name' => $first,
            'middle_name' => $middle,
            'last_name' => $last,
            'username' => $data['username'] ?? null,
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'phone' => $data['phone'] ?? null,
            'barangay_id' => $data['barangay_id'] ?? null,
            'location_id' => $data['location_id'] ?? null,
            'approved_at' => $data['role'] === UserRole::Merchant->value ? null : now(),
        ]);

        return [
            'user' => $user,
            'auth' => $this->jwt->issue($user),
        ];
    }

    /**
     * @return array{user: User, auth: array<string, mixed>}
     */
    public function login(string $identifier, string $password): array
    {
        $user = User::query()
            ->where('email', $identifier)
            ->orWhere('username', $identifier)
            ->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            throw new DomainException('These credentials do not match our records.', Response::HTTP_UNAUTHORIZED);
        }

        return [
            'user' => $user,
            'auth' => $this->jwt->issue($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function refresh(User $user): array
    {
        return $this->jwt->issue($user);
    }
}
