<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('checklist_templates')->onDelete('cascade');
            $table->string('time_hhmm', 5); // HH:MM format
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->unique(['template_id', 'time_hhmm']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_sessions');
    }
};
