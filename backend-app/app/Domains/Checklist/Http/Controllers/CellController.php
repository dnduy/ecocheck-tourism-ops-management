<?php

namespace App\Domains\Checklist\Http\Controllers;

use App\Domains\Checklist\Http\Requests\UpsertCellRequest;
use App\Domains\Checklist\Services\ChecklistService;
use App\Models\Run;

class CellController
{
    public function __construct(
        private ChecklistService $checklistService
    ) {}

    public function upsert(UpsertCellRequest $request)
    {
        $data = $request->validated();
        $run = Run::find($data['run_id']);
        if (!$run) {
            return response()->json(['error' => 'Run not found'], 404);
        }

        $user = $request->user();
        if (!$user || !\App\Support\RunAccess::canEditEntries($user, $run)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $entry = $this->checklistService->upsertCell($data);
        return response()->json($entry);
    }
}
