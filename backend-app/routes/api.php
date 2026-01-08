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

    Route::get('runs', [RunController::class, 'index']);
    Route::post('runs', [RunController::class, 'store']);
    Route::get('runs/{run}', [RunController::class, 'show']);
    Route::put('runs/{run}', [RunController::class, 'update']);

    Route::put('entries', [EntryController::class, 'upsert']);

    Route::post('signoffs', [SignoffController::class, 'store']);

    Route::apiResource('incidents', IncidentController::class)->except(['show']);
});
