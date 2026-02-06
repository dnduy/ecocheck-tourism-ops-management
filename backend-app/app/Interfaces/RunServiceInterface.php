<?php

namespace App\Interfaces;

use App\Models\Run;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface RunServiceInterface
{
    public function getRuns(array $filters, ?User $user, int $perPage): LengthAwarePaginator;
    public function createRun(array $data, User $creator): Run;
    public function getRunDetail(Run $run): Run;
    public function updateRun(Run $run, array $data): Run;
    public function deleteRun(Run $run): void;

    // Workflow methods
    public function startWork(Run $run, User $user): Run;
    public function completeWork(Run $run, User $user): Run;
    public function requestReview(Run $run, User $user): Run;
    public function approveRun(Run $run, User $user, ?string $note): Run;
    public function rejectRun(Run $run, User $user, string $note): Run;
    public function resubmitRun(Run $run, User $user): Run;
    public function getPendingReviews(User $user, int $perPage): LengthAwarePaginator;
    public function getStatusStats(): array;
    public function exportRun(Run $run);
}
