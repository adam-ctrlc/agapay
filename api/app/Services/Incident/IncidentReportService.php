<?php

declare(strict_types=1);

namespace App\Services\Incident;

use App\Enums\ReportStatus;
use App\Exceptions\DomainException;
use App\Models\HazardEvent;
use App\Models\IncidentReport;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\Hazard\ProvinceLocator;
use Illuminate\Support\Facades\DB;

final class IncidentReportService
{
    public function __construct(
        private readonly ProvinceLocator $locator,
        private readonly ReferralService $referrals,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function submit(User $user, array $data): IncidentReport
    {
        if (empty($data['province_code']) && isset($data['latitude'], $data['longitude'])) {
            $data['province_code'] = $this->locator->nearest(
                (float) $data['latitude'],
                (float) $data['longitude'],
            );
        }

        $report = IncidentReport::query()->create([
            ...$data,
            'user_id' => $user->getKey(),
            'status' => ReportStatus::Submitted,
            'severity' => null,
        ]);

        $this->referrals->suggestFor($report);

        return $report->load(['referrals.team', 'province', 'barangay']);
    }

    /**
     * The only path by which a citizen report reaches the public impact map.
     */
    public function promote(IncidentReport $report, User $admin): HazardEvent
    {
        if ($report->hazard_event_id !== null) {
            throw new DomainException('This report is already on the impact map.');
        }

        if ($report->status === ReportStatus::Dismissed) {
            throw new DomainException('A dismissed report cannot be published to the map.');
        }

        return DB::transaction(function () use ($report, $admin): HazardEvent {
            $hazard = HazardEvent::query()->create([
                'type' => $report->type->hazardType(),
                'source' => 'citizen_report',
                'title' => $report->title,
                'place' => $report->barangay?->name,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'province_code' => $report->province_code,
                'severity' => $report->severity ?? 50,
                'occurred_at' => $report->created_at,
            ]);

            $report->hazard_event_id = $hazard->getKey();
            $report->status = ReportStatus::Verified;
            $report->reviewed_by = $admin->getKey();
            $report->reviewed_at = now();
            $report->save();

            return $hazard;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function review(IncidentReport $report, User $admin, array $data): IncidentReport
    {
        $before = $report->status;

        $report->fill($data);
        $report->reviewed_by = $admin->getKey();
        $report->reviewed_at = now();
        $report->save();

        if ($report->status !== $before) {
            $this->notifyReporter($report);
        }

        return $report->load(['referrals.team', 'province', 'barangay']);
    }

    /**
     * The reporter follows these steps in their account, so a status they can
     * see change has to reach them the same way a referral step does.
     */
    private function notifyReporter(IncidentReport $report): void
    {
        UserNotification::query()->create([
            'user_id' => $report->user_id,
            'type' => 'incident_report',
            'title' => $report->status->label(),
            'body' => "{$report->title}: {$report->status->reporterMessage()}",
            'data' => ['incident_report_id' => $report->getKey()],
        ]);
    }
}
