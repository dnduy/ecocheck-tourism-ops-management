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
            $table->string('work_status')->default('pending')->after('status');
            $table->timestamp('started_at')->nullable()->after('run_date');
            $table->timestamp('completed_at')->nullable()->after('started_at');
            $table->timestamp('review_requested_at')->nullable()->after('completed_at');
            $table->text('source_template_note')->nullable()->after('review_requested_at');
            $table->unsignedBigInteger('created_by')->nullable()->after('source_template_note');
            $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');

            // Fix existing columns if needed (optional, assuming they exist from previous check)
            // $table->renameColumn('checklist_template_id', 'template_id'); // If mapping was wrong
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
