<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class MerchantApprovalController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $merchants = User::query()
            ->where('role', UserRole::Merchant->value)
            ->with('location:id,name,type')
            ->when(
                $request->string('status')->toString() === 'pending',
                fn ($query) => $query->whereNull('approved_at'),
            )
            ->when(
                $request->string('status')->toString() === 'approved',
                fn ($query) => $query->whereNotNull('approved_at'),
            )
            ->orderByRaw('approved_at is null desc')
            ->latest()
            ->get();

        return UserResource::collection($merchants);
    }

    public function approve(Request $request, User $merchant): UserResource
    {
        $this->assertMerchant($merchant);

        $merchant->approved_at = now();
        $merchant->approved_by = $request->user()->getKey();
        $merchant->save();

        $this->notify(
            $merchant,
            'Store approved',
            'Your LGU approved your store. You can start redeeming vouchers.',
        );

        return new UserResource($merchant->load('location:id,name,type'));
    }

    public function revoke(Request $request, User $merchant): UserResource
    {
        $this->assertMerchant($merchant);

        if ((int) $merchant->getKey() === (int) $request->user()->getKey()) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'You cannot revoke your own account.');
        }

        $merchant->approved_at = null;
        $merchant->approved_by = null;
        $merchant->save();

        $this->notify(
            $merchant,
            'Store access paused',
            'Your LGU paused your store. Redeeming is on hold until it is approved again.',
        );

        return new UserResource($merchant->load('location:id,name,type'));
    }

    private function assertMerchant(User $merchant): void
    {
        if ($merchant->role !== UserRole::Merchant) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'That account is not a merchant.');
        }
    }

    private function notify(User $merchant, string $title, string $body): void
    {
        UserNotification::query()->create([
            'user_id' => $merchant->getKey(),
            'type' => 'merchant_approval',
            'title' => $title,
            'body' => $body,
            'data' => null,
        ]);
    }
}
