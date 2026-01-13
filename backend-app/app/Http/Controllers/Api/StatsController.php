<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Run;
use App\Models\Signoff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    /**
     * Lấy thống kê nhân viên (chưa làm, đã làm, chờ duyệt)
     */
    public function staffStats(): JsonResponse
    {
        // Lấy tất cả staff users
        $staffUsers = User::whereIn('role', ['staff', 'maintenance'])->get();

        $stats = $staffUsers->map(function ($user) {
            // Lấy tất cả runs được gán cho nhân viên này
            $runs = Run::where('assigned_to', $user->id)
                ->where('status', '!=', 'archived')
                ->with('area')
                ->get();

            // Lấy area từ run đầu tiên có area
            $area = $runs->whereNotNull('area')->first()?->area?->name ?? 'N/A';

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'area' => $area,
                'stats' => [
                    'pending' => $runs->where('work_status', 'pending')->count(),
                    'in_progress' => $runs->where('work_status', 'in_progress')->count(),
                    'completed' => $runs->where('work_status', 'completed')->count(),
                    'needs_review' => $runs->where('work_status', 'needs_review')->count(),
                    'approved' => $runs->where('work_status', 'approved')->count(),
                    'rejected' => $runs->where('work_status', 'rejected')->count(),
                    'total' => $runs->count(),
                ],
                'last_activity' => $runs->max('updated_at'),
            ];
        });

        return response()->json([
            'data' => $stats->sortByDesc('stats.total')->values(),
        ]);
    }

    /**
     * Lấy thống kê giám sát (công việc chờ duyệt của từng supervisor)
     */
    public function supervisorStats(): JsonResponse
    {
        // Lấy tất cả supervisors
        $supervisors = User::where('role', 'supervisor')->get();

        $stats = $supervisors->map(function ($supervisor) {
            // Lấy runs được gán cho supervisor này để duyệt
            $pendingReviews = Run::where('verified_by', $supervisor->id)
                ->where('work_status', 'needs_review')
                ->with(['assignedUser', 'area', 'template'])
                ->get();

            // Lấy runs đã duyệt (approved/rejected) của supervisor này
            $approvedRuns = Run::where('verified_by', $supervisor->id)
                ->where('work_status', 'approved')
                ->count();
            
            $rejectedRuns = Run::where('verified_by', $supervisor->id)
                ->where('work_status', 'rejected')
                ->count();

            // Lấy area từ run đầu tiên
            $area = Run::where('verified_by', $supervisor->id)
                ->with('area')
                ->whereNotNull('area_id')
                ->first()?->area?->name ?? 'Tất cả';

            return [
                'id' => $supervisor->id,
                'name' => $supervisor->name,
                'email' => $supervisor->email,
                'area' => $area,
                'stats' => [
                    'pending_review' => $pendingReviews->count(),
                    'approved' => $approvedRuns,
                    'rejected' => $rejectedRuns,
                    'total_handled' => $approvedRuns + $rejectedRuns,
                ],
                'pending_details' => $pendingReviews->map(function ($run) {
                    return [
                        'id' => $run->id,
                        'staff_name' => $run->assignedUser?->name ?? 'N/A',
                        'area' => $run->area?->name ?? 'N/A',
                        'template' => $run->template?->name ?? 'N/A',
                        'requested_at' => $run->review_requested_at,
                        'days_pending' => $run->review_requested_at ? \Carbon\Carbon::parse($run->review_requested_at)->diffInDays(\Carbon\Carbon::now()) : 0,
                    ];
                })->values(),
            ];
        });

        return response()->json([
            'data' => $stats->sortByDesc('stats.pending_review')->values(),
        ]);
    }

    /**
     * Lấy chi tiết công việc của một nhân viên cụ thể
     */
    public function staffDetail($staffId): JsonResponse
    {
        $staff = User::findOrFail($staffId);

        $runs = Run::where('assigned_to', $staffId)
            ->where('status', '!=', 'archived')
            ->with(['template', 'area', 'signoffs'])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'user' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'role' => $staff->role,
            ],
            'runs' => $runs->map(function ($run) {
                $latestSignoff = $run->signoffs?->sortByDesc('reviewed_at')->first();
                
                return [
                    'id' => $run->id,
                    'template' => $run->template?->name,
                    'area' => $run->area?->name,
                    'work_status' => $run->work_status,
                    'status' => $run->status,
                    'created_at' => $run->created_at,
                    'updated_at' => $run->updated_at,
                    'completed_at' => $run->completed_at,
                    'review_requested_at' => $run->review_requested_at,
                    'review_note' => $latestSignoff?->review_note,
                    'reviewed_at' => $latestSignoff?->reviewed_at,
                ];
            }),
        ]);
    }
}
