<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\RunController;
use App\Http\Controllers\Api\EntryController;
use App\Http\Controllers\Api\SignoffController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\StatsController;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('areas', AreaController::class)->except(['show']);
    Route::apiResource('users', UserController::class)->except(['show']);
    Route::get('templates', [TemplateController::class, 'index']);
    Route::get('templates/{template}', [TemplateController::class, 'show']);
    Route::post('templates', [TemplateController::class, 'store']);
    Route::put('templates/{template}', [TemplateController::class, 'update']);
    Route::delete('templates/{template}', [TemplateController::class, 'destroy']);

    Route::get('runs', [RunController::class, 'index']);
    Route::post('runs', [RunController::class, 'store']);
    Route::get('runs/{run}', [RunController::class, 'show']);
    Route::put('runs/{run}', [RunController::class, 'update']);
    Route::delete('runs/{run}', [RunController::class, 'destroy']);

    Route::put('entries', [EntryController::class, 'upsert']);

    Route::post('signoffs', [SignoffController::class, 'store']);

    // Review workflow routes
    Route::prefix('review')->group(function () {
        Route::get('pending', [ReviewController::class, 'getPendingReviews']);
        Route::get('stats', [ReviewController::class, 'getStatusStats']);
        Route::post('runs/{run}/start', [ReviewController::class, 'startWork']);
        Route::post('runs/{run}/complete', [ReviewController::class, 'completeWork']);
        Route::post('runs/{run}/request-review', [ReviewController::class, 'requestReview']);
        Route::post('runs/{run}/approve', [ReviewController::class, 'approve']);
        Route::post('runs/{run}/reject', [ReviewController::class, 'reject']);
        Route::post('runs/{run}/resubmit', [ReviewController::class, 'resubmit']);
        Route::get('runs/{run}', [ReviewController::class, 'showForReview']);
    });

    Route::apiResource('incidents', IncidentController::class)->except(['show']);
    Route::get('incidents/{incident}', [IncidentController::class, 'show']);

    // Admin stats
    Route::prefix('admin')->group(function () {
        Route::get('staff-stats', [StatsController::class, 'staffStats']);
        Route::get('supervisor-stats', [StatsController::class, 'supervisorStats']);
        Route::get('staff/{staffId}/detail', [StatsController::class, 'staffDetail']);
    });
});

// Checklists management
Route::middleware('auth:sanctum')->group(function () {
    Route::post('checklists/create-daily', [\App\Http\Controllers\ChecklistController::class, 'createDaily']);
    Route::get('checklists/date/{date}', [\App\Http\Controllers\ChecklistController::class, 'getByDate']);
    Route::delete('checklists/date/{date}', [\App\Http\Controllers\ChecklistController::class, 'deleteByDate']);
});
