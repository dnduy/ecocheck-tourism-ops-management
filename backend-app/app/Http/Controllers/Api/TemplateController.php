<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTemplateRequest;
use App\Models\ChecklistTemplate;
use App\Models\Group;
use App\Models\Item;
use App\Models\TemplateColumn;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = ChecklistTemplate::with(['groups.items', 'columns'])->latest()->get();
        return response()->json($templates);
    }

    public function show(ChecklistTemplate $template): JsonResponse
    {
        $template->load(['groups.items', 'columns']);
        return response()->json($template);
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $template = ChecklistTemplate::create([
            'name' => $request->name,
            'description' => $request->description ?? null,
            'version' => $request->version ?? 'v1',
            'is_active' => $request->is_active ?? true,
        ]);

        // Create groups/items if provided
        if (is_array($request->groups)) {
            $sort = 1;
            foreach ($request->groups as $g) {
                $group = Group::create([
                    'checklist_template_id' => $template->id,
                    'title' => $g['title'] ?? 'Nhóm',
                    'sort_order' => $sort++,
                ]);
                $itemSort = 1;
                foreach (($g['items'] ?? []) as $i) {
                    Item::create([
                        'group_id' => $group->id,
                        'title' => $i['title'] ?? 'Hạng mục',
                        'instructions' => $i['instructions'] ?? null,
                        'sort_order' => $itemSort++,
                    ]);
                }
            }
        }

        // Create columns if provided
        if (is_array($request->columns)) {
            $colSort = 1;
            foreach ($request->columns as $c) {
                TemplateColumn::create([
                    'checklist_template_id' => $template->id,
                    'label' => $c['label'] ?? 'Cột',
                    'type' => $c['type'] ?? 'text',
                    'options' => $c['options'] ?? [],
                    'sort_order' => $colSort++,
                ]);
            }
        }
        
        $template->load(['groups.items', 'columns']);
        return response()->json($template, 201);
    }

    public function update(StoreTemplateRequest $request, ChecklistTemplate $template): JsonResponse
    {
        return DB::transaction(function () use ($request, $template) {
            $data = [
                'name' => $request->name,
            ];
            if ($request->has('description')) {
                $data['description'] = $request->description;
            }
            if ($request->has('is_active')) {
                $data['is_active'] = (bool) $request->is_active;
            }
            $template->update($data);

            // Update groups/items if provided
            if ($request->has('groups') && is_array($request->groups)) {
                $payloadGroups = $request->groups;
                $existingGroups = $template->groups()->get()->keyBy('id');

                $seenGroupIds = [];
                $sort = 1;
                foreach ($payloadGroups as $g) {
                    $groupId = $g['id'] ?? null;
                    if ($groupId && $existingGroups->has($groupId)) {
                        $group = $existingGroups->get($groupId);
                        $group->update([
                            'title' => $g['title'] ?? $group->title,
                            'sort_order' => $sort++,
                        ]);
                    } else {
                        $group = Group::create([
                            'checklist_template_id' => $template->id,
                            'title' => $g['title'] ?? 'Nhóm',
                            'sort_order' => $sort++,
                        ]);
                    }
                    $seenGroupIds[] = $group->id;

                    // Items upsert
                    $existingItems = $group->items()->get()->keyBy('id');
                    $seenItemIds = [];
                    $itemSort = 1;
                    foreach (($g['items'] ?? []) as $i) {
                        $itemId = $i['id'] ?? null;
                        if ($itemId && $existingItems->has($itemId)) {
                            $item = $existingItems->get($itemId);
                            $item->update([
                                'title' => $i['title'] ?? $item->title,
                                'instructions' => $i['instructions'] ?? $item->instructions,
                                'sort_order' => $itemSort++,
                            ]);
                        } else {
                            $item = Item::create([
                                'group_id' => $group->id,
                                'title' => $i['title'] ?? 'Hạng mục',
                                'instructions' => $i['instructions'] ?? null,
                                'sort_order' => $itemSort++,
                            ]);
                        }
                        $seenItemIds[] = $item->id;
                    }
                    // Delete items not present
                    $group->items()->whereNotIn('id', $seenItemIds)->delete();
                }
                // Delete groups not present
                $template->groups()->whereNotIn('id', $seenGroupIds)->delete();
            }

            // Update columns if provided (replace all for simplicity)
            if ($request->has('columns') && is_array($request->columns)) {
                $template->columns()->delete();
                $colSort = 1;
                foreach ($request->columns as $c) {
                    TemplateColumn::create([
                        'checklist_template_id' => $template->id,
                        'label' => $c['label'] ?? 'Cột',
                        'type' => $c['type'] ?? 'text',
                        'options' => $c['options'] ?? [],
                        'sort_order' => $colSort++,
                    ]);
                }
            }

            $template->load(['groups.items', 'columns']);
            return response()->json($template);
        });
    }

    public function destroy(ChecklistTemplate $template): JsonResponse
    {
        // Deleting a template will cascade delete groups/items/columns and runs
        $template->delete();
        return response()->json(null, 204);
    }
}
