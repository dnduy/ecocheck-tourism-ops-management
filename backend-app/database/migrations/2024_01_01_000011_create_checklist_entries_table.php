<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklist_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('run_id')->constrained('checklist_runs')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('template_items')->onDelete('cascade');
            $table->foreignId('column_id')->constrained('template_columns')->onDelete('cascade');
            $table->enum('value', ['ok', 'not_ok', 'na', ''])->default('');
            $table->text('note')->nullable();
            $table->string('photo_url')->nullable();
            $table->foreignId('checked_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('checked_at')->nullable();
            $table->timestamps();
            
            $table->unique(['run_id', 'item_id', 'column_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_entries');
    }
};
