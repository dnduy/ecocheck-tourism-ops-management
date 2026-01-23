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
    use \App\Traits\ApiResponse;

    protected $runService;

    public function __construct(\App\Interfaces\RunServiceInterface $runService)
    {
        $this->runService = $runService;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 50), 1000);
        $runs = $this->runService->getRuns($request->all(), $request->user(), $perPage);

        return $this->successResponse($runs, 'Lấy danh sách checklist thành công');
    }

    public function store(StoreRunRequest $request): JsonResponse
    {
        $run = $this->runService->createRun($request->validated(), $request->user());
        return $this->successResponse($run, 'Tạo checklist thành công', 201);
    }

    public function show(Run $run): JsonResponse
    {
        $run = $this->runService->getRunDetail($run);
        return $this->successResponse($run, 'Lấy chi tiết checklist thành công');
    }

    public function update(UpdateRunRequest $request, Run $run): JsonResponse
    {
        $run = $this->runService->updateRun($run, $request->validated());
        return $this->successResponse($run, 'Cập nhật checklist thành công');
    }

    public function export(Run $run)
    {
        return $this->runService->exportRun($run);
    }

    public function destroy(Run $run): JsonResponse
    {
        $this->runService->deleteRun($run);
        return $this->successResponse(null, 'Xóa checklist thành công');
    }
}
