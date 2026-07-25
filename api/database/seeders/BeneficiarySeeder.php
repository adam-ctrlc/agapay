<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Beneficiary;
use App\Models\User;
use Illuminate\Database\Seeder;

final class BeneficiarySeeder extends Seeder
{
    public function run(): void
    {
        $citizen = User::query()->where('email', 'citizen@agapay.test')->first();

        Beneficiary::query()->updateOrCreate(
            ['dswd_id' => 'DSWD-000001'],
            [
                'user_id' => $citizen?->getKey(),
                'household_number' => 'HH-00001',
                'full_name' => 'Maria Santos',
                'barangay' => 'Barangay 176',
                'poverty_status' => 'poor',
                'is_active' => true,
            ],
        );

        Beneficiary::factory()->count(20)->create();
    }
}
