<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incident\ReviewIncidentReportRequest;
use App\Http\Requests\Incident\StoreIncidentReportRequest;
use App\Http\Resources\HazardEventResource;
use App\Http\Resources\IncidentReportResource;
use App\Models\IncidentReport;
use App\Services\Incident\IncidentReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class IncidentReportController extends Controller
{
    public function __construct(
        private readonly IncidentReportService $reports,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $reports = IncidentReport::query()
            ->with(['referrals.team', 'province', 'barangay', 'user'])
            ->withCount('comments')
            ->when(
                $user->role !== UserRole::LguAdmin,
                fn ($query) => $query->where('user_id', $user->getKey()),
            )
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->latest()
            ->limit(100)
            ->get();

        return IncidentReportResource::collection($reports);
    }

    public function store(StoreIncidentReportRequest $request): JsonResponse
    {
        $report = $this->reports->submit($request->user(), $request->validated());

        return response()->json(
            ['data' => (new IncidentReportResource($report))->withPhoto()],
            Response::HTTP_CREATED,
        );
    }

    public function show(Request $request, IncidentReport $report): IncidentReportResource
    {
        $this->assertMayView($request, $report);

        $report->load(['referrals.team', 'province', 'barangay', 'user']);

        return (new IncidentReportResource($report))->withPhoto();
    }

    public function update(ReviewIncidentReportRequest $request, IncidentReport $report): IncidentReportResource
    {
        $updated = $this->reports->review($report, $request->user(), $request->validated());

        return (new IncidentReportResource($updated->load('user')))->withPhoto();
    }

    public function promote(Request $request, IncidentReport $report): JsonResponse
    {
        $hazard = $this->reports->promote($report, $request->user());

        return response()->json([
            'message' => 'Published to the impact map.',
            'data' => new HazardEventResource($hazard),
        ]);
    }

    public function destroy(IncidentReport $report): JsonResponse
    {
        $report->delete();

        return response()->json(['message' => 'Report removed.']);
    }

    private function assertMayView(Request $request, IncidentReport $report): void
    {
        $user = $request->user();

        if ($user->role === UserRole::LguAdmin) {
            return;
        }

        if ((int) $report->user_id !== (int) $user->getKey()) {
            abort(Response::HTTP_FORBIDDEN, 'You can only view your own reports.');
        }
    }
}
