<?php

namespace App\Console\Commands;

use App\Domains\Checklist\Services\TemplateImportService;
use Illuminate\Console\Command;

class ImportTemplates extends Command
{
    protected $signature = 'templates:import {--path= : Path to JSON file}';
    protected $description = 'Import checklist templates from JSON file';

    public function handle(TemplateImportService $importService): int
    {
        $path = $this->option('path') ?? base_path('checklist_structure_analysis.json');

        $this->info("Importing templates from: {$path}");

        try {
            $stats = $importService->importFromJson($path);

            $this->info('Import completed successfully!');
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Areas created/updated', $stats['areas_created']],
                    ['Templates created', $stats['templates_created']],
                    ['Items imported', $stats['items_imported']],
                ]
            );

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Import failed: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
