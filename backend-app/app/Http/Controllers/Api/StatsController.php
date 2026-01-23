<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Run;
use App\Models\Signoff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Interfaces\StatsServiceInterface;

class StatsController extends Controller
{
    use \App\Traits\ApiResponse;

    protected $statsService;

    /**
     * StatsController constructor.
     * 
     * @param StatsServiceInterface $statsService
     */
    public function __construct(StatsServiceInterface $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * Lấy thống kê nhân viên (chưa làm, đã làm, chờ duyệt)
     */
    public function staffStats(): JsonResponse
    {
        $stats = $this->statsService->getStaffStats();

        return $this->successResponse(
            $stats->sortByDesc('stats.total')->values(),
            'Lấy thống kê nhân viên thành công'
        );
    }

    /**
     * Lấy thống kê giám sát (công việc chờ duyệt của từng supervisor)
     */
    public function supervisorStats(): JsonResponse
    {
        $stats = $this->statsService->getSupervisorStats();

        return $this->successResponse(
            $stats->sortByDesc('stats.pending_review')->values(),
            'Lấy thống kê giám sát thành công'
        );
    }

    /**
     * Lấy chi tiết công việc của một nhân viên cụ thể
     */
    public function staffDetail($staffId): JsonResponse
    {
        $data = $this->statsService->getStaffDetail($staffId);

        return $this->successResponse(
            $data,
            'Lấy chi tiết công việc thành công'
        );
    }
}
