<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AllocationController;
use App\Http\Controllers\Api\AnnouncementCommentController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClaimReminderController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EligibilityController;
use App\Http\Controllers\Api\EnergyRefreshController;
use App\Http\Controllers\Api\GridStatusController;
use App\Http\Controllers\Api\HazardEventController;
use App\Http\Controllers\Api\HeatmapController;
use App\Http\Controllers\Api\IncidentReportCommentController;
use App\Http\Controllers\Api\IncidentReportController;
use App\Http\Controllers\Api\KeyController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\MerchantApprovalController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PowerInterruptionController;
use App\Http\Controllers\Api\PriceController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\RedemptionController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\ServiceGuideController;
use App\Http\Controllers\Api\WeatherController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function (): void {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::put('password', [ProfileController::class, 'updatePassword']);
        Route::delete('account', [ProfileController::class, 'destroy']);
    });
});

Route::middleware('cache.edge:300')->group(function (): void {
    Route::get('keys/voucher-public', [KeyController::class, 'voucherPublicKey']);

    Route::get('guides', [ServiceGuideController::class, 'index']);
    Route::get('guides/{guide}', [ServiceGuideController::class, 'show']);
});

Route::middleware('cache.edge:60')->group(function (): void {
    Route::get('prices', [PriceController::class, 'index']);
    Route::get('prices/regions', [PriceController::class, 'regions']);
    Route::get('prices/{price}/history', [PriceController::class, 'history']);

    Route::get('heatmap/provinces', [HeatmapController::class, 'provinces']);
    Route::get('heatmap/provinces/{code}', [HeatmapController::class, 'province']);
    Route::get('heatmap/weather', [WeatherController::class, 'provinces']);
    Route::get('heatmap/weather/list', [WeatherController::class, 'list']);
    Route::get('hazards', [HazardEventController::class, 'index']);

    Route::get('energy/grid', [GridStatusController::class, 'index']);
    Route::get('energy/interruptions', [PowerInterruptionController::class, 'index']);
    Route::get('heatmap/outages', [PowerInterruptionController::class, 'heatmap']);
});

Route::match(['get', 'post'], 'internal/hazards/refresh', [HazardEventController::class, 'refresh']);
Route::match(['get', 'post'], 'internal/energy/refresh', EnergyRefreshController::class);

Route::middleware('auth:api')->group(function (): void {
    Route::get('locations', [LocationController::class, 'index']);
    Route::get('locations/{location}', [LocationController::class, 'show']);

    Route::get('announcements', [AnnouncementController::class, 'index']);
    Route::post('announcements/{announcement}/like', [AnnouncementController::class, 'toggleLike']);
    Route::get('announcements/{announcement}/comments', [AnnouncementCommentController::class, 'index']);
    Route::post('announcements/{announcement}/comments', [AnnouncementCommentController::class, 'store']);
    Route::delete('announcement-comments/{comment}', [AnnouncementCommentController::class, 'destroy']);

    Route::get('incident-reports', [IncidentReportController::class, 'index']);
    Route::get('incident-reports/{report}', [IncidentReportController::class, 'show']);

    Route::get('incident-reports/{report}/comments', [IncidentReportCommentController::class, 'index']);
    Route::post('incident-reports/{report}/comments', [IncidentReportCommentController::class, 'store']);
    Route::delete('incident-report-comments/{comment}', [IncidentReportCommentController::class, 'destroy']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead']);

    Route::middleware('role:lgu_admin,merchant')->group(function (): void {
        Route::post('announcements', [AnnouncementController::class, 'store']);
        Route::put('announcements/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    });

    Route::middleware('role:citizen')->group(function (): void {
        Route::post('eligibility/verify', [EligibilityController::class, 'verify']);

        Route::get('allocations', [AllocationController::class, 'index']);
        Route::post('allocations', [AllocationController::class, 'store']);
        Route::delete('allocations/{allocation}', [AllocationController::class, 'destroy']);

        Route::post('incident-reports', [IncidentReportController::class, 'store']);

        Route::get('claim-reminders', [ClaimReminderController::class, 'index']);
        Route::post('claim-reminders', [ClaimReminderController::class, 'store']);
        Route::delete('claim-reminders/{reminder}', [ClaimReminderController::class, 'destroy']);
    });

    Route::middleware(['role:merchant', 'approved'])->group(function (): void {
        Route::post('redemptions', [RedemptionController::class, 'store']);
        Route::post('redemptions/batch', [RedemptionController::class, 'batch']);
    });

    Route::middleware('role:lgu_admin')->group(function (): void {
        Route::get('merchants', [MerchantApprovalController::class, 'index']);
        Route::post('merchants/{merchant}/approve', [MerchantApprovalController::class, 'approve']);
        Route::post('merchants/{merchant}/revoke', [MerchantApprovalController::class, 'revoke']);

        Route::get('dashboard/heatmap', [DashboardController::class, 'heatmap']);
        Route::get('dashboard/stats', [DashboardController::class, 'stats']);

        Route::post('prices', [PriceController::class, 'store']);
        Route::put('prices/{price}', [PriceController::class, 'update']);
        Route::delete('prices/{price}', [PriceController::class, 'destroy']);

        Route::get('programs', [ProgramController::class, 'index']);
        Route::put('programs/{program}', [ProgramController::class, 'update']);

        Route::post('locations', [LocationController::class, 'store']);
        Route::put('locations/{location}', [LocationController::class, 'update']);
        Route::delete('locations/{location}', [LocationController::class, 'destroy']);
        Route::post('locations/{location}/restock', [LocationController::class, 'restock']);

        Route::post('guides', [ServiceGuideController::class, 'store']);
        Route::put('guides/{guide}', [ServiceGuideController::class, 'update']);
        Route::delete('guides/{guide}', [ServiceGuideController::class, 'destroy']);

        Route::post('hazards', [HazardEventController::class, 'store']);
        Route::put('hazards/{hazard}', [HazardEventController::class, 'update']);
        Route::delete('hazards/{hazard}', [HazardEventController::class, 'destroy']);

        Route::put('incident-reports/{report}', [IncidentReportController::class, 'update']);
        Route::post('incident-reports/{report}/promote', [IncidentReportController::class, 'promote']);
        Route::delete('incident-reports/{report}', [IncidentReportController::class, 'destroy']);
        Route::put('referrals/{referral}', [ReferralController::class, 'update']);

        Route::put('heatmap/weather/{province:code}', [WeatherController::class, 'update']);
        Route::delete('heatmap/weather/{province:code}', [WeatherController::class, 'clearOverride']);

        Route::post('energy/grid', [GridStatusController::class, 'store']);
        Route::post('energy/interruptions', [PowerInterruptionController::class, 'store']);
        Route::put('energy/interruptions/{interruption}', [PowerInterruptionController::class, 'update']);
        Route::delete('energy/interruptions/{interruption}', [PowerInterruptionController::class, 'destroy']);
    });
});
