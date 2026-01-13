<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Run;
use App\Models\ChecklistTemplate;
use Carbon\Carbon;

class CreateDailyChecklists extends Command
{
    protected $signature = 'checklists:create-daily {--date=} {--days=1}';
    protected $description = 'Tạo daily checklists cho tất cả templates từ areas';

    public function handle()
    {
        $date = $this->option('date') ?? now()->toDateString();
        $days = (int) $this->option('days');
        
        // Các template ID chính (Bếp, Bar, WC, v.v.)
        $templateIds = [7, 8, 9, 10, 11, 12, 13];
        
        // Các areas chính
        $areas = [
            11 => 'Khách sạn',   // area_id: 11
            12 => 'Nhà hàng',    // area_id: 12
            13 => 'Bảo trì'      // area_id: 13
        ];

        $this->info("=== CREATING DAILY CHECKLISTS ===");
        $this->info("Date: $date | Days: $days");
        
        for ($i = 0; $i < $days; $i++) {
            $currentDate = Carbon::parse($date)->addDays($i)->toDateString();
            $this->info("\n📅 Creating checklists for: $currentDate");
            
            foreach ($templateIds as $templateId) {
                $template = ChecklistTemplate::find($templateId);
                if (!$template) continue;
                
                // Map template to area
                $areaId = $this->getAreaForTemplate($templateId);
                if (!$areaId) continue;
                
                // Check if already exists
                $exists = Run::where('checklist_template_id', $templateId)
                    ->where('scheduled_for', $currentDate)
                    ->where('area_id', $areaId)
                    ->exists();
                
                if ($exists) {
                    $this->line("  ⏭️  Skip: {$template->name} (already exists)");
                    continue;
                }
                
                // Create run
                $run = Run::create([
                    'checklist_template_id' => $templateId,
                    'area_id' => $areaId,
                    'scheduled_for' => $currentDate,
                    'status' => 'pending',
                    'assigned_to' => 1, // Admin/Manager by default
                ]);
                
                $this->line("  ✅ Created: {$template->name} (Run ID: {$run->id})");
            }
        }
        
        $this->info("\n✅ Daily checklists created successfully!");
    }

    private function getAreaForTemplate($templateId): ?int
    {
        $mapping = [
            7 => 11,  // Bếp Chính → Khách sạn
            8 => 12,  // Quầy Bar → Nhà hàng
            9 => 13,  // Vệ Sinh WC → Bảo trì
            10 => 13, // Nhà 2 Tầng → Bảo trì
            11 => 12, // Bếp Quê → Nhà hàng
            12 => 12, // Nhà Hàng → Nhà hàng
            13 => 13  // Cây Xanh → Bảo trì
        ];
        
        return $mapping[$templateId] ?? null;
    }
}
