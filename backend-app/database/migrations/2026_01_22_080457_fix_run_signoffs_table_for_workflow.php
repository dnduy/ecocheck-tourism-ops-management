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
            $table->unsignedBigInteger('session_id')->nullable()->change();
            $table->unsignedBigInteger('role_id')->nullable()->change();
            $table->unsignedBigInteger('signed_by')->nullable()->change();

            $table->string('role')->after('run_id'); // e.g. 'supervisor'
            $table->unsignedBigInteger('user_id')->after('role');
            $table->string('review_status')->nullable()->after('signed_at'); // e.g. 'approved', 'rejected'
            $table->text('review_note')->nullable()->after('review_status');
            $table->timestamp('reviewed_at')->nullable()->after('review_note');
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
