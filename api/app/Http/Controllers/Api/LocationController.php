<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Relief\RestockRequest;
use App\Http\Requests\Relief\StoreLocationRequest;
use App\Http\Requests\Relief\UpdateLocationRequest;
use App\Http\Resources\InventoryResource;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use App\Services\Energy\EnergyImpactService;
use App\Services\Relief\ReliefAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class LocationController extends Controller
{
    public function __construct(
        private readonly EnergyImpactService $energyImpact,
        private readonly ReliefAdminService $relief,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->energyImpact->syncPowerStatus();

        $locations = Location::query()
            ->where('is_active', true)
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->when($request->filled('barangay_id'), fn ($query) => $query->where('barangay_id', $request->integer('barangay_id')))
            ->when($request->filled('commodity_id'), fn ($query) => $query->whereHas(
                'inventories',
                fn ($inventory) => $inventory->where('commodity_id', $request->integer('commodity_id'))
            ))
            ->with(['barangay', 'inventories.commodity'])
            ->get();

        return LocationResource::collection($locations);
    }

    /**
     * Public on purpose: a merchant picks their store while registering, so
     * they have no token yet. Deliberately slim, since stock levels and power
     * status are none of an unauthenticated caller's business.
     *
     * @return array<string, mixed>
     */
    public function forSignup(): array
    {
        $locations = Location::query()
            ->where('is_active', true)
            ->with('barangay:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'type', 'barangay_id']);

        return [
            'data' => $locations->map(fn (Location $location) => [
                'id' => $location->id,
                'name' => $location->name,
                'type' => $location->type->value,
                'barangay' => $location->barangay?->name,
            ])->all(),
        ];
    }

    public function show(Location $location): LocationResource
    {
        $this->energyImpact->syncPowerStatus();

        $location->refresh()->load(['barangay', 'inventories.commodity']);

        return new LocationResource($location);
    }

    public function store(StoreLocationRequest $request): LocationResource
    {
        $location = Location::query()->create($request->validated());

        return new LocationResource($location->load(['barangay', 'inventories.commodity']));
    }

    public function update(UpdateLocationRequest $request, Location $location): LocationResource
    {
        $location->update($request->validated());

        return new LocationResource($location->load(['barangay', 'inventories.commodity']));
    }

    public function destroy(Location $location): JsonResponse
    {
        $this->relief->deleteLocation($location);

        return response()->json(['message' => 'Service point removed.']);
    }

    public function restock(RestockRequest $request, Location $location): InventoryResource
    {
        $inventory = $this->relief->restock(
            $location,
            (int) $request->integer('commodity_id'),
            (float) $request->float('quantity_available'),
        );

        return new InventoryResource($inventory->load('commodity'));
    }
}
