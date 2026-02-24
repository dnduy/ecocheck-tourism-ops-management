<?php

use Illuminate\Support\Facades\Route;
use App\Domains\User\Http\Controllers\AuthController;
use App\Domains\User\Http\Controllers\UserController;
use App\Domains\Checklist\Http\Controllers\AreaController;
use App\Http\Controllers\Api\TemplateController;
use App\Domains\Checklist\Http\Controllers\TemplatesController;
use App\Domains\Checklist\Http\Controllers\CellController;
use App\Domains\Checklist\Http\Controllers\SignoffController;
use App\Domains\Incident\Http\Controllers\IncidentController;
use App\Domains\Admin\Http\Controllers\StatsController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\EntryController;
use App\Http\Controllers\Api\ShiftController;

// Auth routes
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Users (read)
    Route::middleware('role:admin|manager|supervisor,sanctum')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
    });
    // Users (write) - admin only
    Route::middleware('role:admin')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // Templates (read)
    Route::middleware('role:admin|manager|supervisor,sanctum')->group(function () {
        Route::get('/templates', [TemplatesController::class, 'index']);
        Route::get('/templates/{id}', [TemplatesController::class, 'show']);
        Route::get('/areas/{areaId}/template', [TemplateController::class, 'getAreaTemplate']);
    });
    // Templates (write)
    Route::middleware('role:admin|manager,sanctum')->group(function () {
        Route::post('/templates', [TemplatesController::class, 'store']);
        Route::put('/templates/{id}', [TemplatesController::class, 'update']);
        Route::delete('/templates/{id}', [TemplatesController::class, 'destroy']);
        Route::post('/templates/import', [TemplateController::class, 'import']);
    });

    // Areas (read)
    Route::get('/areas', [AreaController::class, 'index']);
    Route::get('/areas/{id}', [AreaController::class, 'show']);
    // Areas (write)
    Route::middleware('role:admin|manager,sanctum')->group(function () {
        Route::post('/areas', [AreaController::class, 'store']);
        Route::patch('/areas/{id}', [AreaController::class, 'update']);
        Route::delete('/areas/{id}', [AreaController::class, 'destroy']);
    });

    // Shifts (ca lam viec)
    Route::middleware('role:admin|manager|supervisor,sanctum')->group(function () {
        Route::get('/shifts', [ShiftController::class, 'index']);
        Route::post('/shifts', [ShiftController::class, 'store']);
        Route::patch('/shifts/{shift}', [ShiftController::class, 'update']);
        Route::delete('/shifts/{shift}', [ShiftController::class, 'destroy']);
    });

    // Checklist Runs
    Route::middleware('role:admin|manager|supervisor,sanctum')->group(function () {
        Route::get('/runs/{run}/export', [\App\Http\Controllers\Api\RunController::class, 'export']);
    });
    Route::middleware('role:admin|manager,sanctum')->group(function () {
        Route::post('/runs', [\App\Http\Controllers\Api\RunController::class, 'store']);
        Route::patch('/runs/{run}', [\App\Http\Controllers\Api\RunController::class, 'update']);
    });
    Route::middleware('role:admin|manager,sanctum')->group(function () {
        Route::delete('/runs/{run}', [\App\Http\Controllers\Api\RunController::class, 'destroy']);
    });
    Route::get('/runs', [\App\Http\Controllers\Api\RunController::class, 'index']);
    Route::get('/runs/{run}', [\App\Http\Controllers\Api\RunController::class, 'show']);

    // Cells (entries)
    Route::put('/cells', [CellController::class, 'upsert']);
    Route::put('/entries', [EntryController::class, 'upsert']); // Alias for frontend

    // Signoffs
    Route::middleware('role:admin|manager|supervisor,sanctum')->group(function () {
        Route::put('/signoffs', [SignoffController::class, 'upsert']);
    });

    // Incidents
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::get('/incidents/{id}', [IncidentController::class, 'show']);
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::patch('/incidents/{id}', [IncidentController::class, 'update']);
    Route::delete('/incidents/{id}', [IncidentController::class, 'destroy']);

    // Admin Stats
    Route::middleware('role:admin|manager,sanctum')->group(function () {
        Route::get('/admin/staff-stats', [StatsController::class, 'staffStats']);
        Route::get('/admin/supervisor-stats', [StatsController::class, 'supervisorStats']);
    });

    // Review Workflow
    Route::middleware('role:admin|manager,sanctum')->group(function () {
        Route::get('/review/pending', [ReviewController::class, 'getPendingReviews']);
        Route::get('/review/stats', [ReviewController::class, 'getStatusStats']);
        Route::get('/review/runs/{run}', [ReviewController::class, 'showForReview']);
        Route::post('/review/runs/{run}/approve', [ReviewController::class, 'approve']);
        Route::post('/review/runs/{run}/reject', [ReviewController::class, 'reject']);
    });

    Route::middleware('role:staff|supervisor,sanctum')->group(function () {
        Route::post('/review/runs/{run}/start', [ReviewController::class, 'startWork']);
        Route::post('/review/runs/{run}/complete', [ReviewController::class, 'completeWork']);
        Route::post('/review/runs/{run}/request-review', [ReviewController::class, 'requestReview']);
        Route::post('/review/runs/{run}/resubmit', [ReviewController::class, 'resubmit']);
    });
});
