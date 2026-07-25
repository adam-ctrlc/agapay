<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AllocationStatus;
use App\Enums\RedemptionSource;
use App\Enums\UserRole;
use App\Models\Allocation;
use App\Models\Commodity;
use App\Models\Inventory;
use App\Models\Redemption;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Gives the demo merchant's assigned store something to look at: stock with a
 * reserved slice, and a few redemptions already on the books.
 */
final class MerchantStoreSeeder extends Seeder
{
    public function run(): void
    {
        $merchant = User::query()
            ->where('email', 'merchant@agapay.test')
            ->whereNotNull('location_id')
            ->first();

        if ($merchant === null) {
            return;
        }

        $rice = Commodity::query()->where('name', 'Rice')->first();

        if ($rice === null) {
            return;
        }

        Inventory::query()->updateOrCreate(
            ['location_id' => $merchant->location_id, 'commodity_id' => $rice->id],
            ['quantity_available' => 640, 'quantity_locked' => 85],
        );

        /**
         * Re-running the seeders must not stack up another set of fake
         * redemptions on top of the last ones.
         */
        $alreadySeeded = Redemption::query()
            ->where('merchant_id', $merchant->getKey())
            ->exists();

        if ($alreadySeeded) {
            return;
        }

        $claimants = User::query()
            ->where('role', UserRole::Citizen->value)
            ->orderBy('id')
            ->take(2)
            ->get();

        if ($claimants->isEmpty()) {
            return;
        }

        $hoursAgo = 2;

        foreach ($claimants as $claimant) {
            foreach ([5, 3] as $quantity) {
                $allocation = Allocation::query()->create([
                    'user_id' => $claimant->getKey(),
                    'location_id' => $merchant->location_id,
                    'commodity_id' => $rice->id,
                    'program_id' => $rice->program_id,
                    'quantity' => $quantity,
                    'status' => AllocationStatus::Redeemed->value,
                    'expires_at' => now()->subHours($hoursAgo)->addDay(),
                ]);

                Redemption::query()->create([
                    'allocation_id' => $allocation->getKey(),
                    'merchant_id' => $merchant->getKey(),
                    'location_id' => $merchant->location_id,
                    'quantity' => $quantity,
                    'source' => RedemptionSource::Online->value,
                    'client_uuid' => (string) Str::uuid(),
                    'redeemed_at' => now()->subHours($hoursAgo),
                    'synced_at' => now()->subHours($hoursAgo),
                ]);

                $hoursAgo += 5;
            }
        }
    }
}
