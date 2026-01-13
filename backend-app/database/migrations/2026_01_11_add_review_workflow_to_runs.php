<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Thêm cột để track review workflow rõ ràng
        Schema::table('runs', function (Blueprint $table) {
            // Status flow: draft → pending → in_progress → completed → needs_review → approved/rejected
            $table->string('work_status')->default('pending')->comment('pending, in_progress, completed, needs_review, approved, rejected');
            $table->timestamp('started_at')->nullable()->change();
            $table->timestamp('completed_at')->nullable()->change();
            
            // Review tracking
            $table->timestamp('review_requested_at')->nullable();
            $table->text('source_template_note')->nullable()->comment('Ghi chú: Copy từ template ngày nào');
        });

        Schema::table('signoffs', function (Blueprint $table) {
            // Track review status rõ ràng
            $table->string('review_status')->default('pending')->comment('pending, approved, rejected');
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('runs', function (Blueprint $table) {
            $table->dropColumn(['work_status', 'review_requested_at', 'source_template_note']);
        });

        Schema::table('signoffs', function (Blueprint $table) {
            $table->dropColumn(['review_status', 'review_note', 'reviewed_at']);
        });
    }
};
