<?php

namespace App\Domains\Checklist\Http\Controllers;

use App\Domains\Checklist\Http\Requests\CreateRunRequest;
use App\Domains\Checklist\Http\Requests\UpdateRunRequest;
use App\Domains\Checklist\Services\ChecklistService;
use Illuminate\Http\Request;

class ChecklistRunController
{
    public function __construct(
        private ChecklistService $checklistService
    ) {}

    public function store(CreateRunRequest $request)
    {
        $run = $this->checklistService->createOrGetRun(
            $request->input('area_id'),
            $request->input('date')
        );

        return response()->json($run, 201);
    }

    public function index(Request $request)
    {
        $filters = $request->only(['date', 'area_id', 'assigned_to', 'status']);
        $runs = $this->checklistService->getRuns($filters);

        return response()->json($runs);
    }

    public function show(int $id)
    {
        $data = $this->checklistService->getRunDetail($id);

        if (empty($data)) {
            return response()->json(['message' => 'Run not found'], 404);
        }

        return response()->json($data);
    }

    public function update(UpdateRunRequest $request, int $id)
    {
        $run = $this->checklistService->updateRun($id, $request->validated());
        return response()->json($run);
    }
}
