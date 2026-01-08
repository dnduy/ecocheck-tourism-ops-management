<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use App\Models\ChecklistTemplate;
use App\Models\Group;
use App\Models\Item;
use App\Models\TemplateColumn;
use Illuminate\Support\Facades\DB;

class ImportTemplatesCommand extends Command
{
    protected $signature = 'ecocheck:import-templates {file=storage/app/templates.json}';
    protected $description = 'Import checklist templates from a JSON file';

    public function handle(): int
    {
        $path = $this->argument('file');
        if (!File::exists($path)) {
            $this->error("File not found: {$path}");
            return self::FAILURE;
        }

        $payload = json_decode(File::get($path), true);
        if (!is_array($payload)) {
            $this->error('Invalid JSON');
            return self::FAILURE;
        }

        DB::transaction(function () use ($payload) {
            foreach ($payload as $templateData) {
                $template = ChecklistTemplate::firstOrCreate(
                    ['name' => $templateData['name']],
                    [
                        'description' => $templateData['description'] ?? null,
                        'version' => $templateData['version'] ?? 'v1',
                        'is_active' => $templateData['is_active'] ?? true,
                    ]
                );

                foreach ($templateData['groups'] ?? [] as $gIndex => $groupData) {
                    $group = Group::firstOrCreate(
                        [
                            'checklist_template_id' => $template->id,
                            'title' => $groupData['title'],
                        ],
                        [
                            'sort_order' => $gIndex + 1,
                        ]
                    );

                    foreach ($groupData['items'] ?? [] as $iIndex => $itemData) {
                        Item::firstOrCreate(
                            [
                                'group_id' => $group->id,
                                'title' => $itemData['title'],
                            ],
                            [
                                'instructions' => $itemData['instructions'] ?? null,
                                'sort_order' => $iIndex + 1,
                            ]
                        );
                    }
                }

                foreach ($templateData['columns'] ?? [] as $cIndex => $colData) {
                    TemplateColumn::firstOrCreate(
                        [
                            'checklist_template_id' => $template->id,
                            'label' => $colData['label'],
                        ],
                        [
                            'type' => $colData['type'] ?? 'text',
                            'options' => $colData['options'] ?? null,
                            'sort_order' => $cIndex + 1,
                        ]
                    );
                }
            }
        });

        $this->info('Templates imported');
        return self::SUCCESS;
    }
}
