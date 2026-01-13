<?php

namespace App\Domains\Incident\Http\Controllers;

use App\Domains\Incident\Http\Requests\CreateIncidentRequest;
use App\Domains\Incident\Http\Requests\UpdateIncidentRequest;
use App\Domains\Incident\Models\Incident;
use Illuminate\Http\Request;

class IncidentController
{
    public function index(Request $request)
    {
        $query = Incident::with(['area', 'run', 'assignedTo']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->has('date')) {
            $query->whereHas('run', function ($q) use ($request) {
                $q->where('run_date', $request->date);
            });
        }

        $incidents = $query->orderBy('created_at', 'desc')->get();

        return response()->json($incidents);
    }

    public function store(CreateIncidentRequest $request)
    {
        $incident = Incident::create($request->validated());
        return response()->json($incident->load(['area', 'run', 'assignedTo']), 201);
    }

    public function update(UpdateIncidentRequest $request, int $id)
    {
        $incident = Incident::findOrFail($id);
        $incident->update($request->validated());
        return response()->json($incident->load(['area', 'run', 'assignedTo']));
    }
}
