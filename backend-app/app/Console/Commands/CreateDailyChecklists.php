<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Run;
use App\Models\ChecklistTemplate;
use App\Models\Shift;
use Carbon\Carbon;

class CreateDailyChecklists extends Command
{
    protected $signature = 'checklists:create-daily {--date=} {--days=1} {--mode=daily} {--window=30} {--force}';
    protected $description = 'Tạo checklist theo lịch (mặc định hằng ngày)';

    public function handle()
    {
        $dateOption = $this->option('date');
        $mode = strtolower((string) ($this->option('mode') ?? 'daily'));
        $days = max(1, (int) $this->option('days'));
        $windowMinutes = max(1, (int) $this->option('window'));
        $force = (bool) $this->option('force');

        $targetAreaIds = null;
        $date = $dateOption;

        if ($mode === 'shift' && !$dateOption && !$force) {
            $window = $this->resolveShiftWindow($windowMinutes);
            if (!$window['shouldRun']) {
                $this->info("⏭️  Skip: chưa tới thời điểm trước ca ({$windowMinutes} phút).");
                return 0;
            }

            $date = $window['date'];
            $targetAreaIds = $window['area_ids'];
            $days = 1;
        }

        $date = $date ?: now()->toDateString();

        $this->info("=== CREATING DAILY CHECKLISTS ===");
        $this->info("Date: $date | Days: $days | Mode: {$mode}");

        $templatesQuery = ChecklistTemplate::query()
            ->where('is_active', true)
            ->whereNotNull('area_id')
            ->orderByDesc('updated_at');

        if (is_array($targetAreaIds) && count($targetAreaIds) > 0) {
            $templatesQuery->whereIn('area_id', $targetAreaIds);
        }

        $templates = $templatesQuery->get();

        if ($templates->isEmpty()) {
            $this->warn('⚠️ Không có template đang hoạt động để tạo checklist.');
            return 0;
        }

        for ($i = 0; $i < $days; $i++) {
            $currentDate = Carbon::parse($date)->addDays($i)->toDateString();
            $this->info("\n📅 Creating checklists for: $currentDate");

            foreach ($templates as $template) {
                if (!$template) continue;
                $areaId = $template->area_id;
                if (!$areaId) continue;

                $sessions = $template->sessions()->orderBy('sort_order')->get();
                if ($sessions->isEmpty()) {
                    $sessions = collect([null]);
                }

                foreach ($sessions as $session) {
                    $sessionId = $session?->id;

                    $existsQuery = Run::where('area_id', $areaId)
                        ->where('template_id', $template->id)
                        ->whereDate('run_date', $currentDate);

                    if ($sessionId) {
                        $existsQuery->where('session_id', $sessionId);
                    } else {
                        $existsQuery->whereNull('session_id');
                    }

                    if ($existsQuery->exists()) {
                        $this->line("  ⏭️  Skip: {$template->name}" . ($session?->time_hhmm ? " ({$session->time_hhmm})" : '') . " (already exists)");
                        continue;
                    }

                    $run = Run::create([
                        'template_id' => $template->id,
                        'session_id' => $sessionId,
                        'area_id' => $areaId,
                        'run_date' => $currentDate,
                        'status' => 'open',
                        'work_status' => 'pending',
                        'assigned_to' => null,
                        'verified_by' => null,
                    ]);

                    $label = $session?->time_hhmm ? " ({$session->time_hhmm})" : '';
                    $this->line("  ✅ Created: {$template->name}{$label} (Run ID: {$run->id})");
                }
            }
        }

        $this->info("\n✅ Daily checklists created successfully!");
        return 0;
    }

    private function resolveShiftWindow(int $windowMinutes): array
    {
        $now = now();
        $shifts = Shift::query()->get();

        if ($shifts->isEmpty()) {
            return [
                'shouldRun' => true,
                'date' => $now->toDateString(),
                'area_ids' => null,
            ];
        }

        $targetDate = null;
        $targetAreaIds = [];

        foreach ($shifts as $shift) {
            if (empty($shift->start_time)) {
                continue;
            }

            $start = Carbon::createFromFormat('H:i', $shift->start_time, $now->timezone)
                ->setDate($now->year, $now->month, $now->day);

            if ($start->lessThan($now)) {
                $start = $start->addDay();
            }

            $diffMinutes = $now->diffInMinutes($start, false);
            if ($diffMinutes < 0 || $diffMinutes > $windowMinutes) {
                continue;
            }

            $targetDate = $start->toDateString();
            $areaIds = $shift->applicable_area_ids ?? [];

            if (is_array($areaIds) && count($areaIds) > 0) {
                if ($targetAreaIds !== null) {
                    $targetAreaIds = array_values(array_unique(array_merge($targetAreaIds, $areaIds)));
                }
            } else {
                $targetAreaIds = null;
                break;
            }
        }

        return [
            'shouldRun' => $targetDate !== null,
            'date' => $targetDate ?? $now->toDateString(),
            'area_ids' => $targetAreaIds,
        ];
    }
}
