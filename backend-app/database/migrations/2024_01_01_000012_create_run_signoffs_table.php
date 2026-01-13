<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('run_signoffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('run_id')->constrained('checklist_runs')->onDelete('cascade');
            $table->foreignId('session_id')->constrained('template_sessions')->onDelete('cascade');
            $table->foreignId('role_id')->nullable()->constrained('template_roles')->onDelete('set null');
            $table->foreignId('signed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('signed_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('run_signoffs');
    }
};
