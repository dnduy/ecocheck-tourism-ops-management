<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Checklist\Models\Area;
use App\Domains\Checklist\Models\ChecklistTemplate;
use App\Domains\Checklist\Models\TemplateSession;
use App\Domains\Checklist\Models\TemplateRole;
use App\Domains\Checklist\Models\TemplateColumn;
use App\Domains\Checklist\Models\TemplateGroup;
use App\Domains\Checklist\Models\TemplateItem;

class SmokeTestSeeder extends Seeder
{
    public function run(): void
    {
        $area = Area::firstOrCreate(['name' => 'Khu Demo']);

        $template = ChecklistTemplate::firstOrCreate(
            [
                'area_id' => $area->id,
                'name' => 'Template Smoke',
            ],
            [
                'orientation' => 'vertical',
                'is_active' => true,
                'description' => 'Template phuc vu smoke test',
                'version' => 'v1',
            ]
        );

        if (!$template->is_active) {
            $template->is_active = true;
            $template->save();
        }

        $session = TemplateSession::firstOrCreate(
            [
                'template_id' => $template->id,
                'time_hhmm' => '08:00',
            ],
            ['sort_order' => 1]
        );

        $role = TemplateRole::firstOrCreate(
            [
                'template_id' => $template->id,
                'name' => 'Nhan vien',
            ],
            ['sort_order' => 1]
        );

        TemplateColumn::firstOrCreate(
            [
                'template_id' => $template->id,
                'session_id' => $session->id,
                'role_id' => $role->id,
            ],
            ['sort_order' => 1]
        );

        $group = TemplateGroup::firstOrCreate(
            [
                'template_id' => $template->id,
                'title' => 'Kiem tra co ban',
            ],
            ['sort_order' => 1]
        );

        TemplateItem::firstOrCreate(
            [
                'template_id' => $template->id,
                'group_id' => $group->id,
                'content' => 'Kiem tra an toan',
            ],
            ['sort_order' => 1]
        );
    }
}
