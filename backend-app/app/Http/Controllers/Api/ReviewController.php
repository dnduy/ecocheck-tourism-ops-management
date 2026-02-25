<?php


namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\WorkStatus;
use App\Models\Run;
use App\Interfaces\RunServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ReviewController - Quản lý workflow duyệt checklist
 * 
 * Status flow: draft → pending → in_progress → completed → needs_review → approved/rejected
 */
class ReviewController extends Controller
{
    use \App\Traits\ApiResponse;

    protected $runService;

    public function __construct(RunServiceInterface $runService)
    {
        $this->runService = $runService;
    }

    /**
     * Lấy danh sách runs cần duyệt
     */
    public function getPendingReviews(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Run::class);
        $runs = $this->runService->getPendingReviews($request->user(), 20);
        return $this->successResponse($runs, 'Lấy danh sách cần duyệt thành công');
    }

    public function showForReview(Run $run, Request $request): JsonResponse
    {
        $this->authorize('viewForReview', $run);
        $run = $this->runService->getRunDetail($run);
        return $this->successResponse($run, 'Lấy chi tiết checklist thành công');
    }

    /**
     * Bắt đầu làm checklist
     */
    public function startWork(Run $run, Request $request): JsonResponse
    {
        $this->authorize('startWork', $run);
        try {
            $run = $this->runService->startWork($run, $request->user());
            return $this->successResponse($run, '✅ Bắt đầu làm checklist');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Hoàn thành checklist
     */
    public function completeWork(Run $run, Request $request): JsonResponse
    {
        $this->authorize('completeWork', $run);
        try {
            $run = $this->runService->completeWork($run, $request->user());
            return $this->successResponse($run, '✅ Đã hoàn thành checklist');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Yêu cầu duyệt
     */
    public function requestReview(Run $run, Request $request): JsonResponse
    {
        $this->authorize('requestReview', $run);
        try {
            $run = $this->runService->requestReview($run, $request->user());
            return $this->successResponse($run, '✅ Đã yêu cầu duyệt');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Phê duyệt (Approve)
     */
    public function approve(Run $run, Request $request): JsonResponse
    {
        $this->authorize('approve', $run);
        $validated = $request->validate(['review_note' => 'nullable|string|max:500']);
        try {
            $run = $this->runService->approveRun($run, $request->user(), $validated['review_note'] ?? null);
            return $this->successResponse($run, '✅ Đã phê duyệt checklist');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Từ chối (Reject)
     */
    public function reject(Run $run, Request $request): JsonResponse
    {
        $this->authorize('reject', $run);
        $validated = $request->validate(['review_note' => 'required|string|max:1000']);
        try {
            $run = $this->runService->rejectRun($run, $request->user(), $validated['review_note']);
            return $this->successResponse($run, '❌ Đã từ chối checklist');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Gửi lại (Re-submit)
     */
    public function resubmit(Run $run, Request $request): JsonResponse
    {
        $this->authorize('resubmit', $run);
        try {
            $run = $this->runService->resubmitRun($run, $request->user());
            return $this->successResponse($run, '✅ Đã gửi lại để duyệt');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Lấy thống kê trạng thái
     */
    public function getStatusStats(Request $request): JsonResponse
    {
        $filters = $request->only(['date', 'area_id']);
        $stats = $this->runService->getStatusStats($filters);
        return $this->successResponse($stats, 'Lấy thống kê thành công');
    }
}
