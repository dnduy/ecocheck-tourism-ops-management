<?php

namespace App\Services;

use App\Interfaces\TemplateServiceInterface;
use App\Interfaces\Repositories\TemplateRepositoryInterface;
use App\Models\ChecklistTemplate;
use App\Models\Area;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TemplateService implements TemplateServiceInterface
{
    protected $templateRepository;

    public function __construct(TemplateRepositoryInterface $templateRepository)
    {
        $this->templateRepository = $templateRepository;
    }

    public function getAllTemplates(): Collection
    {
        return $this->templateRepository->getAll();
    }

    public function getTemplate(ChecklistTemplate $template): ChecklistTemplate
    {
        return $this->templateRepository->loadRelations($template);
    }

    public function createTemplate(array $data): ChecklistTemplate
    {
        return DB::transaction(function () use ($data) {
            $areaId = $data['area_id'] ?? Area::query()->value('id');
            if (!$areaId) {
                throw new \InvalidArgumentException('Không tìm thấy khu vực để gắn template.');
            }

            $template = $this->templateRepository->create([
                'area_id' => $areaId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'version' => $data['version'] ?? 'v1',
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Groups and Items
            if (isset($data['groups']) && is_array($data['groups'])) {
                $sort = 1;
                foreach ($data['groups'] as $g) {
                    $group = $this->templateRepository->createGroup([
                        'checklist_template_id' => $template->id,
                        'title' => $g['title'] ?? 'Nhóm',
                        'sort_order' => $sort++,
                    ]);

                    $itemSort = 1;
                    foreach (($g['items'] ?? []) as $i) {
                        $this->templateRepository->createItem([
                            'group_id' => $group->id,
                            'title' => $i['title'] ?? 'Hạng mục',
                            'instructions' => $i['instructions'] ?? null,
                            'sort_order' => $itemSort++,
                        ]);
                    }
                }
            }

            // Columns
            if (isset($data['columns']) && is_array($data['columns'])) {
                $colSort = 1;
                foreach ($data['columns'] as $c) {
                    $this->templateRepository->createColumn([
                        'checklist_template_id' => $template->id,
                        'label' => $c['label'] ?? 'Cột',
                        'type' => $c['type'] ?? 'text',
                        'options' => $c['options'] ?? [],
                        'sort_order' => $colSort++,
                    ]);
                }
            }

            return $this->templateRepository->loadRelations($template);
        });
    }

    public function updateTemplate(ChecklistTemplate $template, array $data): ChecklistTemplate
    {
        return DB::transaction(function () use ($template, $data) {
            $updateData = ['name' => $data['name']];
            if (isset($data['description']))
                $updateData['description'] = $data['description'];
            if (isset($data['is_active']))
                $updateData['is_active'] = (bool) $data['is_active'];

            $this->templateRepository->update($template, $updateData);

            // Groups Logic
            if (isset($data['groups']) && is_array($data['groups'])) {
                $existingGroups = $template->groups()->get()->keyBy('id');
                $seenGroupIds = [];
                $sort = 1;

                foreach ($data['groups'] as $g) {
                    $groupId = $g['id'] ?? null;
                    if ($groupId && $existingGroups->has($groupId)) {
                        $group = $existingGroups->get($groupId);
                        $this->templateRepository->updateGroup($group, [
                            'title' => $g['title'] ?? $group->title,
                            'sort_order' => $sort++,
                        ]);
                    } else {
                        $group = $this->templateRepository->createGroup([
                            'checklist_template_id' => $template->id,
                            'title' => $g['title'] ?? 'Nhóm',
                            'sort_order' => $sort++,
                        ]);
                    }
                    $seenGroupIds[] = $group->id;

                    // Items Logic
                    $existingItems = $group->items()->get()->keyBy('id');
                    $seenItemIds = [];
                    $itemSort = 1;

                    foreach (($g['items'] ?? []) as $i) {
                        $itemId = $i['id'] ?? null;
                        if ($itemId && $existingItems->has($itemId)) {
                            $item = $existingItems->get($itemId);
                            $this->templateRepository->updateItem($item, [
                                'title' => $i['title'] ?? $item->title,
                                'instructions' => $i['instructions'] ?? $item->instructions,
                                'sort_order' => $itemSort++,
                            ]);
                        } else {
                            $item = $this->templateRepository->createItem([
                                'group_id' => $group->id,
                                'title' => $i['title'] ?? 'Hạng mục',
                                'instructions' => $i['instructions'] ?? null,
                                'sort_order' => $itemSort++,
                            ]);
                        }
                        $seenItemIds[] = $item->id;
                    }
                    $this->templateRepository->deleteItemsNotIn($group, $seenItemIds);
                }
                $this->templateRepository->deleteGroupsNotIn($template, $seenGroupIds);
            }

            // Columns Logic (Full Replace)
            if (isset($data['columns']) && is_array($data['columns'])) {
                $this->templateRepository->deleteColumns($template);
                $colSort = 1;
                foreach ($data['columns'] as $c) {
                    $this->templateRepository->createColumn([
                        'checklist_template_id' => $template->id,
                        'label' => $c['label'] ?? 'Cột',
                        'type' => $c['type'] ?? 'text',
                        'options' => $c['options'] ?? [],
                        'sort_order' => $colSort++,
                    ]);
                }
            }

            return $this->templateRepository->loadRelations($template);
        });
    }

    public function deleteTemplate(ChecklistTemplate $template): void
    {
        $this->templateRepository->delete($template);
    }

    public function importTemplate(array $data, $file): \Illuminate\Support\Collection
    {
        return DB::transaction(function () use ($data, $file) {
            $sheets = \Maatwebsite\Excel\Facades\Excel::toCollection(new \App\Imports\TemplateImport, $file);
            $createdTemplates = collect();

            foreach ($sheets as $index => $rows) {
                if ($rows->isEmpty())
                    continue;

                // 1. Determine Template Name (Naive: Sheet Index + 1)
                // Ideally we would get the Sheet Name from Excel, but toCollection doesn't give it easily.
                // We rely on the user to rename them later if needed, or scan the first row for a Title.
                $titleRow = $rows->first();
                // Find first non-empty string in first row
                $sheetTitle = 'Template ' . ($index + 1);
                foreach ($titleRow as $cell) {
                    if (is_string($cell) && !empty(trim($cell))) {
                        $sheetTitle = trim($cell);
                        // Clean up "CHECK LIST..." prefix if present
                        $sheetTitle = preg_replace('/^(CHECK\s*LIST|Checklist)\s*/i', '', $sheetTitle);
                        // Remove "NGAY..." if present
                        $sheetTitle = preg_replace('/[-\s]*NGÀY.*$/i', '', $sheetTitle);
                        break;
                    }
                }

                // If user provided a name, only use it for the first sheet if it's a single sheet file? 
                // But here we have multiple. Let's append index if needed, or just use detected title.
                $finalName = mb_substr($sheetTitle, 0, 250);

                $areaId = $data['area_id'] ?? Area::query()->value('id');
                if (!$areaId) {
                    throw new \InvalidArgumentException('Không tìm thấy khu vực để gắn template.');
                }

                $template = $this->templateRepository->create([
                    'area_id' => $areaId,
                    'name' => $finalName,
                    'description' => 'Imported Checkist',
                    'version' => 'v1',
                    'is_active' => true,
                ]);

                // 2. Create Default Group
                $group = $this->templateRepository->createGroup([
                    'checklist_template_id' => $template->id,
                    'title' => 'Nội dung kiểm tra',
                    'sort_order' => 1,
                ]);

                // 3. Find Header Row ("STT")
                $headerRowIndex = -1;
                $itemColKey = '1'; // Default based on inspection

                foreach ($rows as $rIdx => $row) {
                    foreach ($row as $key => $val) {
                        // Check for "STT"
                        if (is_string($val) && strtoupper(trim($val)) === 'STT') {
                            $headerRowIndex = $rIdx;
                            break 2;
                        }
                    }
                }

                // 4. Import Items
                // If header found, start from next row. If not, start from row 0? 
                // Inspection showed data starts at row 2 (index 2) where STT is 1.
                // Header was at index 0 (row 1).

                $startRow = $headerRowIndex !== -1 ? $headerRowIndex + 1 : 0;
                $rowsToProcess = $rows->slice($startRow);

                $sortItem = 1;
                foreach ($rowsToProcess as $row) {
                    // Item Title Logic: content of col '1' or 'noi_dung' or 'vi_tri...'
                    $itemTitle = $row['1'] ?? $row['noi_dung'] ?? $row['vi_tri_can_kiem_tra'] ?? null;

                    // Cleanup: if title is too short or looks like a header (e.g. contains "STT" again), skip
                    if (!$itemTitle || strlen($itemTitle) < 2 || $itemTitle === 'STT')
                        continue;

                    $this->templateRepository->createItem([
                        'group_id' => $group->id,
                        'title' => $itemTitle,
                        'sort_order' => $sortItem++,
                    ]);
                }

                // Add Standard Columns
                $this->templateRepository->createColumn(['checklist_template_id' => $template->id, 'label' => 'Đánh giá', 'type' => 'pass_fail', 'sort_order' => 1]);
                $this->templateRepository->createColumn(['checklist_template_id' => $template->id, 'label' => 'Ghi chú', 'type' => 'text', 'sort_order' => 2]);

                $createdTemplates->push($template);
            }

            return $createdTemplates;
        });
    }
}
