<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Area;
use App\Models\ChecklistTemplate;
use App\Models\Group;
use App\Models\Item;
use App\Models\Run;
use App\Models\Entry;
use App\Models\Signoff;
use App\Models\TemplateColumn;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;

class DemoDataSeeder extends Seeder
{
    public function run()
    {
        // 1. Create Users
        $this->command->info('Creating Users...');

        Role::findOrCreate('admin', 'sanctum');
        Role::findOrCreate('manager', 'sanctum');
        Role::findOrCreate('supervisor', 'sanctum');
        Role::findOrCreate('staff', 'sanctum');

        $admin = User::firstOrCreate(
            ['email' => 'admin@ecocheck.com'],
            ['name' => 'System Admin', 'password' => Hash::make('password')]
        );
        $admin->syncRoles(['admin']);

        $manager = User::firstOrCreate(
            ['email' => 'manager@ecocheck.com'],
            ['name' => 'Operations Manager', 'password' => Hash::make('password')]
        );
        $manager->syncRoles(['manager']);

        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor@ecocheck.com'],
            ['name' => 'Shift Supervisor', 'password' => Hash::make('password')]
        );
        $supervisor->syncRoles(['supervisor']);

        $staff = User::firstOrCreate(
            ['email' => 'staff@ecocheck.com'],
            ['name' => 'Staff User', 'password' => Hash::make('password')]
        );
        $staff->syncRoles(['staff']);

        // 2. Create Area
        $this->command->info('Creating Area...');
        $area = Area::firstOrCreate(['name' => 'Lobby Area']);

        // 3. Create Template (Clean Slate)
        $this->command->info('Creating Template...');
        $existingTemplate = ChecklistTemplate::where('name', 'Daily Operation Checklist')->where('area_id', $area->id)->first();
        if ($existingTemplate) {
            $existingTemplate->delete();
            // Also explicitly delete children if cascade isn't set up, but let's assume cascade or manually delete for safety
            DB::table('template_sessions')->where('template_id', $existingTemplate->id)->delete();
            DB::table('template_columns')->where('template_id', $existingTemplate->id)->delete();
            DB::table('template_groups')->where('template_id', $existingTemplate->id)->delete();
            DB::table('template_items')->where('template_id', $existingTemplate->id)->delete();
            // Runs are deleted below by date range? No, runs link to template. If template deleted, runs might be orphaned or deleted.
            // We delete runs by date range later, but they might be gone already.
        }

        $template = ChecklistTemplate::create([
            'name' => 'Daily Operation Checklist',
            'area_id' => $area->id,
            'is_active' => true
        ]);

        // 4. Create Session
        $sessionId = DB::table('template_sessions')->insertGetId([
            'template_id' => $template->id,
            'time_hhmm' => '08:00',
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. Create Columns
        TemplateColumn::create(['template_id' => $template->id, 'session_id' => $sessionId, 'sort_order' => 1]); // Result
        TemplateColumn::create(['template_id' => $template->id, 'session_id' => $sessionId, 'sort_order' => 2]); // Note

        $columnResult = $template->columns()->where('sort_order', 1)->first();

        // 6. Create Groups and Items
        $group = Group::create(['template_id' => $template->id, 'title' => 'General Area', 'sort_order' => 1]);
        Item::create(['template_id' => $template->id, 'group_id' => $group->id, 'content' => 'Check Lighting', 'sort_order' => 1]);
        Item::create(['template_id' => $template->id, 'group_id' => $group->id, 'content' => 'Check Cleanliness', 'sort_order' => 2]);
        Item::create(['template_id' => $template->id, 'group_id' => $group->id, 'content' => 'Check Safety', 'sort_order' => 3]);

        $items = $template->groups->flatMap->items;

        // 7. Generate 30 Days History
        $startDate = Carbon::create(2025, 12, 23);
        $endDate = Carbon::today();

        $this->command->info("Generating data from {$startDate->toDateString()} to {$endDate->toDateString()}");

        // Clean up data
        $this->command->info("Cleaning up existing runs...");
        Run::where('area_id', $area->id)
            ->whereDate('run_date', '>=', $startDate)
            ->whereDate('run_date', '<=', $endDate)
            ->delete();

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $rand = rand(1, 100);

            // Default attributes
            $runData = [
                'template_id' => $template->id,
                'area_id' => $area->id,
                'run_date' => $date->format('Y-m-d'),
                'created_by' => $admin->id,
                'created_at' => $date->copy()->setTime(8, 0, 0),
                'updated_at' => $date->copy()->setTime(17, 0, 0),
                'assigned_to' => $staff->id,
            ];

            // Determine status
            if ($rand <= 70) {
                $status = 'open';
                $workStatus = 'approved';
                $verifiedBy = $manager->id;
                $startedAt = $date->copy()->setTime(9, 0);
                $completedAt = $date->copy()->setTime(10, 30);
                $reviewRequestedAt = $date->copy()->setTime(10, 35);
            } elseif ($rand <= 80) {
                $status = 'open';
                $workStatus = 'rejected';
                $verifiedBy = $manager->id;
                $startedAt = $date->copy()->setTime(9, 0);
                $completedAt = $date->copy()->setTime(10, 30);
                $reviewRequestedAt = $date->copy()->setTime(10, 35);
            } elseif ($rand <= 90) {
                $status = 'open';
                $workStatus = 'needs_review';
                $verifiedBy = null;
                $startedAt = $date->copy()->setTime(9, 0);
                $completedAt = $date->copy()->setTime(11, 0);
                $reviewRequestedAt = $date->copy()->setTime(10, 5);
            } else {
                $status = 'open';
                $workStatus = 'in_progress';
                $verifiedBy = null;
                $startedAt = $date->copy()->setTime(14, 0);
                $completedAt = null;
                $reviewRequestedAt = null;
            }

            $run = Run::create(array_merge($runData, [
                'status' => $status,
                'work_status' => $workStatus,
                'started_at' => $startedAt,
                'completed_at' => $completedAt,
                'review_requested_at' => $reviewRequestedAt,
                'verified_by' => $verifiedBy,
            ]));

            // Add Entries
            foreach ($items as $item) {
                Entry::create([
                    'run_id' => $run->id,
                    'item_id' => $item->id,
                    'column_id' => $columnResult->id,
                    'value' => (rand(0, 10) > 1) ? 'ok' : 'not_ok',
                    'note' => (rand(0, 10) > 8) ? 'Some note...' : null,
                ]);
            }

            // Add Signoff
            if (($workStatus === 'approved' || $workStatus === 'rejected') && $verifiedBy) {
                Signoff::create([
                    'run_id' => $run->id,
                    'session_id' => $sessionId,
                    'role' => 'supervisor',
                    'user_id' => $verifiedBy,
                    'review_status' => $workStatus,
                    'review_note' => $workStatus === 'approved' ? 'Good job' : 'Fix it',
                    'reviewed_at' => $date->copy()->setTime(16, 0),
                    'signed_at' => $date->copy()->setTime(16, 0),
                    'note' => 'System Auto Signoff',
                ]);
            }
        }

        $this->command->info('Demo Data Generated Successfully!');
    }
}
