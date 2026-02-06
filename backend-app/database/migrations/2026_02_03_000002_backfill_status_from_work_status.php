<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('checklist_runs')) {
            return;
        }

        if (!Schema::hasColumn('checklist_runs', 'status') || !Schema::hasColumn('checklist_runs', 'work_status')) {
            return;
        }

        DB::table('checklist_runs')->update([
            'status' => DB::raw("CASE WHEN work_status IN ('completed','needs_review','approved') THEN 'done' ELSE 'open' END"),
        ]);
    }

    public function down(): void
    {
        // no-op: status is legacy mirror; nothing to rollback safely.
    }
};
