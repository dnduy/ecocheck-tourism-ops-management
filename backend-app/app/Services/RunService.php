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

class RunService implements RunServiceInterface
{
    protected $runRepository;
    protected $signoffRepository;

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
            // Use existing template or create default one
            $template = ChecklistTemplate::first() ?? ChecklistTemplate::create([
                'name' => 'Default',
                'is_active' => true,
            ]);

            return $this->runRepository->create([
                'template_id' => $data['checklist_template_id'] ?? $data['template_id'] ?? $template->id,
                'area_id' => $data['area_id'],
                'status' => 'open', // Enum: open, done
                'work_status' => 'pending', // Workflow status
                'run_date' => $data['scheduled_for'] ?? $data['date'] ?? now(),
                'created_by' => $creator->id,
            ]);
        });
    }

    public function getRunDetail(Run $run): Run
    {
        return $this->runRepository->loadRelations($run, [
            'area',
            'template.groups.items',
            'template.columns' => fn($q) => $q->orderBy('sort_order'),
            'entries',
            'signoffs',
            'assignedUser',
            'verifiedUser'
        ]);
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
            $data['work_status'] = 'draft';
            $data['status'] = 'open'; // Keep as open
            $data['started_at'] = null;
            $data['completed_at'] = null;
        }

        return $this->runRepository->update($run, $data);
    }


    public function deleteRun(Run $run): void
    {
        $this->runRepository->delete($run);
    }

    // Workflow Methods

    public function startWork(Run $run, User $user): Run
    {
        if ($run->assigned_to !== $user->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'pending') {
            throw new \Exception('Checklist không ở trạng thái pending');
        }

        return $this->runRepository->update($run, [
            'work_status' => 'in_progress',
            'started_at' => now()
        ]);
    }

    public function completeWork(Run $run, User $user): Run
    {
        if ($run->assigned_to !== $user->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'in_progress') {
            throw new \Exception('Checklist phải ở trạng thái in_progress');
        }

        return $this->runRepository->update($run, [
            'work_status' => 'completed',
            'completed_at' => now()
        ]);
    }

    public function requestReview(Run $run, User $user): Run
    {
        if ($run->assigned_to !== $user->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'completed') {
            throw new \Exception('Chỉ có thể yêu cầu duyệt khi completed');
        }

        return $this->runRepository->update($run, [
            'work_status' => 'needs_review',
            'review_requested_at' => now()
        ]);
    }

    public function approveRun(Run $run, User $user, ?string $note): Run
    {
        if ($run->verified_by !== $user->id && $user->role !== 'manager') {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'needs_review') {
            throw new \Exception('Checklist phải ở trạng thái needs_review');
        }

        return DB::transaction(function () use ($run, $user, $note) {
            // Update run status
            $this->runRepository->update($run, [
                'work_status' => 'approved',
                'verified_by' => $user->id
            ]);

            // Create signoff using SignoffRepository
            $this->signoffRepository->create([
                'run_id' => $run->id,
                'role' => 'supervisor',
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
        if ($run->verified_by !== $user->id && $user->role !== 'manager') {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'needs_review') {
            throw new \Exception('Checklist phải ở trạng thái needs_review');
        }

        return DB::transaction(function () use ($run, $user, $note) {
            $this->runRepository->update($run, [
                'work_status' => 'rejected'
            ]);

            $this->signoffRepository->create([
                'run_id' => $run->id,
                'role' => 'supervisor',
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
        if ($run->assigned_to !== $user->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        if ($run->work_status !== 'rejected') {
            throw new \Exception('Chỉ có thể gửi lại khi bị rejected');
        }

        return $this->runRepository->update($run, [
            'work_status' => 'needs_review',
            'review_requested_at' => now()
        ]);
    }

    public function getPendingReviews(User $user, int $perPage): LengthAwarePaginator
    {
        // Using existing Repository method which returns Collection, need to ensure Paginator if expected
        // The repository method `getPendingReviewsByVerifier` currently returns `Collection` (get()).
        // This Service method expects Paginator. I need to update Repository to support pagination for this specific call or handle it here.
        // Actually the Controller used paginate(20). 
        // I should update RunRepository to have a proper `getPendingReviewsByVerifierPaginated`.

        // For now let's implement the query here or add method to Repo. Adding method to Repo is "cleaner".
        // To save steps I will modify Repo in next step. Here I write assumption it returns paginator or I fix logic.

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
