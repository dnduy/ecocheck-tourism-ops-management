<?php

use Illuminate\Support\Facades\Route;
use App\Domains\User\Http\Controllers\AuthController;
use App\Domains\User\Http\Controllers\UserController;
use App\Domains\Checklist\Http\Controllers\AreaController;
use App\Domains\Checklist\Http\Controllers\TemplateController;
use App\Domains\Checklist\Http\Controllers\TemplatesController;
use App\Domains\Checklist\Http\Controllers\ChecklistRunController;
use App\Domains\Checklist\Http\Controllers\CellController;
use App\Domains\Checklist\Http\Controllers\SignoffController;
use App\Domains\Incident\Http\Controllers\IncidentController;

// Auth routes
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);

    // Templates
    Route::get('/templates', [TemplatesController::class, 'index']);
    Route::get('/templates/{id}', [TemplatesController::class, 'show']);

    // Areas (manager only)
    Route::get('/areas', [AreaController::class, 'index']);
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

    // Cells (entries)
    Route::put('/cells', [CellController::class, 'upsert']);

    // Signoffs
    Route::put('/signoffs', [SignoffController::class, 'upsert']);

    // Incidents
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::patch('/incidents/{id}', [IncidentController::class, 'update']);
});
