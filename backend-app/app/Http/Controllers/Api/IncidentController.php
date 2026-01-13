<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIncidentRequest;
use App\Http\Requests\UpdateIncidentRequest;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $incidents = Incident::with(['area', 'run'])
            ->when($request->area_id, fn($q) => $q->where('area_id', $request->area_id))
            ->when($request->severity, fn($q) => $q->where('severity', $request->severity))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderByDesc('occurred_at')
            ->paginate(20);

        return response()->json($incidents);
    }

    public function show(Incident $incident): JsonResponse
    {
        return response()->json($incident);
    }

    public function store(StoreIncidentRequest $request): JsonResponse
    {
        $incident = Incident::create([
            'area_id' => $request->area_id,
            'run_id' => $request->run_id,
            'title' => $request->title,
            'description' => $request->description,
            'severity' => $request->severity,
            'status' => 'open',
            'reported_by' => $request->user()->id,
            'occurred_at' => $request->occurred_at ?? now(),
        ]);

        return response()->json($incident, 201);
    }

    public function update(UpdateIncidentRequest $request, Incident $incident): JsonResponse
    {
        $incident->update($request->validated());
        return response()->json($incident);
    }

    public function destroy(Incident $incident): JsonResponse
    {
        $incident->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
