<?php

namespace App\Domains\Checklist\Http\Controllers;

use App\Domains\Checklist\Http\Requests\CreateAreaRequest;
use App\Domains\Checklist\Http\Requests\UpdateAreaRequest;
use App\Domains\Checklist\Models\Area;
use Illuminate\Http\Request;

class AreaController
{
    public function index()
    {
        $areas = Area::all();
        return response()->json($areas);
    }

    public function store(CreateAreaRequest $request)
    {
        $area = Area::create($request->validated());
        return response()->json($area, 201);
    }

    public function update(UpdateAreaRequest $request, int $id)
    {
        $area = Area::findOrFail($id);
        $area->update($request->validated());
        return response()->json($area);
    }

    public function destroy(int $id)
    {
        $area = Area::findOrFail($id);
        $area->delete();
        return response()->json(['message' => 'Area deleted successfully']);
    }
}
