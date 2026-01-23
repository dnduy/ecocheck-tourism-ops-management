<?php

namespace App\Repositories;

use App\Interfaces\Repositories\RunRepositoryInterface;
use App\Models\Run;
use Illuminate\Support\Collection;

class RunRepository implements RunRepositoryInterface
{
    public function getRunsByAssignee(int $userId): Collection
    {
        return Run::where('assigned_to', $userId)
            ->where('status', '!=', 'archived')
            ->with(['area', 'template', 'signoffs'])
            ->orderByDesc('updated_at')
            ->get();
    }

    public function getPendingReviewsByVerifier(int $verifierId): Collection
    {
        return Run::where('verified_by', $verifierId)
            ->where('work_status', 'needs_review')
            ->with(['assignedUser', 'area', 'template'])
            ->get();
    }

    public function countByVerifierAndWorkStatus(int $verifierId, string $status): int
    {
        return Run::where('verified_by', $verifierId)
            ->where('work_status', $status)
            ->count();
    }

    public function getFirstRunWithAreaByVerifier(int $verifierId): ?Run
    {
        return Run::where('verified_by', $verifierId)
            ->with('area')
            ->whereNotNull('area_id')
            ->first();
    }

    public function startQuery()
    {
        return Run::query();
    }

    public function getAll(array $filters = [], ?\App\Models\User $user = null, int $perPage = 50)
    {
        $query = $this->startQuery()->with([
            'area',
            'template.groups.items',
            'template.columns',
            'entries',
            'assignedUser',
            'verifiedUser'
        ]);

        // Filters
        if (isset($filters['area_id'])) {
            $query->where('area_id', $filters['area_id']);
        }
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['date'])) {
            $query->whereDate('run_date', $filters['date']);
        }

        // Role-based filtering
        if ($user) {
            if ($user->role === 'staff') {
                $query->where('assigned_to', $user->id);
            } elseif ($user->role === 'supervisor') {
                $query->where(function ($q) use ($user) {
                    $q->where('verified_by', $user->id)
                        ->orWhere('assigned_to', $user->id);
                });
            }
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function create(array $data): Run
    {
        return Run::create($data);
    }

    public function update(Run $run, array $data): Run
    {
        $run->update($data);
        return $run;
    }

    public function delete(Run $run): bool
    {
        return $run->delete();
    }

    public function loadRelations(Run $run, array $relations): Run
    {
        $run->load($relations);
        return $run;
    }

    public function getPendingReviewsPaginated(int $verifierId, int $perPage): \Illuminate\Pagination\LengthAwarePaginator
    {
        return Run::where('verified_by', $verifierId)
            ->where('work_status', 'needs_review')
            ->with([
                'area',
                'template',
                'assignedUser',
                'verifiedUser',
                'signoffs.user'
            ])
            ->orderByDesc('review_requested_at')
            ->paginate($perPage);
    }

    public function countByStatus(string $status): int
    {
        return Run::where('work_status', $status)->count();
    }
}
