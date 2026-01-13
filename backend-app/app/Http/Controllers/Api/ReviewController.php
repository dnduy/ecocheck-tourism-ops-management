<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Run;
use App\Models\Signoff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * ReviewController - Quản lý workflow duyệt checklist
 * 
 * Status flow: draft → pending → in_progress → completed → needs_review → approved/rejected
 */
class ReviewController extends Controller
{
    /**
     * Lấy danh sách runs cần duyệt
     */
    public function getPendingReviews(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $runs = Run::with([
                'area',
                'template',
                'assignedUser',
                'verifiedUser',
                'signoffs.user'
            ])
            ->where('work_status', 'needs_review')
            ->where('verified_by', $user->id)  // Chỉ reviewer mới thấy
            ->orderByDesc('review_requested_at')
            ->paginate(20);

        return response()->json($runs);
    }

    /**
     * Xem chi tiết run cần duyệt (kèm tất cả entries và signoffs)
     */
    public function showForReview(Run $run, Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Verify reviewer permission
        if ($run->verified_by !== $user->id && $user->role !== 'manager') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $run->load([
            'area',
            'template.groups.items',
            'template.columns',
            'entries',
            'signoffs.user',
            'assignedUser',
            'verifiedUser'
        ]);

        return response()->json($run);
    }

    /**
     * Bắt đầu làm checklist (chuyển status từ pending → in_progress)
     */
    public function startWork(Run $run, Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Verify executor
        if ($run->assigned_to !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($run->work_status !== 'pending') {
            return response()->json(['error' => 'Checklist không ở trạng thái pending'], 400);
        }

        $run->update([
            'work_status' => 'in_progress',
            'started_at' => now()
        ]);

        return response()->json(['message' => '✅ Bắt đầu làm checklist', 'run' => $run]);
    }

    /**
     * Hoàn thành checklist (chuyển status từ in_progress → completed)
     */
    public function completeWork(Run $run, Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($run->assigned_to !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($run->work_status !== 'in_progress') {
            return response()->json(['error' => 'Checklist phải ở trạng thái in_progress'], 400);
        }

        $run->update([
            'work_status' => 'completed',
            'completed_at' => now()
        ]);

        return response()->json(['message' => '✅ Đã hoàn thành checklist', 'run' => $run]);
    }

    /**
     * Yêu cầu duyệt (chuyển status từ completed → needs_review)
     */
    public function requestReview(Run $run, Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($run->assigned_to !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($run->work_status !== 'completed') {
            return response()->json(['error' => 'Chỉ có thể yêu cầu duyệt khi completed'], 400);
        }

        $run->update([
            'work_status' => 'needs_review',
            'review_requested_at' => now()
        ]);

        return response()->json(['message' => '✅ Đã yêu cầu duyệt', 'run' => $run]);
    }

    /**
     * Phê duyệt (Approve)
     */
    public function approve(Run $run, Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($run->verified_by !== $user->id && $user->role !== 'manager') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($run->work_status !== 'needs_review') {
            return response()->json(['error' => 'Checklist phải ở trạng thái needs_review'], 400);
        }

        $validated = $request->validate([
            'review_note' => 'nullable|string|max:500'
        ]);

        DB::transaction(function () use ($run, $user, $validated) {
            // Update run status
            $run->update([
                'work_status' => 'approved',
                'verified_by' => $user->id
            ]);

            // Create signoff record
            Signoff::create([
                'run_id' => $run->id,
                'role' => 'supervisor',
                'user_id' => $user->id,
                'review_status' => 'approved',
                'review_note' => $validated['review_note'] ?? '✅ Đã xác nhận',
                'reviewed_at' => now(),
                'signed_at' => now(),
                'note' => $validated['review_note'] ?? 'Đã duyệt và xác nhận'
            ]);
        });

        return response()->json(['message' => '✅ Đã phê duyệt checklist', 'run' => $run]);
    }

    /**
     * Từ chối (Reject)
     */
    public function reject(Run $run, Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($run->verified_by !== $user->id && $user->role !== 'manager') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($run->work_status !== 'needs_review') {
            return response()->json(['error' => 'Checklist phải ở trạng thái needs_review'], 400);
        }

        $validated = $request->validate([
            'review_note' => 'required|string|max:1000'
        ]);

        DB::transaction(function () use ($run, $user, $validated) {
            // Update run status
            $run->update([
                'work_status' => 'rejected'
            ]);

            // Create signoff record
            Signoff::create([
                'run_id' => $run->id,
                'role' => 'supervisor',
                'user_id' => $user->id,
                'review_status' => 'rejected',
                'review_note' => $validated['review_note'],
                'reviewed_at' => now(),
                'signed_at' => now(),
                'note' => "❌ Từ chối: " . $validated['review_note']
            ]);
        });

        return response()->json(['message' => '❌ Đã từ chối checklist', 'run' => $run]);
    }

    /**
     * Gửi lại (Re-submit) - từ rejected → needs_review
     */
    public function resubmit(Run $run, Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($run->assigned_to !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($run->work_status !== 'rejected') {
            return response()->json(['error' => 'Chỉ có thể gửi lại khi bị rejected'], 400);
        }

        $run->update([
            'work_status' => 'needs_review',
            'review_requested_at' => now()
        ]);

        return response()->json(['message' => '✅ Đã gửi lại để duyệt', 'run' => $run]);
    }

    /**
     * Lấy thống kê trạng thái
     */
    public function getStatusStats(Request $request): JsonResponse
    {
        $stats = [
            'pending' => Run::where('work_status', 'pending')->count(),
            'in_progress' => Run::where('work_status', 'in_progress')->count(),
            'completed' => Run::where('work_status', 'completed')->count(),
            'needs_review' => Run::where('work_status', 'needs_review')->count(),
            'approved' => Run::where('work_status', 'approved')->count(),
            'rejected' => Run::where('work_status', 'rejected')->count(),
        ];

        return response()->json($stats);
    }
}
