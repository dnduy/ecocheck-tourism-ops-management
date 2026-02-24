<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function indexExists(string $table, string $indexName): bool
    {
        $rows = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return !empty($rows);
    }

    public function up(): void
    {
        Schema::table('checklist_runs', function (Blueprint $table) {
            if (!Schema::hasColumn('checklist_runs', 'session_id')) {
                $table->foreignId('session_id')
                    ->nullable()
                    ->after('template_id')
                    ->constrained('template_sessions')
                    ->nullOnDelete();
            }
        });

        // Ensure area_id has its own index so dropping the old unique won't break FK requirements.
        if (!$this->indexExists('checklist_runs', 'checklist_runs_area_id_index')) {
            Schema::table('checklist_runs', function (Blueprint $table) {
                $table->index('area_id', 'checklist_runs_area_id_index');
            });
        }

        // Drop old unique (area_id + run_date) to allow multiple checklists per day.
        if ($this->indexExists('checklist_runs', 'checklist_runs_area_id_run_date_unique')) {
            DB::statement('ALTER TABLE `checklist_runs` DROP INDEX `checklist_runs_area_id_run_date_unique`');
        }

        // New unique: area + date + template + session
        if (!$this->indexExists('checklist_runs', 'checklist_runs_area_date_template_session_unique')) {
            Schema::table('checklist_runs', function (Blueprint $table) {
                $table->unique(
                    ['area_id', 'run_date', 'template_id', 'session_id'],
                    'checklist_runs_area_date_template_session_unique'
                );
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('checklist_runs', 'checklist_runs_area_date_template_session_unique')) {
            Schema::table('checklist_runs', function (Blueprint $table) {
                $table->dropUnique('checklist_runs_area_date_template_session_unique');
            });
        }

        if (!$this->indexExists('checklist_runs', 'checklist_runs_area_id_run_date_unique')) {
            Schema::table('checklist_runs', function (Blueprint $table) {
                $table->unique(['area_id', 'run_date'], 'checklist_runs_area_id_run_date_unique');
            });
        }

        if (Schema::hasColumn('checklist_runs', 'session_id')) {
            Schema::table('checklist_runs', function (Blueprint $table) {
                $table->dropConstrainedForeignId('session_id');
            });
        }
    }
};
