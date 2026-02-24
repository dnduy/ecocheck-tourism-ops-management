<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ChecklistTemplate;
use App\Models\TemplateColumn;
use App\Domains\Checklist\Models\TemplateSession;

class BackfillTemplateColumns extends Command
{
    protected $signature = 'templates:backfill-columns {--time=08:00}';
    protected $description = 'Tạo session/column mặc định cho các template thiếu cột đánh giá';

    public function handle(): int
    {
        $time = $this->option('time') ?? '08:00';

        $templates = ChecklistTemplate::query()
            ->withCount('columns')
            ->get();

        $fixed = 0;

        foreach ($templates as $template) {
            if ($template->columns_count > 0) {
                continue;
            }

            $session = TemplateSession::firstOrCreate(
                ['template_id' => $template->id, 'time_hhmm' => $time],
                ['sort_order' => 0]
            );

            TemplateColumn::create([
                'template_id' => $template->id,
                'session_id' => $session->id,
                'role_id' => null,
                'sort_order' => 0,
            ]);

            $fixed++;
            $this->line("✅ Backfilled columns for template #{$template->id} ({$template->name})");
        }

        $this->info("Hoàn tất. Đã backfill {$fixed} template.");
        return 0;
    }
}
