<?php

namespace App\Interfaces\Repositories;

use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Domains\Checklist\Models\ChecklistRun as Run;

interface RunRepositoryInterface
{
    public function getRunsByAssignee(int $userId): Collection;
    public function getPendingReviewsByVerifier(int $verifierId): Collection;
    public function countByVerifierAndWorkStatus(int $verifierId, string $status): int;
    public function getFirstRunWithAreaByVerifier(int $verifierId): ?Run;

    // Direct Controller support methods
    public function startQuery();
    public function getAll(array $filters = [], ?\App\Domains\User\Models\User $user = null, int $perPage = 50);
    public function create(array $data): Run;
    public function update(Run $run, array $data): Run;
    public function delete(Run $run): bool;
    public function loadRelations(Run $run, array $relations): Run;

    // Workflow support
    public function getPendingReviewsPaginated(int $verifierId, int $perPage): LengthAwarePaginator;
    public function countByStatus(string $status): int;
}
