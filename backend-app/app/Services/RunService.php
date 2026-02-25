<?php

namespace App\Services;

use App\Interfaces\RunServiceInterface;
use App\Interfaces\Repositories\RunRepositoryInterface;
use App\Interfaces\Repositories\SignoffRepositoryInterface;
use App\Models\Run;
use App\Models\User;
use App\Models\ChecklistTemplate;
use App\Models\TemplateColumn;
use App\Domains\Checklist\Models\TemplateSession;
use App\Models\Entry;
use App\Models\Signoff;
use App\Models\RunAssignmentLog;
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
            $requestedTemplateId = $data['checklist_template_id'] ?? $data['template_id'] ?? null;

            // Prefer requested template; fallback to active template for area, then any template for that area.
            // Never auto-create a template — that would produce silent dirty data.
            if ($requestedTemplateId) {
                $template = ChecklistTemplate::find($requestedTemplateId);
                if (!$template) {
                    throw new \InvalidArgumentException("Template #{$requestedTemplateId} không tồn tại.");
                }
            } else {
                $template = ChecklistTemplate::where('area_id', $data['area_id'] ?? null)
                    ->where('is_active', true)
                    ->first()
                    ?? ChecklistTemplate::where('area_id', $data['area_id'] ?? null)->first();

                if (!$template) {
                    throw new \InvalidArgumentException("Không tìm thấy template nào cho khu vực này. Vui lòng tạo template trước.");
                }
            }

            $sessionId = $data['session_id'] ?? $template->sessions()->orderBy('sort_order')->value('id');

            try {
                $workStatus = 'pending';
                $templateId = $requestedTemplateId ?? $template->id;
                $runDate = $data['scheduled_for'] ?? $data['date'] ?? now();

                $preExisting = Run::where('template_id', $templateId)
                    ->where('area_id', $data['area_id'])
                    ->when($sessionId, function ($query) use ($sessionId) {
                        return $query->where('session_id', $sessionId);
                    }, function ($query) {
                        return $query->whereNull('session_id');
                    })
                    ->whereDate('run_date', $runDate)
                    ->first();

                if ($preExisting) {
                    return $preExisting;
                }

                return $this->runRepository->create([
                    'template_id' => $templateId,
                    'session_id' => $sessionId,
                    'area_id' => $data['area_id'],
                    'status' => $this->toLegacyStatus($workStatus), // Legacy mirror
                    'work_status' => $workStatus, // Workflow status
                    'run_date' => $runDate,
                    'created_by' => $creator->id,
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() == 23000) { // Integrity constraint violation
                    // Find existing run and return it
                    $existingRun = Run::where('template_id', $requestedTemplateId ?? $template->id)
                        ->where('area_id', $data['area_id'])
                        ->when($sessionId, function ($query) use ($sessionId) {
                            return $query->where('session_id', $sessionId);
                        }, function ($query) {
                            return $query->whereNull('session_id');
                        })
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
            'template.sessions' => fn($q) => $q->orderBy('sort_order'),
            'template.roles' => fn($q) => $q->orderBy('sort_order'),
            'template.columns' => fn($q) => $q->orderBy('sort_order')->with(['session', 'role']),
            'session',
            'entries',
            'signoffs',
            'assignedUser',
            'verifiedUser'
        ]);

        // Ensure template has at least one session/column to record evaluations.
        if ($run->relationLoaded('template') && $run->template) {
            $template = $run->template;
            if ($template->relationLoaded('columns') && $template->columns->isEmpty()) {
                $session = TemplateSession::firstOrCreate(
                    ['template_id' => $template->id, 'time_hhmm' => '08:00'],
                    ['sort_order' => 0]
                );

                TemplateColumn::create([
                    'template_id' => $template->id,
                    'session_id' => $session->id,
                    'role_id' => null,
                    'sort_order' => 0,
                ]);

                $template->load(['columns' => fn($q) => $q->orderBy('sort_order')]);
            }
        }

        return $run;
    }

    public function updateRun(Run $run, array $data, ?User $actor = null): Run
    {
        $prevAssignedTo = $run->assigned_to;
        $prevVerifiedBy = $run->verified_by;

        $assignedChanged = array_key_exists('assigned_to', $data) && $data['assigned_to'] !== $run->assigned_to;
        $verifiedChanged = array_key_exists('verified_by', $data) && $data['verified_by'] !== $run->verified_by;
        $newAssignedTo = $assignedChanged ? $data['assigned_to'] : $run->assigned_to;
        $newVerifiedBy = $verifiedChanged ? $data['verified_by'] : $run->verified_by;

        if ($actor) {
            $data['updated_by'] = $actor->id;
        }

        // If re-assigning to a new staff, clear previous progress and incidents state
        if ($assignedChanged) {
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

        $updated = $this->runRepository->update($run, $data);

        if ($assignedChanged || $verifiedChanged) {
            $this->logAssignmentChange(
                $actor,
                $updated,
                $prevAssignedTo,
                $newAssignedTo,
                $prevVerifiedBy,
                $newVerifiedBy,
                'manual-update'
            );
        }

        // Apply assignment change to other unstarted runs today in the same area
        if (($assignedChanged || $verifiedChanged) && $run->run_date && $run->run_date->isToday()) {
            $otherRuns = Run::where('area_id', $run->area_id)
                ->whereDate('run_date', $run->run_date)
                ->where('id', '!=', $run->id)
                ->whereIn('work_status', ['pending', 'draft'])
                ->whereNull('started_at')
                ->get();

            if ($otherRuns->isNotEmpty()) {
                $otherRunIds = $otherRuns->pluck('id');

                if ($assignedChanged) {
                    Entry::whereIn('run_id', $otherRunIds)->delete();
                    Signoff::whereIn('run_id', $otherRunIds)->delete();
                }

                $bulkData = [];
                if ($assignedChanged) {
                    $bulkData['assigned_to'] = $newAssignedTo;
                    $bulkData['work_status'] = 'pending';
                    $bulkData['status'] = $this->toLegacyStatus('pending');
                    $bulkData['started_at'] = null;
                    $bulkData['completed_at'] = null;
                    $bulkData['review_requested_at'] = null;
                }
                if ($verifiedChanged) {
                    $bulkData['verified_by'] = $newVerifiedBy;
                }

                if (!empty($bulkData)) {
                    Run::whereIn('id', $otherRunIds)->update($bulkData);
                }

                if ($actor) {
                    foreach ($otherRuns as $otherRun) {
                        $this->logAssignmentChange(
                            $actor,
                            $otherRun,
                            $otherRun->assigned_to,
                            $assignedChanged ? $newAssignedTo : $otherRun->assigned_to,
                            $otherRun->verified_by,
                            $verifiedChanged ? $newVerifiedBy : $otherRun->verified_by,
                            'auto-sync-today'
                        );
                    }
                }
            }
        }

        return $updated;
    }

    private function logAssignmentChange(
        ?User $actor,
        Run $run,
        ?int $prevAssignedTo,
        ?int $newAssignedTo,
        ?int $prevVerifiedBy,
        ?int $newVerifiedBy,
        string $note
    ): void {
        if (!$actor) {
            return;
        }

        if ($prevAssignedTo === $newAssignedTo && $prevVerifiedBy === $newVerifiedBy) {
            return;
        }

        RunAssignmentLog::create([
            'run_id' => $run->id,
            'assigned_by' => $actor->id,
            'previous_assigned_to' => $prevAssignedTo,
            'new_assigned_to' => $newAssignedTo,
            'previous_verified_by' => $prevVerifiedBy,
            'new_verified_by' => $newVerifiedBy,
            'note' => $note,
        ]);
    }


    public function deleteRun(Run $run): void
    {
        $this->runRepository->delete($run);
    }

    // Workflow Methods

    public function startWork(Run $run, User $user): Run
    {
        if (!$user->hasAnyRole(['staff', 'supervisor'])) {
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
        if (!$user->hasAnyRole(['staff', 'supervisor'])) {
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
        if (!$user->hasAnyRole(['staff', 'supervisor'])) {
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
            // Update run status and capture fresh model
            $updatedRun = $this->runRepository->update($run, [
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

            return $updatedRun;
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
            $updatedRun = $this->runRepository->update($run, [
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

            return $updatedRun;
        });
    }

    public function resubmitRun(Run $run, User $user): Run
    {
        if (!$user->hasAnyRole(['staff', 'supervisor'])) {
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

    public function getStatusStats(array $filters = []): array
    {
        return [
            'pending'     => $this->runRepository->countByStatus('pending', $filters),
            'in_progress' => $this->runRepository->countByStatus('in_progress', $filters),
            'completed'   => $this->runRepository->countByStatus('completed', $filters),
            'needs_review'=> $this->runRepository->countByStatus('needs_review', $filters),
            'approved'    => $this->runRepository->countByStatus('approved', $filters),
            'rejected'    => $this->runRepository->countByStatus('rejected', $filters),
        ];
    }

    public function exportRun(Run $run)
    {
        $filename = 'checklist_' . $run->id . '_' . now()->format('Ymd_His') . '.xlsx';
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ChecklistExport($run), $filename);
    }
}
