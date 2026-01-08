<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAreaRequest;
use App\Http\Requests\UpdateAreaRequest;
use App\Models\Area;
use Illuminate\Http\JsonResponse;

class AreaController extends Controller
{
    public function index(): JsonResponse
    {
        $areas = Area::orderBy('name')->get();
        return response()->json($areas);
    }

    public function store(StoreAreaRequest $request): JsonResponse
    {
        $area = Area::create($request->validated());
        return response()->json($area, 201);
    }

    public function update(UpdateAreaRequest $request, Area $area): JsonResponse
    {
        $area->update($request->validated());
        return response()->json($area);
    }

    public function destroy(Area $area): JsonResponse
    {
        $area->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
