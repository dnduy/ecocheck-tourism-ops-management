<?php

namespace App\Domains\Checklist\Services;

use App\Domains\Checklist\Models\Area;
use App\Domains\Checklist\Models\ChecklistEntry;
use App\Domains\Checklist\Models\ChecklistRun;
use App\Domains\Checklist\Models\RunSignoff;
use App\Domains\Checklist\Repositories\ChecklistRunRepository;
use Illuminate\Support\Collection;

class ChecklistService
{
    public function __construct(
        private ChecklistRunRepository $runRepository
    ) {
    }

    public function createOrGetRun(int $areaId, string $date, ?int $assignedTo = null): ChecklistRun
    {
        // Note: findByAreaAndDate might return existing run which might have DIFFERENT assignee. 
        // We generally return it as is.
        $run = $this->runRepository->findByAreaAndDate($areaId, $date);

        if ($run) {
            return $run;
        }

        $area = Area::findOrFail($areaId);
        $template = $area->templates()->where('is_active', true)->firstOrFail();

        return $this->runRepository->create([
            'template_id' => $template->id,
            'area_id' => $areaId,
            'run_date' => $date,
            'status' => 'open',
            'assigned_to' => $assignedTo,
            'created_by' => auth()->id(), // Also set created_by
        ]);
    }

    public function getRuns(array $filters): Collection
    {
        return $this->runRepository->findWithFilters($filters);
    }

    public function getRunDetail(int $runId): array
    {
        $run = $this->runRepository->getRunWithFullData($runId);

        if (!$run) {
            return [];
        }

        $template = $run->template;

        // Build column data with session and role info
        $columns = $template->columns->map(function ($column) {
            return [
                'id' => $column->id,
                'session_id' => $column->session_id,
                'role_id' => $column->role_id,
                'time_hhmm' => $column->session->time_hhmm,
                'role_name' => $column->role?->name,
                'sort_order' => $column->sort_order,
            ];
        });

        return [
            'run' => $run->only(['id', 'template_id', 'area_id', 'run_date', 'status', 'assigned_to', 'verified_by', 'created_at', 'updated_at']),
            'template' => $template->only(['id', 'name', 'orientation', 'is_active']),
            'sessions' => $template->sessions->sortBy('sort_order')->values(),
            'roles' => $template->roles->sortBy('sort_order')->values(),
            'columns' => $columns->sortBy('sort_order')->values(),
            'groups' => $template->groups->sortBy('sort_order')->values(),
            'items' => $template->items->sortBy('sort_order')->values(),
            'entries' => $run->entries->map(fn($entry) => [
                'id' => $entry->id,
                'item_id' => $entry->item_id,
                'column_id' => $entry->column_id,
                'value' => $entry->value,
                'note' => $entry->note,
                'photo_url' => $entry->photo_url,
                'checked_by' => $entry->checked_by,
                'checked_at' => $entry->checked_at,
            ]),
            'signoffs' => $run->signoffs,
        ];
    }

    public function updateRun(int $runId, array $data): ChecklistRun
    {
        $run = ChecklistRun::findOrFail($runId);
        return $this->runRepository->update($run, $data);
    }

    public function upsertCell(array $data): ChecklistEntry
    {
        return ChecklistEntry::updateOrCreate(
            [
                'run_id' => $data['run_id'],
                'item_id' => $data['item_id'],
                'column_id' => $data['column_id'],
            ],
            [
                'value' => $data['value'] ?? '',
                'note' => $data['note'] ?? null,
                'photo_url' => $data['photo_url'] ?? null,
                'checked_by' => auth()->id(),
                'checked_at' => now(),
            ]
        );
    }

    public function upsertSignoff(array $data): RunSignoff
    {
        $conditions = [
            'run_id' => $data['run_id'],
            'session_id' => $data['session_id'],
        ];

        if (!empty($data['role_id'])) {
            $conditions['role_id'] = $data['role_id'];
        }

        return RunSignoff::updateOrCreate(
            $conditions,
            [
                'signed_by' => auth()->id(),
                'signed_at' => now(),
                'note' => $data['note'] ?? null,
            ]
        );
    }

    public function deleteRun(int $runId): bool
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($runId) {
            $run = ChecklistRun::find($runId);

            if (!$run) {
                return false;
            }

            // Delete related entries and signoffs (cascade)
            $run->entries()->delete();
            $run->signoffs()->delete();
            $run->delete();

            return true;
        });
    }
}
