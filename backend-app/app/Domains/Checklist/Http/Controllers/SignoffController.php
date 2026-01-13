<?php

namespace App\Domains\Checklist\Http\Controllers;

use App\Domains\Checklist\Http\Requests\UpsertSignoffRequest;
use App\Domains\Checklist\Services\ChecklistService;

class SignoffController
{
    public function __construct(
        private ChecklistService $checklistService
    ) {}

    public function upsert(UpsertSignoffRequest $request)
    {
        $signoff = $this->checklistService->upsertSignoff($request->validated());
        return response()->json($signoff);
    }
}
