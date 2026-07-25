<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

final class Beneficiary extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'dswd_id',
        'household_number',
        'full_name',
        'barangay',
        'poverty_status',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
