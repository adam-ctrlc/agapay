<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\UserRole;
use App\Models\IncidentReportComment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin IncidentReportComment
 */
final class IncidentReportCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $role = $this->author?->role;

        return [
            'id' => $this->id,
            'body' => $this->body,
            'is_official' => $role === UserRole::LguAdmin,
            'author' => [
                'id' => $this->author?->id,
                'name' => $this->author?->name ?? 'Removed user',
                'role' => $role?->value,
            ],
            'is_mine' => (int) $this->user_id === (int) $request->user()?->getKey(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
