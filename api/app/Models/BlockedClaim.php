<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BlockedReason;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class BlockedClaim extends Model
{
    protected $fillable = [
        'reason',
        'user_id',
        'program_id',
        'location_id',
        'commodity_id',
        'quantity',
        'detail',
    ];

    protected function casts(): array
    {
        return [
            'reason' => BlockedReason::class,
            'quantity' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
