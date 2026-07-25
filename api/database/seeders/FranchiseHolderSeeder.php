<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\FranchiseHolder;
use App\Models\User;
use Illuminate\Database\Seeder;

final class FranchiseHolderSeeder extends Seeder
{
    public function run(): void
    {
        $driver = User::query()->where('email', 'driver@ayudalock.test')->first();

        /**
         * Three franchises for one driver: the duplicate-claim guard has to
         * see a single person behind several plates.
         */
        $franchises = [
            ['LTFRB-0000001', 'NGP-1234', 'Jose Dela Cruz', 'jeepney'],
            ['LTFRB-0000002', 'NGP-1234', 'Jose Dela Cruz Jr.', 'jeepney'],
            ['TNVS-0000003', 'NGP-1234', 'J. Dela Cruz', 'tnvs'],
        ];

        foreach ($franchises as [$license, $plate, $name, $type]) {
            FranchiseHolder::query()->updateOrCreate(
                ['license_number' => $license],
                [
                    'user_id' => $driver?->getKey(),
                    'plate_number' => $plate,
                    'driver_name' => $name,
                    'franchise_type' => $type,
                    'barangay' => 'Barangay Commonwealth',
                    'is_active' => true,
                ],
            );
        }

        FranchiseHolder::factory()->count(10)->create();
    }
}
