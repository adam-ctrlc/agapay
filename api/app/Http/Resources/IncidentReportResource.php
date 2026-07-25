<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\IncidentReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin IncidentReport
 */
final class IncidentReportResource extends JsonResource
{
    private bool $withPhoto = false;

    /**
     * Lists omit the photo on purpose: a base64 thumbnail is up to 200KB, so
     * fifty of them would be a multi-megabyte response.
     */
    public function withPhoto(): self
    {
        $this->withPhoto = true;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'title' => $this->title,
            'description' => $this->description,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'province_code' => $this->province_code,
            'province' => $this->whenLoaded('province', fn () => $this->province?->name),
            'barangay' => $this->whenLoaded('barangay', fn () => $this->barangay?->name),
            'location_source' => $this->location_source->value,
            'location_label' => $this->location_source->label(),
            'is_precise' => $this->location_source->isPrecise(),
            'accuracy_meters' => $this->accuracy_meters,
            'severity' => $this->severity,
            'has_photo' => $this->photo_thumbnail !== null,
            'photo_thumbnail' => $this->when($this->withPhoto, fn () => $this->photo_thumbnail),
            'on_impact_map' => $this->hazard_event_id !== null,
            'reporter' => $this->whenLoaded('user', fn () => $this->user?->name),
            'referrals' => ReferralResource::collection($this->whenLoaded('referrals')),
            'comment_count' => $this->whenCounted('comments', fn () => (int) $this->comments_count, 0),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
