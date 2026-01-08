<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRunRequest;
use App\Http\Requests\UpdateRunRequest;
use App\Models\Run;
use App\Models\ChecklistTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class RunController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $runs = Run::with(['area', 'template'])
            ->when($request->area_id, fn($q) => $q->where('area_id', $request->area_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($runs);
    }

    public function store(StoreRunRequest $request): JsonResponse
    {
        $data = $request->validated();

        $run = DB::transaction(function () use ($data, $request) {
            // Use existing template or create default one
            $template = ChecklistTemplate::first() ?? ChecklistTemplate::create([
                'name' => 'Default',
                'is_active' => true,
            ]);

            $run = Run::create([
                'checklist_template_id' => $data['checklist_template_id'] ?? $template->id,
                'area_id' => $data['area_id'],
                'status' => 'draft',
                'scheduled_for' => $data['scheduled_for'] ?? $data['date'] ?? now(),
                'created_by' => $request->user()->id,
            ]);

            return $run;
        });

        return response()->json($run, 201);
    }

    public function show(Run $run): JsonResponse
    {
        $run->load(['template.groups.items', 'template.columns' => fn($q) => $q->orderBy('sort_order'), 'entries', 'signoffs']);
        return response()->json($run);
    }

    public function update(UpdateRunRequest $request, Run $run): JsonResponse
    {
        $run->update($request->validated());
        return response()->json($run);
    }
}
