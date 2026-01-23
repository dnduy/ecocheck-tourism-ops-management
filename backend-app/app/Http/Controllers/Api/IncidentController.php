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
    use \App\Traits\ApiResponse;

    protected $incidentService;

    public function __construct(\App\Interfaces\IncidentServiceInterface $incidentService)
    {
        $this->incidentService = $incidentService;
    }

    public function index(Request $request): JsonResponse
    {
        $incidents = $this->incidentService->getIncidents($request->all(), 20); // Or strict pagination from config

        return $this->successResponse($incidents, 'Lấy danh sách sự cố thành công');
    }

    public function show(Incident $incident): JsonResponse
    {
        // Typically show might might belong to service too if logic needed, 
        // but for simple retrieval Repository/Model binding is fine. 
        // For consistency, we keep it simple or wrap if needed. 
        // Current requirement implies usage of service/repo structure.
        return $this->successResponse($incident, 'Lấy chi tiết sự cố thành công');
    }

    public function store(StoreIncidentRequest $request): JsonResponse
    {
        $incident = $this->incidentService->createIncident($request->validated(), $request->user());
        return $this->successResponse($incident, 'Tạo sự cố thành công', 201);
    }

    public function update(UpdateIncidentRequest $request, Incident $incident): JsonResponse
    {
        $incident = $this->incidentService->updateIncident($incident, $request->validated());
        return $this->successResponse($incident, 'Cập nhật sự cố thành công');
    }

    public function destroy(Incident $incident): JsonResponse
    {
        $this->incidentService->deleteIncident($incident);
        return $this->successResponse(null, 'Xóa sự cố thành công');
    }
}
