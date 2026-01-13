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
        $user = $request->user();
        
        $query = Run::with([
                'area', 
                'template.groups.items',
                'template.columns',
                'entries',
                'assignedUser',
                'verifiedUser'
            ])
            ->when($request->area_id, fn($q) => $q->where('area_id', $request->area_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->date, fn($q) => $q->whereDate('scheduled_for', $request->date));
        
        // Role-based filtering
        if ($user) {
            if ($user->role === 'staff') {
                // Staff can only see runs assigned to them
                $query->where('assigned_to', $user->id);
            } elseif ($user->role === 'supervisor') {
                // Supervisor can see runs they verify OR runs assigned to them
                $query->where(function($q) use ($user) {
                    $q->where('verified_by', $user->id)
                      ->orWhere('assigned_to', $user->id);
                });
            }
            // Manager and others can see all runs
        }
        
        // Get per_page from request, default to 50, max 1000
        $perPage = min((int) $request->input('per_page', 50), 1000);
        $runs = $query->orderByDesc('created_at')->paginate($perPage);

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
        $data = $request->validated();

        // If re-assigning to a new staff, clear previous progress and incidents state
        if (array_key_exists('assigned_to', $data) && $data['assigned_to'] !== $run->assigned_to) {
            // Remove old check results
            $run->entries()->delete();
            // Remove old signoffs
            $run->signoffs()->delete();
            // Reset status/timestamps to start fresh
            $data['status'] = 'draft';
            $data['started_at'] = null;
            $data['completed_at'] = null;
        }

        $run->update($data);
        return response()->json($run);
    }

    public function destroy(Run $run): JsonResponse
    {
        $run->delete();
        return response()->json(null, 204);
    }
}
