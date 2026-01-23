<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class SimpleTestDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();
        
        try {
            $this->command->info('🚀 Starting test data generation...');
            
            // Clear existing data (except admin)
            DB::table('run_signoffs')->delete();
            DB::table('checklist_entries')->delete();
            DB::table('incidents')->delete();
            DB::table('checklist_runs')->delete();
            DB::table('template_items')->delete();
            DB::table('template_columns')->delete();
            DB::table('template_groups')->delete();
            DB::table('template_sessions')->delete();
            DB::table('template_roles')->delete();
            DB::table('checklist_templates')->delete();
            DB::table('area_user')->delete();
            DB::table('areas')->delete();
            DB::table('users')->where('email', '!=', 'admin@local.test')->delete();
            
            // 1. Users
            $users = $this->createUsers();
            $this->command->info('✅ Created ' . count($users) . ' users');
            
            // 2. Areas
            $areas = $this->createAreas();
            $this->command->info('✅ Created ' . count($areas) . ' areas');
            
            // 3. Templates with full structure
            $templates = $this->createTemplatesWithStructure($areas);
            $this->command->info('✅ Created ' . count($templates) . ' templates');
            
            // 4. Runs
            $runs = $this->createRuns($areas, $templates, $users);
            $this->command->info('✅ Created ' . count($runs) . ' checklist runs');
            
            // 5. Entries
            $entryCount = $this->createEntries($runs, $templates, $users);
            $this->command->info('✅ Created ' . $entryCount . ' entries');
            
            // 6. Signoffs
            $signoffCount = $this->createSignoffs($runs, $users);
            $this->command->info('✅ Created ' . $signoffCount . ' signoffs');
            
            // 7. Incidents
            $incidents = $this->createIncidents($areas, $runs, $users);
            $this->command->info('✅ Created ' . count($incidents) . ' incidents');
            
            DB::commit();
            
            $this->command->info('');
            $this->command->info('🎉 Test data generation complete!');
            $this->displayLoginInfo($users);
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Error: ' . $e->getMessage());
            $this->command->error($e->getTraceAsString());
            throw $e;
        }
    }
    
    private function createUsers(): array
    {
        $users = [];
        
        // Manager
        $users['manager'] = DB::table('users')->insertGetId([
            'name' => 'Manager Test',
            'email' => 'manager@test.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Supervisors
        for ($i = 1; $i <= 3; $i++) {
            $users["supervisor$i"] = DB::table('users')->insertGetId([
                'name' => "Supervisor $i",
                'email' => "supervisor$i@test.com",
                'password' => Hash::make('password'),
                'role' => 'supervisor',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Staff
        for ($i = 1; $i <= 5; $i++) {
            $users["staff$i"] = DB::table('users')->insertGetId([
                'name' => "Staff $i",
                'email' => "staff$i@test.com",
                'password' => Hash::make('password'),
                'role' => 'staff',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Maintenance
        for ($i = 1; $i <= 2; $i++) {
            $users["maintenance$i"] = DB::table('users')->insertGetId([
                'name' => "Maintenance $i",
                'email' => "maintenance$i@test.com",
                'password' => Hash::make('password'),
                'role' => 'maintenance',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        return $users;
    }
    
    private function createAreas(): array
    {
        $areaNames = [
            'Hotel Lobby',
            'Restaurant',
            'Swimming Pool',
            'Spa & Wellness',
            'Guest Rooms',
            'Conference Hall',
        ];
        
        $areas = [];
        foreach ($areaNames as $name) {
            $areas[] = DB::table('areas')->insertGetId([
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        return $areas;
    }
    
    private function createTemplatesWithStructure(array $areas): array
    {
        $templates = [];
        
        foreach ($areas as $areaId) {
            $areaName = DB::table('areas')->where('id', $areaId)->value('name');
            
            // Create template
            $templateId = DB::table('checklist_templates')->insertGetId([
                'area_id' => $areaId,
                'name' => "Daily Inspection - $areaName",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Create session
            $sessionId = DB::table('template_sessions')->insertGetId([
                'template_id' => $templateId,
                'name' => 'Morning Shift',
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Create columns
            $columns = [];
            $columns['status'] = DB::table('template_columns')->insertGetId([
                'template_id' => $templateId,
                'name' => 'Status',
                'type' => 'status',
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $columns['note'] = DB::table('template_columns')->insertGetId([
                'template_id' => $templateId,
                'name' => 'Notes',
                'type' => 'text',
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Create groups and items
            $groups = [
                ['name' => 'Cleanliness', 'items' => ['Floors clean', 'Surfaces wiped', 'Trash empty', 'No stains']],
                ['name' => 'Safety', 'items' => ['Exits clear', 'Fire equipment ready', 'Signs visible']],
                ['name' => 'Equipment', 'items' => ['All functional', 'No damage', 'Logs updated']],
            ];
            
            foreach ($groups as $groupIndex => $groupData) {
                $groupId = DB::table('template_groups')->insertGetId([
                    'template_id' => $templateId,
                    'session_id' => $sessionId,
                    'name' => $groupData['name'],
                    'sort_order' => $groupIndex + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                foreach ($groupData['items'] as $itemIndex => $itemContent) {
                    DB::table('template_items')->insert([
                        'template_id' => $templateId,
                        'group_id' => $groupId,
                        'content' => $itemContent,
                        'sort_order' => $itemIndex + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            
            $templates[] = [
                'id' => $templateId,
                'area_id' => $areaId,
                'session_id' => $sessionId,
                'columns' => $columns,
            ];
        }
        
        return $templates;
    }
    
    private function createRuns(array $areas, array $templates, array $users): array
    {
        $runs = [];
        $today = Carbon::today();
        
        // Create runs for last 7 days
        for ($day = 6; $day >= 0; $day--) {
            $date = $today->copy()->subDays($day);
            
            foreach ($templates as $index => $template) {
                $staffIndex = ($index % 5) + 1;
                $supervisorIndex = ($index % 3) + 1;
                
                $status = $this->getStatusForDay($day);
                
                $runId = DB::table('checklist_runs')->insertGetId([
                    'area_id' => $template['area_id'],
                    'template_id' => $template['id'],
                    'assigned_to' => $users["staff$staffIndex"],
                    'verified_by' => in_array($status, ['approved', 'rejected']) ? $users["supervisor$supervisorIndex"] : null,
                    'status' => $status,
                    'work_status' => $this->getWorkStatus($status),
                    'work_started_at' => $status !== 'pending' ? $date->copy()->setTime(8, 0) : null,
                    'work_completed_at' => in_array($status, ['completed', 'needs_review', 'approved', 'rejected']) ? $date->copy()->setTime(10, 30) : null,
                    'review_requested_at' => in_array($status, ['needs_review', 'approved', 'rejected']) ? $date->copy()->setTime(10, 35) : null,
                    'reviewed_at' => in_array($status, ['approved', 'rejected']) ? $date->copy()->setTime(11, 0) : null,
                    'created_at' => $date->copy()->setTime(7, 0),
                    'updated_at' => now(),
                ]);
                
                $runs[] = [
                    'id' => $runId,
                    'template_id' => $template['id'],
                    'session_id' => $template['session_id'],
                    'columns' => $template['columns'],
                    'status' => $status,
                    'assigned_to' => $users["staff$staffIndex"],
                    'verified_by' => $users["supervisor$supervisorIndex"],
                    'date' => $date,
                ];
            }
        }
        
        return $runs;
    }
    
    private function getStatusForDay(int $daysAgo): string
    {
        if ($daysAgo >= 5) return 'approved';
        if ($daysAgo >= 3) return 'needs_review';
        if ($daysAgo >= 1) return 'completed';
        return 'in_progress';
    }
    
    private function getWorkStatus(string $status): ?string
    {
        return match($status) {
            'pending' => null,
            'in_progress' => 'in_progress',
            default => 'completed',
        };
    }
    
    private function createEntries(array $runs, array $templates, array $users): int
    {
        $count = 0;
        
        foreach ($runs as $run) {
            if ($run['status'] === 'pending') continue;
            
            $items = DB::table('template_items')
                ->where('template_id', $run['template_id'])
                ->get();
            
            foreach ($items as $item) {
                // Status column
                $rand = rand(1, 100);
                $value = $rand <= 80 ? 'ok' : ($rand <= 95 ? 'not_ok' : 'na');
                
                DB::table('checklist_entries')->insert([
                    'run_id' => $run['id'],
                    'item_id' => $item->id,
                    'column_id' => $run['columns']['status'],
                    'value' => $value,
                    'checked_by' => $run['assigned_to'],
                    'checked_at' => $run['date']->copy()->setTime(9, rand(0, 59)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                // Note column (if not ok)
                if ($value === 'not_ok') {
                    DB::table('checklist_entries')->insert([
                        'run_id' => $run['id'],
                        'item_id' => $item->id,
                        'column_id' => $run['columns']['note'],
                        'note' => 'Issue detected - needs attention',
                        'checked_by' => $run['assigned_to'],
                        'checked_at' => $run['date']->copy()->setTime(9, rand(0, 59)),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                
                $count++;
            }
        }
        
        return $count;
    }
    
    private function createSignoffs(array $runs, array $users): int
    {
        $count = 0;
        
        foreach ($runs as $run) {
            if ($run['status'] !== 'approved') continue;
            
            DB::table('run_signoffs')->insert([
                'run_id' => $run['id'],
                'session_id' => $run['session_id'],
                'signed_by' => $run['verified_by'],
                'note' => 'Approved - All checks satisfactory',
                'signed_at' => $run['date']->copy()->setTime(11, 0),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $count++;
        }
        
        return $count;
    }
    
    private function createIncidents(array $areas, array $runs, array $users): array
    {
        $incidents = [];
        $severities = ['low', 'medium', 'high', 'critical'];
        $statuses = ['open', 'in_progress', 'resolved', 'closed'];
        
        for ($i = 0; $i < 15; $i++) {
            $run = $runs[array_rand($runs)];
            $severity = $severities[array_rand($severities)];
            $status = $statuses[array_rand($statuses)];
            
            $daysAgo = rand(0, 10);
            $createdAt = Carbon::today()->subDays($daysAgo)->setTime(rand(8, 16), rand(0, 59));
            
            $incidentId = DB::table('incidents')->insertGetId([
                'area_id' => $run['template_id'] ? DB::table('checklist_templates')->where('id', $run['template_id'])->value('area_id') : $areas[0],
                'run_id' => $run['id'],
                'title' => $this->getIncidentTitle($severity),
                'description' => "Issue detected during inspection. Severity: $severity",
                'severity' => $severity,
                'status' => $status,
                'priority' => $severity,
                'reported_by' => $run['assigned_to'],
                'assigned_to' => $users['maintenance1'],
                'occurred_at' => $createdAt,
                'resolved_at' => in_array($status, ['resolved', 'closed']) ? $createdAt->copy()->addHours(rand(2, 24)) : null,
                'resolution_note' => in_array($status, ['resolved', 'closed']) ? 'Fixed successfully' : null,
                'created_at' => $createdAt,
                'updated_at' => now(),
            ]);
            
            $incidents[] = $incidentId;
        }
        
        return $incidents;
    }
    
    private function getIncidentTitle(string $severity): string
    {
        $titles = [
            'critical' => ['Power outage', 'Water leak', 'Fire alarm issue', 'Gas leak'],
            'high' => ['Broken elevator', 'HVAC failure', 'Plumbing problem', 'Door malfunction'],
            'medium' => ['Light replacement', 'Wall damage', 'Loose handle', 'Stained carpet'],
            'low' => ['Paint touch-up', 'Cosmetic damage', 'Window cleaning', 'Minor scratch'],
        ];
        
        return $titles[$severity][array_rand($titles[$severity])];
    }
    
    private function displayLoginInfo(array $users): void
    {
        $this->command->info('');
        $this->command->info('🔑 Login Credentials (all password: password):');
        $this->command->table(
            ['Role', 'Email'],
            [
                ['Manager', 'manager@test.com'],
                ['Supervisor', 'supervisor1-3@test.com'],
                ['Staff', 'staff1-5@test.com'],
                ['Maintenance', 'maintenance1-2@test.com'],
            ]
        );
        $this->command->info('🌐 Access: http://localhost:5173');
    }
}
