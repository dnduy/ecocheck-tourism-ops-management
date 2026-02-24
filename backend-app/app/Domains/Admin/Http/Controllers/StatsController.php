<?php

namespace App\Domains\Admin\Http\Controllers;

use App\Domains\Checklist\Models\ChecklistRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StatsController
{
    /**
     * Get staff statistics
     */
    public function staffStats()
    {
        $stats = [
            'total_staff' => User::role('staff')->count(),
            'staff_with_runs' => User::role('staff')
                ->whereExists(function ($query) {
                    $query->select(DB::raw(1))
                        ->from('checklist_runs')
                        ->whereColumn('checklist_runs.assigned_to', 'users.id');
                })
                ->count(),
            'total_runs' => ChecklistRun::count(),
            'completed_runs' => ChecklistRun::whereIn('work_status', ['completed', 'needs_review', 'approved'])->count(),
            'pending_runs' => ChecklistRun::whereIn('work_status', ['pending', 'in_progress'])->count(),
            'completion_rate' => $this->getCompletionRate(),
            'staff_by_area' => $this->getStaffByArea(),
        ];

        return response()->json($stats);
    }

    /**
     * Get supervisor statistics
     */
    public function supervisorStats()
    {
        $stats = [
            'total_supervisors' => User::role('supervisor')->count(),
            'supervisors_with_signoffs' => User::role('supervisor')
                ->whereHas('signoffs')
                ->count(),
            'total_signoffs' => DB::table('run_signoffs')->count(),
            'average_signoff_time' => $this->getAverageSignoffTime(),
            'signoffs_by_supervisor' => $this->getSignoffsBySupervisor(),
            'quality_metrics' => $this->getQualityMetrics(),
        ];

        return response()->json($stats);
    }

    /**
     * Calculate completion rate percentage
     */
    private function getCompletionRate(): float
    {
        $total = ChecklistRun::count();
        if ($total === 0) {
            return 0;
        }
        $completed = ChecklistRun::whereIn('work_status', ['completed', 'needs_review', 'approved'])->count();
        return round(($completed / $total) * 100, 2);
    }

    /**
     * Get staff distribution by area
     */
    private function getStaffByArea(): array
    {
        return DB::table('area_user')
            ->join('areas', 'area_user.area_id', '=', 'areas.id')
            ->join('users', 'area_user.user_id', '=', 'users.id')
            ->join('model_has_roles', function ($join) {
                $join->on('model_has_roles.model_id', '=', 'users.id')
                    ->where('model_has_roles.model_type', '=', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('roles.name', 'staff')
            ->select('areas.id', 'areas.name', DB::raw('COUNT(users.id) as staff_count'))
            ->groupBy('areas.id', 'areas.name')
            ->get()
            ->toArray();
    }

    /**
     * Calculate average time between run completion and signoff
     */
    private function getAverageSignoffTime(): string
    {
        $result = DB::table('run_signoffs')
            ->whereNotNull('signed_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, signed_at)) as avg_minutes')
            ->first();

        if (!$result || !$result->avg_minutes) {
            return '0 hours';
        }
        
        $hours = $result->avg_minutes / 60;
        return round($hours, 1) . ' hours';
    }

    /**
     * Get signoff statistics by supervisor
     */
    private function getSignoffsBySupervisor(): array
    {
        return DB::table('run_signoffs')
            ->join('users', 'run_signoffs.signed_by', '=', 'users.id')
            ->select('users.id', 'users.name', DB::raw('COUNT(run_signoffs.id) as total_signoffs'))
            ->groupBy('users.id', 'users.name')
            ->get()
            ->toArray();
    }

    /**
     * Get quality metrics
     */
    private function getQualityMetrics(): array
    {
        $runs = ChecklistRun::count();
        $completed = ChecklistRun::whereIn('work_status', ['completed', 'needs_review', 'approved'])->count();
        $signed = DB::table('run_signoffs')->count();

        return [
            'total_runs' => $runs,
            'completed_runs' => $completed,
            'signed_runs' => $signed,
            'unsigned_rate' => $runs > 0 ? round((($runs - $signed) / $runs) * 100, 2) : 0,
        ];
    }
}
