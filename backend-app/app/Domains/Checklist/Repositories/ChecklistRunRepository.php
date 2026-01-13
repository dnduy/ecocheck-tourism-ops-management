<?php

namespace App\Domains\Checklist\Repositories;

use App\Domains\Checklist\Models\ChecklistRun;
use App\Domains\Checklist\Repositories\Contracts\ChecklistRunRepositoryInterface;
use Illuminate\Support\Collection;

class ChecklistRunRepository implements ChecklistRunRepositoryInterface
{
    public function find(int $id): ?ChecklistRun
    {
        return ChecklistRun::find($id);
    }
    
    public function findByAreaAndDate(int $areaId, string $date): ?ChecklistRun
    {
        return ChecklistRun::where('area_id', $areaId)
            ->where('run_date', $date)
            ->first();
    }
    
    public function create(array $data): ChecklistRun
    {
        return ChecklistRun::create($data);
    }
    
    public function update(ChecklistRun $run, array $data): ChecklistRun
    {
        $run->update($data);
        return $run->fresh();
    }
    
    public function findWithFilters(array $filters): Collection
    {
        $query = ChecklistRun::with(['area', 'template', 'assignedTo', 'verifiedBy']);
        
        if (!empty($filters['date'])) {
            $query->where('run_date', $filters['date']);
        }
        
        if (!empty($filters['area_id'])) {
            $query->where('area_id', $filters['area_id']);
        }
        
        if (!empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }
        
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        return $query->get();
    }
    
    public function getRunWithFullData(int $runId): ?ChecklistRun
    {
        return ChecklistRun::with([
            'template.sessions',
            'template.roles',
            'template.columns.session',
            'template.columns.role',
            'template.groups',
            'template.items.group',
            'entries.item',
            'entries.column',
            'entries.checkedBy',
            'signoffs.session',
            'signoffs.role',
            'signoffs.signedBy',
            'area',
            'assignedTo',
            'verifiedBy'
        ])->find($runId);
    }
}
