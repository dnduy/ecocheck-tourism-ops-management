<?php


namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        // Paginator is returned from service
        $runs = $this->runService->getPendingReviews($request->user(), 20);
        return $this->successResponse($runs, 'Lấy danh sách cần duyệt thành công');
    }

    /**
     * Xem chi tiết run cần duyệt
     */
    public function showForReview(Run $run, Request $request): JsonResponse
    {
        // Service should handle loading relations.
        // We can reuse getRunDetail or create specific method if permissions differ.
        // The original logic had permission checks. Service logic for 'getRunDetail' is generic CRUD.
        // But for review specific view, we might want to check if user is allowed.
        // The Service methods I added (startWork, etc) have checks. getRunDetail just loads data.
        // For simplicity and to stick to "thin controller", I'll use getRunDetail but strictly we should check permissions here or in service.
        // Original controller checked: if ($run->verified_by !== $user->id && $user->role !== 'manager')
        // I will add this check here or assume middleware handles it? No, explicit check is better.

        $user = $request->user();
        if (!$user || !\App\Support\RunAccess::canApprove($user, $run)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $run = $this->runService->getRunDetail($run);
        return $this->successResponse($run, 'Lấy chi tiết checklist thành công');
    }

    /**
     * Bắt đầu làm checklist
     */
    public function startWork(Run $run, Request $request): JsonResponse
    {
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
        $validated = $request->validate([
            'review_note' => 'nullable|string|max:500'
        ]);

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
        $validated = $request->validate([
            'review_note' => 'required|string|max:1000'
        ]);

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
        $stats = $this->runService->getStatusStats();
        return $this->successResponse($stats, 'Lấy thống kê thành công');
    }
}
