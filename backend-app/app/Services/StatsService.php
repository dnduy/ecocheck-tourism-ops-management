<?php

namespace App\Services;

use App\Models\User;
use App\Models\Run;
use Illuminate\Support\Collection;

use App\Interfaces\StatsServiceInterface;
use App\Interfaces\Repositories\UserRepositoryInterface;
use App\Interfaces\Repositories\RunRepositoryInterface;

class StatsService implements StatsServiceInterface
{
    protected $userRepository;
    protected $runRepository;

    public function __construct(
        UserRepositoryInterface $userRepository,
        RunRepositoryInterface $runRepository
    ) {
        $this->userRepository = $userRepository;
        $this->runRepository = $runRepository;
    }

    /**
     * Get statistics for staff users (staff and maintenance roles).
     *
     * @return Collection
     */
    public function getStaffStats(): Collection
    {
        // Lấy tất cả staff users
        $staffUsers = $this->userRepository->getStaffAndMaintenanceUsers();

        return $staffUsers->map(function ($user) {
            // Lấy tất cả runs được gán cho nhân viên này
            // Note: Consider eager loading or grouping to avoid N+1 if data grows large
            $runs = $this->runRepository->getRunsByAssignee($user->id);

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
    }

    /**
     * Get statistics for supervisors.
     *
     * @return Collection
     */
    public function getSupervisorStats(): Collection
    {
        $supervisors = $this->userRepository->getSupervisors();

        return $supervisors->map(function ($supervisor) {
            $pendingReviews = $this->runRepository->getPendingReviewsByVerifier($supervisor->id);

            $approvedRuns = $this->runRepository->countByVerifierAndWorkStatus($supervisor->id, 'approved');
            $rejectedRuns = $this->runRepository->countByVerifierAndWorkStatus($supervisor->id, 'rejected');

            $firstRunWithArea = $this->runRepository->getFirstRunWithAreaByVerifier($supervisor->id);
            $area = $firstRunWithArea?->area?->name ?? 'Tất cả';

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
    }

    /**
     * Get detailed work stats for a specific staff member.
     *
     * @param int $staffId
     * @return array
     */
    public function getStaffDetail(int $staffId): array
    {
        $staff = $this->userRepository->findById($staffId);

        $runs = $this->runRepository->getRunsByAssignee($staffId);

        return [
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
        ];
    }
}
