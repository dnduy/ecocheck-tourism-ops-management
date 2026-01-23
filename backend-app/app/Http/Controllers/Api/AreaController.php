<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAreaRequest;
use App\Http\Requests\UpdateAreaRequest;
use App\Models\Area;
use Illuminate\Http\JsonResponse;

class AreaController extends Controller
{
    use \App\Traits\ApiResponse;

    protected $areaService;

    public function __construct(\App\Interfaces\AreaServiceInterface $areaService)
    {
        $this->areaService = $areaService;
    }

    public function index(): JsonResponse
    {
        $areas = $this->areaService->getAllAreas();
        return $this->successResponse($areas, 'Lấy danh sách khu vực thành công');
    }

    public function store(StoreAreaRequest $request): JsonResponse
    {
        $area = $this->areaService->createArea($request->validated());
        return $this->successResponse($area, 'Tạo khu vực thành công', 201);
    }

    public function update(UpdateAreaRequest $request, Area $area): JsonResponse
    {
        $area = $this->areaService->updateArea($area, $request->validated());
        return $this->successResponse($area, 'Cập nhật khu vực thành công');
    }

    public function destroy(Area $area): JsonResponse
    {
        $this->areaService->deleteArea($area);
        return $this->successResponse(null, 'Xóa khu vực thành công');
    }
}
