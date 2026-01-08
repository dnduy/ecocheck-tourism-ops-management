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
    public function show(ChecklistTemplate $template): JsonResponse
    {
        $template->load(['groups.items', 'columns' => function ($q) {
            $q->orderBy('sort_order');
        }]);
        return response()->json($template);
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            $template = ChecklistTemplate::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'version' => $data['version'] ?? 'v1',
                'is_active' => $data['is_active'] ?? true,
            ]);

            $order = 1;
            foreach ($data['groups'] as $groupData) {
                $group = Group::create([
                    'checklist_template_id' => $template->id,
                    'title' => $groupData['title'],
                    'sort_order' => $order++,
                ]);

                $itemOrder = 1;
                foreach ($groupData['items'] as $itemData) {
                    Item::create([
                        'group_id' => $group->id,
                        'title' => $itemData['title'],
                        'instructions' => $itemData['instructions'] ?? null,
                        'sort_order' => $itemOrder++,
                    ]);
                }
            }

            $colOrder = 1;
            foreach ($data['columns'] as $columnData) {
                TemplateColumn::create([
                    'checklist_template_id' => $template->id,
                    'label' => $columnData['label'],
                    'type' => $columnData['type'] ?? 'text',
                    'options' => $columnData['options'] ?? null,
                    'sort_order' => $colOrder++,
                ]);
            }

            return response()->json($template->load(['groups.items', 'columns']), 201);
        });
    }
}
