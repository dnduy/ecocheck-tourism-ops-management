<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Run;
use App\Models\ChecklistTemplate;
use Carbon\Carbon;

class DailyChecklistsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->info("\n=== SEEDING DAILY CHECKLISTS ===");
        
        // Template mapping to areas
        $mappings = [
            7 => 11,  // Bếp Chính → Khách sạn
            8 => 12,  // Quầy Bar → Nhà hàng
            9 => 13,  // Vệ Sinh WC → Bảo trì
            10 => 13, // Nhà 2 Tầng → Bảo trì
            11 => 12, // Bếp Quê → Nhà hàng
            12 => 12, // Nhà Hàng → Nhà hàng
            13 => 13  // Cây Xanh → Bảo trì
        ];

        $today = now()->toDateString();
        $runCount = 0;

        foreach ($mappings as $templateId => $areaId) {
            $template = ChecklistTemplate::find($templateId);
            if (!$template) {
                $this->warn("  ❌ Template $templateId not found");
                continue;
            }

            // Check if already exists today
            $exists = Run::where('template_id', $templateId)
                ->where('scheduled_for', $today)
                ->where('area_id', $areaId)
                ->exists();

            if ($exists) {
                $this->line("  ⏭️  {$template->name} (exists)");
                continue;
            }

            // Create run
            Run::create([
                'template_id' => $templateId,
                'area_id' => $areaId,
                'scheduled_for' => $today,
                'status' => 'pending',
                'assigned_to' => 1,
            ]);

            $runCount++;
            $this->line("  ✅ {$template->name}");
        }

        $this->info("\n✅ Created $runCount daily checklists for: $today\n");
    }
}
