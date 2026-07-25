<?php

declare(strict_types=1);

namespace App\Services\Eligibility;

use App\Enums\ProgramType;
use App\Models\Beneficiary;
use App\Models\FranchiseHolder;
use App\Models\Program;
use App\Models\User;
use Illuminate\Support\Collection;

final class EligibilityService
{
    public function isEligibleFor(User $user, Program $program): bool
    {
        switch ($program->type) {
            case ProgramType::Food:
                return $this->hasBeneficiaryRecord($user);
            case ProgramType::Fuel:
                return $this->hasFranchiseRecord($user);
            default:
                return false;
        }
    }

    /**
     * @return array{eligible: bool, eligible_types: array<int, string>, programs: Collection<int, Program>}
     */
    public function verify(User $user): array
    {
        $eligibleTypes = [];

        if ($this->hasBeneficiaryRecord($user)) {
            $eligibleTypes[] = ProgramType::Food;
        }

        if ($this->hasFranchiseRecord($user)) {
            $eligibleTypes[] = ProgramType::Fuel;
        }

        $programs = $eligibleTypes === []
            ? new Collection()
            : Program::query()
                ->where('is_active', true)
                ->whereIn('type', array_map(static fn (ProgramType $type): string => $type->value, $eligibleTypes))
                ->with('commodities')
                ->get();

        return [
            'eligible' => $eligibleTypes !== [],
            'eligible_types' => array_map(static fn (ProgramType $type): string => $type->value, $eligibleTypes),
            'programs' => $programs,
        ];
    }

    private function hasBeneficiaryRecord(User $user): bool
    {
        return Beneficiary::query()
            ->where('is_active', true)
            ->where('user_id', $user->getKey())
            ->exists();
    }

    private function hasFranchiseRecord(User $user): bool
    {
        return FranchiseHolder::query()
            ->where('is_active', true)
            ->where('user_id', $user->getKey())
            ->exists();
    }
}
