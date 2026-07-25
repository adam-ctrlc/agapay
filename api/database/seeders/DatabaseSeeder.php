<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            BarangaySeeder::class,
            ProgramSeeder::class,
            LocationSeeder::class,
            UserSeeder::class,
            BeneficiarySeeder::class,
            FranchiseHolderSeeder::class,
            PriceReferenceSeeder::class,
            AnnouncementSeeder::class,
            ServiceGuideSeeder::class,
            ProvinceSeeder::class,
            HazardEventSeeder::class,
            GridStatusSeeder::class,
            PowerInterruptionSeeder::class,
            ResponseTeamSeeder::class,
            MerchantStoreSeeder::class,
        ]);
    }
}
