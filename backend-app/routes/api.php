<?php

use Illuminate\Support\Facades\Route;
use App\Domains\User\Http\Controllers\AuthController;
use App\Domains\User\Http\Controllers\UserController;
use App\Domains\Checklist\Http\Controllers\AreaController;
use App\Http\Controllers\Api\TemplateController;
use App\Domains\Checklist\Http\Controllers\TemplatesController;
use App\Domains\Checklist\Http\Controllers\ChecklistRunController;
use App\Domains\Checklist\Http\Controllers\CellController;
use App\Domains\Checklist\Http\Controllers\SignoffController;
use App\Domains\Incident\Http\Controllers\IncidentController;
use App\Domains\Admin\Http\Controllers\StatsController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\EntryController;

// Auth routes
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::patch('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Templates
    Route::get('/templates', [TemplatesController::class, 'index']);
    Route::get('/templates/{id}', [TemplatesController::class, 'show']);
    Route::post('/templates', [TemplatesController::class, 'store']);
    Route::put('/templates/{id}', [TemplatesController::class, 'update']);
    Route::delete('/templates/{id}', [TemplatesController::class, 'destroy']);

    // Areas (manager only)
    Route::get('/areas', [AreaController::class, 'index']);
    Route::get('/areas/{id}', [AreaController::class, 'show']);
    Route::post('/areas', [AreaController::class, 'store']);
    Route::patch('/areas/{id}', [AreaController::class, 'update']);
    Route::delete('/areas/{id}', [AreaController::class, 'destroy']);

    // Templates (manager only)
    Route::get('/areas/{areaId}/template', [TemplateController::class, 'getAreaTemplate']);
    Route::post('/templates/import', [TemplateController::class, 'import']);

    // Checklist Runs
    Route::post('/runs', [ChecklistRunController::class, 'store']);
    Route::get('/runs', [ChecklistRunController::class, 'index']);
    Route::get('/runs/{id}', [ChecklistRunController::class, 'show']);
    Route::patch('/runs/{id}', [ChecklistRunController::class, 'update']);
    Route::delete('/runs/{id}', [ChecklistRunController::class, 'destroy']);

    // Cells (entries)
    Route::put('/cells', [CellController::class, 'upsert']);
    Route::put('/entries', [EntryController::class, 'upsert']); // Alias for frontend

    // Signoffs
    Route::put('/signoffs', [SignoffController::class, 'upsert']);

    // Incidents
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::get('/incidents/{id}', [IncidentController::class, 'show']);
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::patch('/incidents/{id}', [IncidentController::class, 'update']);
    Route::delete('/incidents/{id}', [IncidentController::class, 'destroy']);

    // Admin Stats
    Route::get('/admin/staff-stats', [StatsController::class, 'staffStats']);

    // Review Workflow
    Route::get('/review/pending', [ReviewController::class, 'getPendingReviews']);
    Route::get('/review/stats', [ReviewController::class, 'getStatusStats']);
    Route::get('/review/runs/{run}', [ReviewController::class, 'showForReview']);
    Route::post('/review/runs/{run}/start', [ReviewController::class, 'startWork']);
    Route::post('/review/runs/{run}/complete', [ReviewController::class, 'completeWork']);
    Route::post('/review/runs/{run}/request-review', [ReviewController::class, 'requestReview']);
    Route::post('/review/runs/{run}/approve', [ReviewController::class, 'approve']);
    Route::post('/review/runs/{run}/reject', [ReviewController::class, 'reject']);
    Route::post('/review/runs/{run}/resubmit', [ReviewController::class, 'resubmit']);
    Route::get('/admin/supervisor-stats', [StatsController::class, 'supervisorStats']);
});
