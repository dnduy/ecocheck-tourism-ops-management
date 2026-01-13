<?php

namespace App\Domains\Checklist\Http\Controllers;

use App\Domains\Checklist\Http\Requests\UpsertCellRequest;
use App\Domains\Checklist\Services\ChecklistService;

class CellController
{
    public function __construct(
        private ChecklistService $checklistService
    ) {}

    public function upsert(UpsertCellRequest $request)
    {
        $entry = $this->checklistService->upsertCell($request->validated());
        return response()->json($entry);
    }
}
