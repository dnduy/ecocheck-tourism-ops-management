<?php

namespace App\Domains\Checklist\Services;

use App\Domains\Checklist\Models\Area;
use App\Domains\Checklist\Models\ChecklistTemplate;
use App\Domains\Checklist\Models\TemplateColumn;
use App\Domains\Checklist\Models\TemplateGroup;
use App\Domains\Checklist\Models\TemplateItem;
use App\Domains\Checklist\Models\TemplateRole;
use App\Domains\Checklist\Models\TemplateSession;
use Illuminate\Support\Facades\DB;

class TemplateImportService
{
    public function importFromJson(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new \Exception("File not found: {$filePath}");
        }

        $jsonContent = file_get_contents($filePath);
        $data = json_decode($jsonContent, true);

        if (!$data || !isset($data['departments'])) {
            throw new \Exception("Invalid JSON structure");
        }

        $stats = [
            'areas_created' => 0,
            'templates_created' => 0,
            'items_imported' => 0,
        ];

        DB::beginTransaction();
        try {
            foreach ($data['departments'] as $dept) {
                $this->importDepartment($dept, $stats);
            }
            
            DB::commit();
            return $stats;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function importDepartment(array $dept, array &$stats): void
    {
        // Upsert area
        $area = Area::firstOrCreate(['name' => $dept['name']]);
        $stats['areas_created']++;

        // Deactivate existing templates for this area
        ChecklistTemplate::where('area_id', $area->id)->update(['is_active' => false]);

        // Create new template
        $template = ChecklistTemplate::create([
            'area_id' => $area->id,
            'name' => $dept['sheet_name'] ?? $dept['name'],
            'orientation' => 'vertical',
            'is_active' => true,
        ]);
        $stats['templates_created']++;

        // Import sessions
        $sessions = [];
        if (isset($dept['shifts'])) {
            foreach ($dept['shifts'] as $index => $shift) {
                $session = TemplateSession::updateOrCreate(
                    [
                        'template_id' => $template->id,
                        'time_hhmm' => $shift['time'],
                    ],
                    ['sort_order' => $index]
                );
                $sessions[$shift['time']] = $session;
            }
        } elseif (isset($dept['hours'])) {
            foreach ($dept['hours'] as $index => $hour) {
                $session = TemplateSession::updateOrCreate(
                    [
                        'template_id' => $template->id,
                        'time_hhmm' => $hour,
                    ],
                    ['sort_order' => $index]
                );
                $sessions[$hour] = $session;
            }
        }

        // Import roles
        $roles = [];
        $commonRoles = ['Người kiểm tra', 'Người giám sát'];
        foreach ($commonRoles as $index => $roleName) {
            $role = TemplateRole::updateOrCreate(
                [
                    'template_id' => $template->id,
                    'name' => $roleName,
                ],
                ['sort_order' => $index]
            );
            $roles[$roleName] = $role;
        }

        // Import groups and items
        if (isset($dept['areas'])) {
            foreach ($dept['areas'] as $groupIndex => $areaData) {
                $group = TemplateGroup::create([
                    'template_id' => $template->id,
                    'title' => $areaData['name'],
                    'sort_order' => $groupIndex,
                ]);

                if (isset($areaData['items'])) {
                    foreach ($areaData['items'] as $itemIndex => $itemContent) {
                        TemplateItem::create([
                            'template_id' => $template->id,
                            'group_id' => $group->id,
                            'content' => $itemContent,
                            'sort_order' => $itemIndex,
                        ]);
                        $stats['items_imported']++;
                    }
                }
            }
        } elseif (isset($dept['sample_items'])) {
            foreach ($dept['sample_items'] as $itemIndex => $itemContent) {
                TemplateItem::create([
                    'template_id' => $template->id,
                    'group_id' => null,
                    'content' => $itemContent,
                    'sort_order' => $itemIndex,
                ]);
                $stats['items_imported']++;
            }
        } elseif (isset($dept['columns']) && is_array($dept['columns'])) {
            // Some checklists (e.g., hourly WC checks) encode check-items as columns.
            // Derive items from columns by excluding time/signature columns.
            $rawColumns = array_values(array_filter($dept['columns'], fn ($c) => is_string($c) && trim($c) !== ''));

            $derivedItems = [];
            foreach ($rawColumns as $col) {
                $normalized = trim($col);
                if ($normalized === 'Thời gian') {
                    continue;
                }
                if (stripos($normalized, 'NV') !== false) {
                    continue;
                }
                if (stripos($normalized, 'Giám sát') !== false) {
                    continue;
                }
                $derivedItems[] = $normalized;
            }

            $derivedItems = array_values(array_unique($derivedItems));
            foreach ($derivedItems as $itemIndex => $itemContent) {
                TemplateItem::create([
                    'template_id' => $template->id,
                    'group_id' => null,
                    'content' => $itemContent,
                    'sort_order' => $itemIndex,
                ]);
                $stats['items_imported']++;
            }
        }

        // Create columns (session x role combinations)
        $columnIndex = 0;
        foreach ($sessions as $session) {
            foreach ($roles as $role) {
                TemplateColumn::create([
                    'template_id' => $template->id,
                    'session_id' => $session->id,
                    'role_id' => $role->id,
                    'sort_order' => $columnIndex++,
                ]);
            }
        }
    }
}
