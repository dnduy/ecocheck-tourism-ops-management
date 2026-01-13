<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklist_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('checklist_templates')->onDelete('cascade');
            $table->foreignId('area_id')->constrained()->onDelete('cascade');
            $table->date('run_date');
            $table->enum('status', ['open', 'done'])->default('open');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->unique(['area_id', 'run_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_runs');
    }
};
