<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\LocationType;
use App\Enums\UserRole;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class UserSeeder extends Seeder
{
    public function run(): void
    {
        /**
         * Never a published constant. The repo is public and the demo API is
         * live, so a fixed seeded password is a real account takeover, not a
         * convenience. Local seeding still defaults to something typeable.
         */
        $password = Hash::make(env('DEMO_PASSWORD') ?: 'password');

        $kadiwa = Location::query()->where('type', LocationType::KadiwaStore->value)->first();
        $station = Location::query()->where('type', LocationType::GasStation->value)->first();

        User::query()->firstOrCreate(
            ['email' => 'citizen@agapay.test'],
            [
                'name' => 'Maria Santos',
                'first_name' => 'Maria',
                'middle_name' => 'Reyes',
                'last_name' => 'Santos',
                'username' => 'maria',
                'password' => $password,
                'role' => UserRole::Citizen->value,
                'phone' => '09170000001',
            ],
        );

        User::query()->firstOrCreate(
            ['email' => 'driver@agapay.test'],
            [
                'name' => 'Jose Dela Cruz',
                'first_name' => 'Jose',
                'middle_name' => 'Ramos',
                'last_name' => 'Dela Cruz',
                'username' => 'jose',
                'password' => $password,
                'role' => UserRole::Citizen->value,
                'phone' => '09170000002',
            ],
        );

        User::query()->firstOrCreate(
            ['email' => 'merchant@agapay.test'],
            [
                'name' => 'Kadiwa Vendor',
                'first_name' => 'Kadiwa',
                'last_name' => 'Vendor',
                'username' => 'kadiwa',
                'password' => $password,
                'role' => UserRole::Merchant->value,
                'phone' => '09170000003',
                'location_id' => $kadiwa?->id,
                'approved_at' => now(),
            ],
        );

        /**
         * Deliberately left unapproved so the LGU approval queue has something
         * real to act on straight after seeding.
         */
        User::query()->firstOrCreate(
            ['email' => 'pending@agapay.test'],
            [
                'name' => 'Nena Bautista',
                'first_name' => 'Nena',
                'last_name' => 'Bautista',
                'username' => 'nena',
                'password' => $password,
                'role' => UserRole::Merchant->value,
                'phone' => '09170000005',
                'location_id' => $station?->id,
                'approved_at' => null,
            ],
        );

        User::query()->firstOrCreate(
            ['email' => 'mayor@agapay.test'],
            [
                'name' => 'City DRRMO Admin',
                'first_name' => 'Andres',
                'last_name' => 'Bonifacio',
                'username' => 'mayor',
                'password' => $password,
                'role' => UserRole::LguAdmin->value,
                'phone' => '09170000004',
            ],
        );
    }
}
