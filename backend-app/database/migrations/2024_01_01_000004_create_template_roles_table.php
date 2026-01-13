<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('checklist_templates')->onDelete('cascade');
            $table->string('name'); // e.g., "Người kiểm tra", "Người giám sát"
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->unique(['template_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_roles');
    }
};
