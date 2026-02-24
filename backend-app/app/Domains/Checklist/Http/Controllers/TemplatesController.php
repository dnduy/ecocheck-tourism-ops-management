<?php

namespace App\Domains\Checklist\Http\Controllers;

use App\Domains\Checklist\Models\Area;
use App\Domains\Checklist\Models\ChecklistTemplate;
use App\Domains\Checklist\Models\TemplateColumn;
use App\Domains\Checklist\Models\TemplateGroup;
use App\Domains\Checklist\Models\TemplateItem;
use App\Domains\Checklist\Models\TemplateRole;
use App\Domains\Checklist\Models\TemplateSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TemplatesController
{
    public function index()
    {
        $templates = ChecklistTemplate::with([
            'area',
            'groups.items',
            'items',
            'sessions',
            'columns.session',
            'columns.role',
        ])
            ->where('is_active', true)
            ->get();

        return response()->json($templates->map(fn (ChecklistTemplate $t) => $this->transformTemplate($t)));
    }

    public function show(int $id)
    {
        $template = ChecklistTemplate::with([
            'area',
            'groups.items',
            'items',
            'sessions',
            'columns.session',
            'columns.role',
        ])
            ->findOrFail($id);

        return response()->json($this->transformTemplate($template));
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'groups' => ['sometimes', 'array'],
            'groups.*.title' => ['required_with:groups', 'string', 'max:255'],
            'groups.*.items' => ['sometimes', 'array'],
            'groups.*.items.*.title' => ['required_with:groups.*.items', 'string'],
            'columns' => ['sometimes', 'array'],
            'columns.*.label' => ['required_with:columns', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($payload) {
            $area = Area::findOrFail($payload['area_id']);

            if (($payload['is_active'] ?? true) === true) {
                ChecklistTemplate::where('area_id', $area->id)->update(['is_active' => false]);
            }

            $template = ChecklistTemplate::create([
                'area_id' => $area->id,
                'name' => $payload['name'],
                'orientation' => 'vertical',
                'is_active' => (bool) ($payload['is_active'] ?? true),
            ]);

            $this->applyGroupsAndItems($template, $payload['groups'] ?? []);
            $this->ensureMinimumColumns($template, $payload['columns'] ?? []);

            $template->load(['area', 'groups.items', 'items', 'columns.session', 'columns.role']);
            return response()->json($this->transformTemplate($template), 201);
        });
    }

    public function update(Request $request, int $id)
    {
        $template = ChecklistTemplate::with(['runs'])->findOrFail($id);

        $payload = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'groups' => ['sometimes', 'array'],
            'groups.*.id' => ['nullable', 'integer'],
            'groups.*.title' => ['required_with:groups', 'string', 'max:255'],
            'groups.*.items' => ['sometimes', 'array'],
            'groups.*.items.*.id' => ['nullable', 'integer'],
            'groups.*.items.*.title' => ['required_with:groups.*.items', 'string'],
            'columns' => ['sometimes', 'array'],
            'columns.*.id' => ['nullable', 'integer'],
            'columns.*.label' => ['required_with:columns', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($template, $payload) {
            if (array_key_exists('name', $payload)) {
                $template->name = $payload['name'];
            }

            if (array_key_exists('is_active', $payload)) {
                $template->is_active = (bool) $payload['is_active'];
                if ($template->is_active) {
                    ChecklistTemplate::where('area_id', $template->area_id)
                        ->where('id', '!=', $template->id)
                        ->update(['is_active' => false]);
                }
            }

            $template->save();

            // Prevent structural edits if runs already exist.
            $hasRuns = $template->runs()->exists();
            if (!$hasRuns) {
                if (array_key_exists('groups', $payload)) {
                    $this->applyGroupsAndItems($template, $payload['groups'] ?? []);
                }
                if (array_key_exists('columns', $payload)) {
                    $this->applyColumns($template, $payload['columns'] ?? []);
                }
            }

            $template->load(['area', 'groups.items', 'items', 'columns.session', 'columns.role']);
            return response()->json($this->transformTemplate($template));
        });
    }

    public function destroy(int $id)
    {
        $template = ChecklistTemplate::withCount('runs')->findOrFail($id);
        if ($template->runs_count > 0) {
            return response()->json([
                'message' => 'Không thể xóa template đã có checklist runs.',
            ], 409);
        }

        DB::transaction(function () use ($template) {
            $template->delete();
        });

        return response()->noContent();
    }

    private function transformTemplate(ChecklistTemplate $template): array
    {
        $groups = $template->groups
            ->sortBy('sort_order')
            ->values()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'title' => $group->title,
                    'sort_order' => $group->sort_order,
                    'items' => $group->items
                        ->sortBy('sort_order')
                        ->values()
                        ->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'title' => $item->content,
                                'instructions' => '',
                                'is_critical' => false,
                                'sort_order' => $item->sort_order,
                            ];
                        }),
                ];
            })
            ->all();

        $ungroupedItems = $template->items
            ->whereNull('group_id')
            ->sortBy('sort_order')
            ->values();

        if ($ungroupedItems->count() > 0) {
            $groups[] = [
                'id' => null,
                'title' => 'Công việc',
                'sort_order' => 0,
                'items' => $ungroupedItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'title' => $item->content,
                        'instructions' => '',
                        'is_critical' => false,
                        'sort_order' => $item->sort_order,
                    ];
                }),
            ];
        }

        $columns = $template->columns
            ->sortBy('sort_order')
            ->values()
            ->map(function ($col) {
                $sessionTime = $col->session?->time_hhmm;
                $roleName = $col->role?->name;
                $label = trim(($sessionTime ? ($sessionTime . ' - ') : '') . ($roleName ?? ''));

                return [
                    'id' => $col->id,
                    'label' => $label !== '' ? $label : ('Cột ' . $col->id),
                    'type' => 'checkbox',
                    'options' => [],
                    'sort_order' => $col->sort_order,
                    // Keep raw ids for debugging / potential future UI usage
                    'session_id' => $col->session_id,
                    'role_id' => $col->role_id,
                ];
            })
            ->all();

        $sessions = $template->sessions
            ->sortBy('sort_order')
            ->values()
            ->map(fn($session) => [
                'id' => $session->id,
                'time_hhmm' => $session->time_hhmm,
                'sort_order' => $session->sort_order,
            ])
            ->all();

        return [
            'id' => $template->id,
            'name' => $template->name,
            'description' => null,
            'version' => 'v1',
            'is_active' => (bool) $template->is_active,
            'area' => $template->relationLoaded('area') && $template->area
                ? ['id' => $template->area->id, 'name' => $template->area->name]
                : null,
            'groups' => $groups,
            'sessions' => $sessions,
            'columns' => $columns,
        ];
    }

    private function applyGroupsAndItems(ChecklistTemplate $template, array $groupsPayload): void
    {
        // Treat a null-id group as an "ungrouped" bucket and keep items ungrouped.
        $seenItemIds = [];
        $seenGroupIds = [];

        foreach (array_values($groupsPayload) as $groupIndex => $groupData) {
            $groupId = $groupData['id'] ?? null;
            $groupTitle = $groupData['title'] ?? '';
            $items = $groupData['items'] ?? [];

            $isUngroupedBucket = $groupId === null && trim($groupTitle) === 'Công việc';

            $group = null;
            if (!$isUngroupedBucket) {
                if ($groupId) {
                    $group = TemplateGroup::where('template_id', $template->id)->where('id', $groupId)->first();
                }
                if (!$group) {
                    $group = TemplateGroup::create([
                        'template_id' => $template->id,
                        'title' => $groupTitle,
                        'sort_order' => $groupIndex,
                    ]);
                } else {
                    $group->update([
                        'title' => $groupTitle,
                        'sort_order' => $groupIndex,
                    ]);
                }
                $seenGroupIds[] = $group->id;
            }

            foreach (array_values($items) as $itemIndex => $itemData) {
                $itemId = $itemData['id'] ?? null;
                $title = $itemData['title'] ?? '';

                $item = null;
                if ($itemId) {
                    $item = TemplateItem::where('template_id', $template->id)->where('id', $itemId)->first();
                }
                if (!$item) {
                    $item = TemplateItem::create([
                        'template_id' => $template->id,
                        'group_id' => $isUngroupedBucket ? null : $group?->id,
                        'content' => $title,
                        'sort_order' => $itemIndex,
                    ]);
                } else {
                    $item->update([
                        'group_id' => $isUngroupedBucket ? null : $group?->id,
                        'content' => $title,
                        'sort_order' => $itemIndex,
                    ]);
                }
                $seenItemIds[] = $item->id;
            }
        }

        // Delete removed groups/items (safe because we block if template has runs).
        if (!empty($seenGroupIds)) {
            TemplateGroup::where('template_id', $template->id)
                ->whereNotIn('id', $seenGroupIds)
                ->delete();
        }
        if (!empty($seenItemIds)) {
            TemplateItem::where('template_id', $template->id)
                ->whereNotIn('id', $seenItemIds)
                ->delete();
        }
    }

    private function ensureMinimumColumns(ChecklistTemplate $template, array $columnsPayload): void
    {
        // Create at least one session/role/column for templates created from UI.
        if ($template->columns()->exists()) {
            return;
        }

        $label = $columnsPayload[0]['label'] ?? '08:00 - Người kiểm tra';
        $time = $this->extractTime($label) ?? '08:00';
        $roleName = str_contains(mb_strtolower($label), 'giám sát') ? 'Người giám sát' : 'Người kiểm tra';

        $session = TemplateSession::firstOrCreate(
            ['template_id' => $template->id, 'time_hhmm' => $time],
            ['sort_order' => 0]
        );
        $role = TemplateRole::firstOrCreate(
            ['template_id' => $template->id, 'name' => $roleName],
            ['sort_order' => 0]
        );

        TemplateColumn::create([
            'template_id' => $template->id,
            'session_id' => $session->id,
            'role_id' => $role->id,
            'sort_order' => 0,
        ]);
    }

    private function applyColumns(ChecklistTemplate $template, array $columnsPayload): void
    {
        // Best-effort: map label => (session_time, role_name). Do not delete existing columns.
        foreach (array_values($columnsPayload) as $idx => $colData) {
            $label = $colData['label'] ?? '';
            $time = $this->extractTime($label) ?? '08:00';
            $roleName = str_contains(mb_strtolower($label), 'giám sát') ? 'Người giám sát' : 'Người kiểm tra';

            $session = TemplateSession::firstOrCreate(
                ['template_id' => $template->id, 'time_hhmm' => $time],
                ['sort_order' => $idx]
            );
            $role = TemplateRole::firstOrCreate(
                ['template_id' => $template->id, 'name' => $roleName],
                ['sort_order' => 0]
            );

            $columnId = $colData['id'] ?? null;
            $column = null;
            if ($columnId) {
                $column = TemplateColumn::where('template_id', $template->id)->where('id', $columnId)->first();
            }
            if (!$column) {
                TemplateColumn::create([
                    'template_id' => $template->id,
                    'session_id' => $session->id,
                    'role_id' => $role->id,
                    'sort_order' => $idx,
                ]);
            } else {
                $column->update([
                    'session_id' => $session->id,
                    'role_id' => $role->id,
                    'sort_order' => $idx,
                ]);
            }
        }
    }

    private function extractTime(string $label): ?string
    {
        if (preg_match('/(\d{2}:\d{2})/', $label, $m)) {
            return $m[1];
        }
        return null;
    }
}
