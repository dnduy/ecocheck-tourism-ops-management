<?php

namespace App\Policies;

use App\Models\Run;
use App\Models\User;

/**
 * RunPolicy - Quản lý quyền truy cập trên Run (Checklist Run).
 *
 * Đăng ký trong AppServiceProvider::boot() với:
 *   Gate::policy(Run::class, RunPolicy::class);
 *
 * Dùng trong controller với:
 *   $this->authorize('view', $run);
 *   $this->authorize('startWork', $run);
 */
class RunPolicy
{
    /**
     * Admin và Manager có quyền làm mọi thứ.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasAnyRole(['admin', 'manager'])) {
            return true;
        }
        return null; // Tiếp tục kiểm tra từng method
    }

    /**
     * Xem danh sách runs để review — admin/manager (handled by before()).
     * Supervisor cũng có thể xem.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['supervisor']);
    }

    /**
     * Xem run: supervisor xem tất cả, staff chỉ xem của mình.
     */
    public function view(User $user, Run $run): bool
    {
        if ($user->hasRole('supervisor')) {
            return true;
        }
        return (int) $run->assigned_to === (int) $user->id;
    }

    /**
     * Tạo run: chỉ admin/manager (handled by before()).
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Cập nhật thông tin run (assignment, metadata).
     * Staff chỉ update run của mình và không sửa assignment.
     */
    public function update(User $user, Run $run): bool
    {
        return (int) $run->assigned_to === (int) $user->id;
    }

    /**
     * Xóa run: chỉ admin/manager (handled by before()).
     */
    public function delete(User $user, Run $run): bool
    {
        return false;
    }

    /**
     * Bắt đầu làm checklist (pending → in_progress).
     * Chỉ người được giao việc và có role staff/supervisor.
     */
    public function startWork(User $user, Run $run): bool
    {
        if (!$user->hasAnyRole(['staff', 'supervisor'])) {
            return false;
        }
        return (int) $run->assigned_to === (int) $user->id;
    }

    /**
     * Hoàn thành checklist (in_progress → completed).
     */
    public function completeWork(User $user, Run $run): bool
    {
        if (!$user->hasAnyRole(['staff', 'supervisor'])) {
            return false;
        }
        return (int) $run->assigned_to === (int) $user->id;
    }

    /**
     * Yêu cầu duyệt (completed → needs_review).
     */
    public function requestReview(User $user, Run $run): bool
    {
        if (!$user->hasAnyRole(['staff', 'supervisor'])) {
            return false;
        }
        return (int) $run->assigned_to === (int) $user->id;
    }

    /**
     * Gửi lại sau khi bị reject (rejected → needs_review).
     */
    public function resubmit(User $user, Run $run): bool
    {
        if (!$user->hasAnyRole(['staff', 'supervisor'])) {
            return false;
        }
        return (int) $run->assigned_to === (int) $user->id;
    }

    /**
     * Phê duyệt hoặc từ chối (needs_review → approved/rejected).
     * Chỉ admin/manager — handled by before().
     */
    public function approve(User $user, Run $run): bool
    {
        return false;
    }

    /**
     * Từ chối — chỉ admin/manager (handled by before()).
     */
    public function reject(User $user, Run $run): bool
    {
        return false;
    }

    /**
     * Xem run trong context review — chỉ admin/manager (handled by before()).
     */
    public function viewForReview(User $user, Run $run): bool
    {
        return false;
    }

    /**
     * Export run — supervisor trở lên.
     */
    public function export(User $user, Run $run): bool
    {
        return $user->hasAnyRole(['supervisor']);
    }

    /**
     * Sửa entries (checklist items).
     */
    public function editEntries(User $user, Run $run): bool
    {
        return (int) $run->assigned_to === (int) $user->id;
    }
}
