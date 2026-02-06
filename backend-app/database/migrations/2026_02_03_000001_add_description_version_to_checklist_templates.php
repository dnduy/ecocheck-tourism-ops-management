<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('checklist_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('checklist_templates', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('checklist_templates', 'version')) {
                $table->string('version')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('checklist_templates', function (Blueprint $table) {
            if (Schema::hasColumn('checklist_templates', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('checklist_templates', 'version')) {
                $table->dropColumn('version');
            }
        });
    }
};
