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
        Schema::table('run_signoffs', function (Blueprint $table) {
            // Nullable changes (Safe to run multiple times usually, but check existence first)
            if (Schema::hasColumn('run_signoffs', 'session_id')) {
                $table->unsignedBigInteger('session_id')->nullable()->change();
            }
            if (Schema::hasColumn('run_signoffs', 'role_id')) {
                $table->unsignedBigInteger('role_id')->nullable()->change();
            }
            if (Schema::hasColumn('run_signoffs', 'signed_by')) {
                $table->unsignedBigInteger('signed_by')->nullable()->change();
            }

            // New Columns
            if (!Schema::hasColumn('run_signoffs', 'role')) {
                $table->string('role')->after('run_id'); // e.g. 'supervisor'
            }
            if (!Schema::hasColumn('run_signoffs', 'user_id')) {
                $table->unsignedBigInteger('user_id')->after('role');
            }
            if (!Schema::hasColumn('run_signoffs', 'review_status')) {
                $table->string('review_status')->nullable()->after('signed_at'); // e.g. 'approved', 'rejected'
            }
            if (!Schema::hasColumn('run_signoffs', 'review_note')) {
                $table->text('review_note')->nullable()->after('review_status');
            }
            if (!Schema::hasColumn('run_signoffs', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('review_note');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('run_signoffs', function (Blueprint $table) {
            $table->dropColumn(['role', 'user_id', 'review_status', 'review_note', 'reviewed_at']);
            // Reverting nullable changes is tricky/risky without knowing original constraints, skip for now or set nullable.
        });
    }
};
