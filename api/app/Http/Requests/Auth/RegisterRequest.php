<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
            'role' => ['required', Rule::enum(UserRole::class)->only([UserRole::Citizen, UserRole::Merchant])],
            'phone' => ['nullable', 'string', 'max:32'],
            'barangay_id' => ['nullable', 'integer', 'exists:barangays,id'],
            'location_id' => [
                'nullable',
                'integer',
                'exists:locations,id',
                Rule::requiredIf(fn (): bool => $this->input('role') === UserRole::Merchant->value),
            ],
        ];
    }
}
