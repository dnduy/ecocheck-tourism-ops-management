<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->onDelete('cascade');
            $table->foreignId('run_id')->nullable()->constrained('checklist_runs')->onDelete('set null');
            $table->string('title');
            $table->text('description');
            $table->enum('severity', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'resolved'])->default('open');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->text('resolution_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
