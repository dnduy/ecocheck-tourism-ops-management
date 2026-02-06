<?php

namespace App\Services;

use App\Interfaces\RunServiceInterface;
use App\Interfaces\Repositories\RunRepositoryInterface;
use App\Interfaces\Repositories\SignoffRepositoryInterface;
use App\Models\Run;
use App\Models\User;
use App\Models\ChecklistTemplate;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use App\Support\RunAccess;

class RunService implements RunServiceInterface
{
    protected $runRepository;
    protected $signoffRepository;
    protected const WORKFLOW_STATUSES = [
        'pending',
        'in_progress',
        'completed',
        'needs_review',
        'approved',
        'rejected',
    ];

    public function __construct(
        RunRepositoryInterface $runRepository,
        SignoffRepositoryInterface $signoffRepository
    ) {
        $this->runRepository = $runRepository;
        $this->signoffRepository = $signoffRepository;
    }

    public function getRuns(array $filters, ?User $user, int $perPage): LengthAwarePaginator
    {
        return $this->runRepository->getAll($filters, $user, $perPage);
    }

    public function createRun(array $data, User $creator): Run
    {
        return DB::transaction(function () use ($data, $creator) {
            // Prefer active template for area; fallback to any template, then create default.
            $template = ChecklistTemplate::where('area_id', $data['area_id'] ?? null)
                ->where('is_active', true)
                ->first()
                ?? ChecklistTemplate::where('area_id', $data['area_id'] ?? null)->first()
                ?? ChecklistTemplate::first()
                ?? ChecklistTemplate::create([
                    'area_id' => $data['area_id'],
                    'name' => 'Default',
                    'is_active' => true,
                ]);

            try {
                $workStatus = 'pending';
                return $this->runRepository->create([
                    'template_id' => $data['checklist_template_id'] ?? $data['template_id'] ?? $template->id,
                    'area_id' => $data['area_id'],
                    'status' => $this->toLegacyStatus($workStatus), // Legacy mirror
                    'work_status' => $workStatus, // Workflow status
                    'run_date' => $data['scheduled_for'] ?? $data['date'] ?? now(),
                    'created_by' => $creator->id,
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() == 23000) { // Integrity constraint violation
                    // Find existing run and return it
                    $existingRun = Run::where('template_id', $data['checklist_template_id'] ?? $data['template_id'] ?? $template->id)
                        ->where('area_id', $data['area_id'])
                        ->whereDate('run_date', $data['scheduled_for'] ?? $data['date'] ?? now())
                        ->first();

                    if ($existingRun) {
                        return $existingRun;
                    }
                }
                throw $e;
            }
        });
    }

    public function getRunDetail(Run $run): Run
    {
        $run = $this->runRepository->loadRelations($run, [
            'area',
            'template.groups.items',
            'template.items',
            'template.columns' => fn($q) => $q->orderBy('sort_order'),
            'entries',
            'signoffs',
            'assignedUser',
            'verifiedUser'
        ]);
        return $run;
    }

    public function updateRun(Run $run, array $data): Run
    {
        // If re-assigning to a new staff, clear previous progress and incidents state
        if (array_key_exists('assigned_to', $data) && $data['assigned_to'] !== $run->assigned_to) {
            // Remove old check results
            $run->entries()->delete();
            // Remove old signoffs
            $run->signoffs()->delete();
            // Reset status/timestamps to start fresh
            $data['work_status'] = 'pending';
            $data['started_at'] = null;
            $data['completed_at'] = null;
            $data['review_requested_at'] = null;
        }

        $data = $this->syncStatusFields($data, $run);

        return $this->runRepository->update($run, $data);
    }


    public function deleteRun(Run $run): void
    {
        $this->runRepository->delete($run);
    }

    // Workflow Methods

    public function startWork(Run $run, User $user): Run
    {
        if (!$user->hasRole('staff')) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->assigned_to !== $user->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if (!in_array($run->work_status, ['pending', 'draft'], true)) {
            throw new \Exception('Checklist không ở trạng thái pending');
        }

        $workStatus = 'in_progress';
        return $this->runRepository->update($run, [
            'work_status' => $workStatus,
            'status' => $this->toLegacyStatus($workStatus),
            'started_at' => now()
        ]);
    }

    public function completeWork(Run $run, User $user): Run
    {
        if (!$user->hasRole('staff')) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->assigned_to !== $user->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'in_progress') {
            throw new \Exception('Checklist phải ở trạng thái in_progress');
        }

        $workStatus = 'completed';
        return $this->runRepository->update($run, [
            'work_status' => $workStatus,
            'status' => $this->toLegacyStatus($workStatus),
            'completed_at' => now()
        ]);
    }

    public function requestReview(Run $run, User $user): Run
    {
        if (!$user->hasRole('staff')) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->assigned_to !== $user->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'completed') {
            throw new \Exception('Chỉ có thể yêu cầu duyệt khi completed');
        }

        $workStatus = 'needs_review';
        return $this->runRepository->update($run, [
            'work_status' => $workStatus,
            'status' => $this->toLegacyStatus($workStatus),
            'review_requested_at' => now()
        ]);
    }

    public function approveRun(Run $run, User $user, ?string $note): Run
    {
        if (!RunAccess::canApprove($user, $run)) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'needs_review') {
            throw new \Exception('Checklist phải ở trạng thái needs_review');
        }

        return DB::transaction(function () use ($run, $user, $note) {
            // Update run status
            $this->runRepository->update($run, [
                'work_status' => 'approved',
                'status' => $this->toLegacyStatus('approved'),
                'verified_by' => $user->id
            ]);

            // Create signoff using SignoffRepository
            $this->signoffRepository->create([
                'run_id' => $run->id,
                'role' => $user->getRoleNames()->first() ?? 'supervisor',
                'user_id' => $user->id,
                'review_status' => 'approved',
                'review_note' => $note ?? '✅ Đã xác nhận',
                'reviewed_at' => now(),
                'signed_at' => now(),
                'note' => $note ?? 'Đã duyệt và xác nhận'
            ]);

            return $run;
        });
    }

    public function rejectRun(Run $run, User $user, string $note): Run
    {
        if (!RunAccess::canApprove($user, $run)) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'needs_review') {
            throw new \Exception('Checklist phải ở trạng thái needs_review');
        }

        return DB::transaction(function () use ($run, $user, $note) {
            $this->runRepository->update($run, [
                'work_status' => 'rejected',
                'status' => $this->toLegacyStatus('rejected'),
            ]);

            $this->signoffRepository->create([
                'run_id' => $run->id,
                'role' => $user->getRoleNames()->first() ?? 'supervisor',
                'user_id' => $user->id,
                'review_status' => 'rejected',
                'review_note' => $note,
                'reviewed_at' => now(),
                'signed_at' => now(),
                'note' => "❌ Từ chối: " . $note
            ]);

            return $run;
        });
    }

    public function resubmitRun(Run $run, User $user): Run
    {
        if (!$user->hasRole('staff')) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->assigned_to !== $user->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'rejected') {
            throw new \Exception('Chỉ có thể gửi lại khi bị rejected');
        }

        $workStatus = 'needs_review';
        return $this->runRepository->update($run, [
            'work_status' => $workStatus,
            'status' => $this->toLegacyStatus($workStatus),
            'review_requested_at' => now()
        ]);
    }

    private function normalizeWorkStatus(?string $status): ?string
    {
        if (!$status) {
            return null;
        }

        $status = strtolower($status);
        $map = [
            'open' => 'pending',
            'draft' => 'pending',
            'active' => 'in_progress',
            'done' => 'completed',
            'completed' => 'completed',
            'pending' => 'pending',
            'in_progress' => 'in_progress',
            'needs_review' => 'needs_review',
            'approved' => 'approved',
            'rejected' => 'rejected',
        ];

        return $map[$status] ?? $status;
    }

    private function syncStatusFields(array $data, ?Run $run = null): array
    {
        if (array_key_exists('work_status', $data) && $data['work_status']) {
            $data['work_status'] = $this->normalizeWorkStatus($data['work_status']);
            $data['status'] = $this->toLegacyStatus($data['work_status']);
            return $data;
        }

        if (array_key_exists('status', $data) && $data['status']) {
            $data['work_status'] = $this->normalizeWorkStatus($data['status']);
            $data['status'] = $this->toLegacyStatus($data['work_status']);
            return $data;
        }

        if ($run && $run->work_status) {
            $legacyStatus = $this->toLegacyStatus($run->work_status);
            if ($run->status !== $legacyStatus) {
                $data['status'] = $legacyStatus;
            }
        }

        return $data;
    }

    private function toLegacyStatus(?string $workStatus): string
    {
        $workStatus = $this->normalizeWorkStatus($workStatus) ?? 'pending';
        return in_array($workStatus, ['completed', 'needs_review', 'approved'], true) ? 'done' : 'open';
    }

    public function getPendingReviews(User $user, int $perPage): LengthAwarePaginator
    {
        if (RunAccess::isAdminOrManager($user)) {
            return $this->runRepository->getAllPendingReviewsPaginated($perPage);
        }

        return $this->runRepository->getPendingReviewsPaginated($user->id, $perPage);
    }

    public function getStatusStats(): array
    {
        return [
            'pending' => $this->runRepository->countByStatus('pending'),
            'in_progress' => $this->runRepository->countByStatus('in_progress'),
            'completed' => $this->runRepository->countByStatus('completed'),
            'needs_review' => $this->runRepository->countByStatus('needs_review'),
            'approved' => $this->runRepository->countByStatus('approved'),
            'rejected' => $this->runRepository->countByStatus('rejected'),
        ];
    }

    public function exportRun(Run $run)
    {
        $filename = 'checklist_' . $run->id . '_' . now()->format('Ymd_His') . '.xlsx';
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ChecklistExport($run), $filename);
    }
}
