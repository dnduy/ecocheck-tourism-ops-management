<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Tạo checklist tự động mỗi ngày (00:05)
Schedule::command('checklists:create-daily --mode=daily')
    ->dailyAt('00:05')
    ->appendOutputTo(storage_path('logs/checklist-scheduler.log'));

// Backfill cột đánh giá cho template thiếu
Artisan::command('templates:backfill-columns {--time=08:00}', function () {
    $this->call(\App\Console\Commands\BackfillTemplateColumns::class, [
        '--time' => $this->option('time'),
    ]);
})->purpose('Backfill session/column mặc định cho template thiếu cột');
