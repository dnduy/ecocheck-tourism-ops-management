<?php

namespace App\Console\Commands;

use Illuminate\Console\SchedulingCommand;
use Illuminate\Console\Scheduling\Schedule;

class ScheduleJobs extends SchedulingCommand
{
    protected function schedule(Schedule $schedule)
    {
        // Chạy mỗi ngày lúc 00:01 để tạo checklists cho ngày hôm nay
        $schedule->command('checklists:create-daily')
            ->daily()
            ->at('00:01')
            ->appendOutputTo(storage_path('logs/checklist-scheduler.log'));
            
        // Hoặc chạy mỗi giờ (nếu muốn)
        // $schedule->command('checklists:create-daily')
        //     ->hourly()
        //     ->appendOutputTo(storage_path('logs/checklist-scheduler.log'));
    }
}
