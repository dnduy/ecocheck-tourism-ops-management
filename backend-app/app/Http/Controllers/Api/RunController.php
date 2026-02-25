<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRunRequest;
use App\Http\Requests\UpdateRunRequest;
use App\Models\Run;
use App\Models\ChecklistTemplate;
use App\Enums\WorkStatus;
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
        $user = request()->user();
        if ($user) {
            $this->authorize('view', $run);
        }

        $run = $this->runService->getRunDetail($run);
        $items = collect();

        if ($run->relationLoaded('template') && $run->template) {
            $groupedItems = collect();
            if ($run->template->relationLoaded('groups')) {
                foreach ($run->template->groups as $group) {
                    if ($group->relationLoaded('items')) {
                        $groupedItems = $groupedItems->merge($group->items);
                    }
                }
            }
            $ungroupedItems = $run->template->relationLoaded('items')
                ? $run->template->items->whereNull('group_id')
                : collect();

            $items = $groupedItems->merge($ungroupedItems)->values();
        }

        $payload = $run->toArray();
        $payload['items'] = $items;

        return $this->successResponse($payload, 'Lấy chi tiết checklist thành công');
    }

    public function update(UpdateRunRequest $request, Run $run): JsonResponse
    {
        $actor = $request->user();
        if ($actor && !$actor->hasAnyRole(['admin', 'manager'])) {
            if ($request->has('assigned_to') || $request->has('verified_by')) {
                $this->authorize('update', $run);
            }
        }

        $run = $this->runService->updateRun($run, $request->validated(), $actor);
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
