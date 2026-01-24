<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('checklist_runs', function (Blueprint $table) {
            if (!Schema::hasColumn('checklist_runs', 'work_status')) {
                $table->string('work_status')->default('pending')->after('status');
            }
            if (!Schema::hasColumn('checklist_runs', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('run_date');
            }
            if (!Schema::hasColumn('checklist_runs', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('started_at');
            }
            if (!Schema::hasColumn('checklist_runs', 'review_requested_at')) {
                $table->timestamp('review_requested_at')->nullable()->after('completed_at');
            }
            if (!Schema::hasColumn('checklist_runs', 'source_template_note')) {
                $table->text('source_template_note')->nullable()->after('review_requested_at');
            }
            if (!Schema::hasColumn('checklist_runs', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('source_template_note');
            }
            if (!Schema::hasColumn('checklist_runs', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checklist_runs', function (Blueprint $table) {
            $table->dropColumn([
                'work_status',
                'started_at',
                'completed_at',
                'review_requested_at',
                'source_template_note',
                'created_by',
                'updated_by'
            ]);
        });
    }
};
