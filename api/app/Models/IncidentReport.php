<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\IncidentType;
use App\Enums\LocationSource;
use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class IncidentReport extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'status',
        'title',
        'description',
        'latitude',
        'longitude',
        'province_code',
        'barangay_id',
        'location_source',
        'accuracy_meters',
        'severity',
        'photo_thumbnail',
        'hazard_event_id',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => IncidentType::class,
            'status' => ReportStatus::class,
            'location_source' => LocationSource::class,
            'latitude' => 'float',
            'longitude' => 'float',
            'accuracy_meters' => 'integer',
            'severity' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class, 'province_code', 'code');
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function hazardEvent(): BelongsTo
    {
        return $this->belongsTo(HazardEvent::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(IncidentReportComment::class);
    }
}
