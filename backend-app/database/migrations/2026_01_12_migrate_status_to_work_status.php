<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Migrate old status values to new work_status values
     * Chuyển đổi dữ liệu cũ từ status sang work_status
     * 
     * Old status mapping:
     * - 'draft' / 'pending' → work_status: 'pending'
     * - 'in_progress' → work_status: 'in_progress'
     * - 'completed' → work_status: 'completed'
     * - 'reviewed' → work_status: 'approved'
     */
    public function up(): void
    {
        // Update work_status based on old status field
        DB::table('runs')->update([
            'work_status' => DB::raw("CASE 
                WHEN status IN ('draft', 'pending') THEN 'pending'
                WHEN status = 'in_progress' THEN 'in_progress'
                WHEN status = 'completed' THEN 'completed'
                WHEN status = 'reviewed' THEN 'approved'
                ELSE 'pending'
            END")
        ]);

        // Set review_requested_at for runs that need review or are already approved
        DB::table('runs')
            ->whereIn('work_status', ['needs_review', 'approved', 'rejected'])
            ->whereNull('review_requested_at')
            ->update([
                'review_requested_at' => DB::raw('completed_at')
            ]);

        echo "✅ Migrated " . DB::table('runs')->count() . " runs from status to work_status\n";
    }

    /**
     * Reverse the migration
     */
    public function down(): void
    {
        // Reset work_status to default
        DB::table('runs')->update([
            'work_status' => 'pending',
            'review_requested_at' => null
        ]);
    }
};
