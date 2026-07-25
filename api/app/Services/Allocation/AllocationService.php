<?php

declare(strict_types=1);

namespace App\Services\Allocation;

use App\Enums\AllocationStatus;
use App\Enums\BlockedReason;
use App\Exceptions\BlockedClaimException;
use App\Exceptions\DomainException;
use App\Models\Allocation;
use App\Models\BlockedClaim;
use App\Models\Commodity;
use App\Models\Inventory;
use App\Models\Location;
use App\Models\User;
use App\Models\Voucher;
use App\Services\Eligibility\EligibilityService;
use App\Services\Energy\EnergyImpactService;
use App\Services\Voucher\VoucherTokenService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class AllocationService
{
    public function __construct(
        private readonly EligibilityService $eligibility,
        private readonly VoucherTokenService $voucherToken,
        private readonly EnergyImpactService $energyImpact,
    ) {}

    public function createLock(User $user, Location $location, Commodity $commodity, float $quantity): Allocation
    {
        try {
            return $this->attemptLock($user, $location, $commodity, $quantity);
        } catch (BlockedClaimException $e) {
            $this->recordBlocked($e, $user, $location, $commodity, $quantity);

            throw $e;
        }
    }

    private function attemptLock(User $user, Location $location, Commodity $commodity, float $quantity): Allocation
    {
        if ($quantity <= 0) {
            throw new DomainException('Requested quantity must be greater than zero.');
        }

        $program = $commodity->program;

        if ($program === null || ! $program->is_active) {
            throw new BlockedClaimException(
                BlockedReason::ProgramInactive,
                'This program is not currently active.',
            );
        }

        if (! $this->eligibility->isEligibleFor($user, $program)) {
            throw new BlockedClaimException(
                BlockedReason::NotEligible,
                'You are not eligible for this program.',
                403,
            );
        }

        $this->assertLocationPowered($location);

        $cap = (float) $program->per_beneficiary_cap;
        $alreadyHeld = $this->quantityHeldByUser($user, (int) $program->getKey());

        if ($alreadyHeld + $quantity > $cap) {
            throw new BlockedClaimException(
                BlockedReason::OverCap,
                "This request exceeds your program cap of {$cap} {$program->unit}. You already hold {$alreadyHeld}.",
            );
        }

        return DB::transaction(function () use ($user, $location, $commodity, $program, $quantity): Allocation {
            $inventory = Inventory::query()
                ->where('location_id', $location->getKey())
                ->where('commodity_id', $commodity->getKey())
                ->lockForUpdate()
                ->first();

            if ($inventory === null || (float) $inventory->quantity_available < $quantity) {
                throw new BlockedClaimException(
                    BlockedReason::InsufficientStock,
                    'This location does not have enough stock for your request.',
                );
            }

            $inventory->quantity_available = (float) $inventory->quantity_available - $quantity;
            $inventory->quantity_locked = (float) $inventory->quantity_locked + $quantity;
            $inventory->save();

            $expiresAt = Carbon::now()->addMinutes((int) config('voucher.ttl_minutes'));

            $allocation = Allocation::query()->create([
                'user_id' => $user->getKey(),
                'location_id' => $location->getKey(),
                'commodity_id' => $commodity->getKey(),
                'program_id' => $program->getKey(),
                'quantity' => $quantity,
                'status' => AllocationStatus::Locked,
                'expires_at' => $expiresAt,
            ]);

            $issued = $this->voucherToken->issue($allocation, $expiresAt);

            Voucher::query()->create([
                'allocation_id' => $allocation->getKey(),
                'token' => $issued['token'],
                'qr_payload' => $issued['qr_payload'],
                'sms_code' => $issued['sms_code'],
                'expires_at' => $expiresAt,
            ]);

            return $allocation->load(['voucher', 'commodity', 'program', 'location']);
        });
    }

    public function cancel(Allocation $allocation): Allocation
    {
        if ($allocation->status !== AllocationStatus::Locked) {
            throw new DomainException('Only an active locked allocation can be released.');
        }

        return DB::transaction(function () use ($allocation): Allocation {
            $this->releaseInventory($allocation);

            $allocation->status = AllocationStatus::Cancelled;
            $allocation->save();

            return $allocation;
        });
    }

    public function releaseExpired(): int
    {
        $expired = Allocation::query()
            ->where('status', AllocationStatus::Locked)
            ->where('expires_at', '<', Carbon::now())
            ->get();

        $count = 0;

        foreach ($expired as $allocation) {
            DB::transaction(function () use ($allocation): void {
                $this->releaseInventory($allocation);
                $allocation->status = AllocationStatus::Expired;
                $allocation->save();
            });

            $count++;
        }

        return $count;
    }

    private function assertLocationPowered(Location $location): void
    {
        if ($this->energyImpact->statusFor($location)->canServe()) {
            return;
        }

        $alternative = $this->energyImpact->resilientAlternatives($location, 1)->first();

        $message = $alternative === null
            ? "{$location->name} is offline due to a power interruption. No powered service point is available nearby right now."
            : "{$location->name} is offline due to a power interruption. Nearest service point with power: {$alternative->name}.";

        throw new BlockedClaimException(BlockedReason::LocationOffline, $message);
    }

    private function recordBlocked(
        BlockedClaimException $exception,
        User $user,
        Location $location,
        Commodity $commodity,
        float $quantity,
    ): void {
        BlockedClaim::query()->create([
            'reason' => $exception->reason,
            'user_id' => $user->getKey(),
            'program_id' => $commodity->program?->getKey(),
            'location_id' => $location->getKey(),
            'commodity_id' => $commodity->getKey(),
            'quantity' => $quantity,
            'detail' => $exception->getMessage(),
        ]);
    }

    private function releaseInventory(Allocation $allocation): void
    {
        $inventory = Inventory::query()
            ->where('location_id', $allocation->location_id)
            ->where('commodity_id', $allocation->commodity_id)
            ->lockForUpdate()
            ->first();

        if ($inventory === null) {
            return;
        }

        $quantity = (float) $allocation->quantity;
        $inventory->quantity_locked = max(0.0, (float) $inventory->quantity_locked - $quantity);
        $inventory->quantity_available = (float) $inventory->quantity_available + $quantity;
        $inventory->save();
    }

    private function quantityHeldByUser(User $user, int $programId): float
    {
        return (float) Allocation::query()
            ->where('user_id', $user->getKey())
            ->where('program_id', $programId)
            ->whereIn('status', [AllocationStatus::Locked->value, AllocationStatus::Redeemed->value])
            ->sum('quantity');
    }
}
