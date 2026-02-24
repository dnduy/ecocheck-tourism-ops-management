<?php

namespace App\Domains\Checklist\Repositories\Contracts;

use App\Domains\Checklist\Models\ChecklistRun;
use Illuminate\Support\Collection;

interface ChecklistRunRepositoryInterface
{
    public function find(int $id): ?ChecklistRun;
    
    public function findByAreaAndDate(int $areaId, string $date, ?int $templateId = null, ?int $sessionId = null): ?ChecklistRun;
    
    public function create(array $data): ChecklistRun;
    
    public function update(ChecklistRun $run, array $data): ChecklistRun;
    
    public function findWithFilters(array $filters): Collection;
    
    public function getRunWithFullData(int $runId): ?ChecklistRun;
}
