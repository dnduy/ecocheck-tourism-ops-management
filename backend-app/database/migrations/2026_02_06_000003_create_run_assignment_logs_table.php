<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('run_assignment_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('run_id')->constrained('checklist_runs')->onDelete('cascade');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('previous_assigned_to')->nullable();
            $table->unsignedBigInteger('new_assigned_to')->nullable();
            $table->unsignedBigInteger('previous_verified_by')->nullable();
            $table->unsignedBigInteger('new_verified_by')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index('run_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('run_assignment_logs');
    }
};
