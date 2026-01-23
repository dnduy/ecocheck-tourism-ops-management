<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ComprehensiveTestDataSeeder extends Seeder
{
    /**
     * Tạo dữ liệu test đầy đủ cho toàn bộ hệ thống
     * Bao gồm: Users, Areas, Templates, Runs, Entries, Signoffs, Incidents, Review workflow
     */
    public function run(): void
    {
        DB::beginTransaction();
        
        try {
            $this->command->info('🚀 Starting comprehensive test data generation...');
            
            // 1. Users (various roles)
            $users = $this->createUsers();
            $this->command->info('✅ Created ' . count($users) . ' users');
            
            // 2. Areas
            $areas = $this->createAreas();
            $this->command->info('✅ Created ' . count($areas) . ' areas');
            
            // 3. Templates with structure
            $templates = $this->createTemplates($areas);
            $this->command->info('✅ Created ' . count($templates) . ' templates');
            
            // 4. Checklist Runs (various statuses)
            $runs = $this->createRuns($areas, $templates, $users);
            $this->command->info('✅ Created ' . count($runs) . ' checklist runs');
            
            // 5. Entries (checklist items filled in)
            $entryCount = $this->createEntries($runs, $templates, $users);
            $this->command->info('✅ Created ' . $entryCount . ' entries');
            
            // 6. Signoffs
            $signoffCount = $this->createSignoffs($runs, $users);
            $this->command->info('✅ Created ' . $signoffCount . ' signoffs');
            
            // 7. Incidents (various severities)
            $incidents = $this->createIncidents($areas, $runs, $users);
            $this->command->info('✅ Created ' . count($incidents) . ' incidents');
            
            DB::commit();
            
            $this->command->info('');
            $this->command->info('🎉 Test data generation complete!');
            $this->command->info('');
            $this->command->info('📊 Summary:');
            $this->command->info('   Users: ' . count($users));
            $this->command->info('   Areas: ' . count($areas));
            $this->command->info('   Templates: ' . count($templates));
            $this->command->info('   Runs: ' . count($runs));
            $this->command->info('   Entries: ' . $entryCount);
            $this->command->info('   Signoffs: ' . $signoffCount);
            $this->command->info('   Incidents: ' . count($incidents));
            $this->command->info('');
            $this->displayLoginInfo($users);
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    private function createUsers(): array
    {
        $users = [];
        
        // Manager (admin)
        $users['manager'] = DB::table('users')->insertGetId([
            'name' => 'System Manager',
            'email' => 'manager@test.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Supervisors (3 người)
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
        
        // Staff (5 người)
        for ($i = 1; $i <= 5; $i++) {
            $users["staff$i"] = DB::table('users')->insertGetId([
                'name' => "Staff Member $i",
                'email' => "staff$i@test.com",
                'password' => Hash::make('password'),
                'role' => 'staff',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Maintenance (2 người)
        for ($i = 1; $i <= 2; $i++) {
            $users["maintenance$i"] = DB::table('users')->insertGetId([
                'name' => "Maintenance Worker $i",
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
        $areas = [];
        
        $areaNames = [
            'Hotel Lobby',
            'Restaurant',
            'Swimming Pool',
            'Spa & Wellness',
            'Guest Rooms Floor 1-3',
            'Conference Hall',
        ];
        
        foreach ($areaNames as $name) {
            $areas[] = DB::table('areas')->insertGetId([
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        return $areas;
    }
    
    private function createTemplates(array $areas): array
    {
        $templates = [];
        
        // Template cho mỗi area
        foreach ($areas as $index => $areaId) {
            $areaName = DB::table('areas')->where('id', $areaId)->value('name');
            
            $templateId = DB::table('checklist_templates')->insertGetId([
                'area_id' => $areaId,
                'name' => "Daily Checklist - $areaName",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Create structure (groups, sessions, items, columns)
            $this->createTemplateStructure($templateId, $areaName);
            
            $templates[] = $templateId;
        }
        
        return $templates;
    }
    
    private function createTemplateStructure(int $templateId, string $areaName): void
    {
        // Session
        $sessionId = DB::table('checklist_sessions')->insertGetId([
            'template_id' => $templateId,
            'name' => 'Morning Shift',
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Columns
        $columns = ['Check Status', 'Notes', 'Photo'];
        $columnIds = [];
        foreach ($columns as $index => $colName) {
            $columnIds[] = DB::table('checklist_columns')->insertGetId([
                'template_id' => $templateId,
                'name' => $colName,
                'type' => $index === 0 ? 'status' : ($index === 1 ? 'text' : 'photo'),
                'sort_order' => $index + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Groups and Items
        $groups = $this->getGroupsForArea($areaName);
        
        foreach ($groups as $groupIndex => $group) {
            $groupId = DB::table('checklist_groups')->insertGetId([
                'template_id' => $templateId,
                'session_id' => $sessionId,
                'name' => $group['name'],
                'sort_order' => $groupIndex + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            foreach ($group['items'] as $itemIndex => $itemContent) {
                DB::table('checklist_items')->insert([
                    'template_id' => $templateId,
                    'group_id' => $groupId,
                    'content' => $itemContent,
                    'sort_order' => $itemIndex + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
    
    private function getGroupsForArea(string $areaName): array
    {
        $commonGroups = [
            [
                'name' => 'Cleanliness',
                'items' => [
                    'Floors are clean and free of debris',
                    'Surfaces are wiped and sanitized',
                    'Trash bins are empty',
                    'No visible stains or marks',
                ]
            ],
            [
                'name' => 'Safety',
                'items' => [
                    'Emergency exits are clear',
                    'Fire extinguishers are accessible',
                    'Warning signs are visible',
                    'No hazards present',
                ]
            ],
            [
                'name' => 'Equipment',
                'items' => [
                    'All equipment is functional',
                    'No damaged items',
                    'Maintenance logs up to date',
                ]
            ],
        ];
        
        return $commonGroups;
    }
    
    private function createRuns(array $areas, array $templates, array $users): array
    {
        $runs = [];
        $statuses = ['pending', 'in_progress', 'completed', 'needs_review', 'approved', 'rejected'];
        $today = Carbon::today();
        
        // Tạo runs cho 7 ngày gần đây
        for ($day = 6; $day >= 0; $day--) {
            $date = $today->copy()->subDays($day);
            
            foreach ($templates as $index => $templateId) {
                // Chọn staff ngẫu nhiên
                $staffKey = 'staff' . (($index % 5) + 1);
                $staffId = $users[$staffKey];
                
                // Chọn supervisor ngẫu nhiên
                $supervisorKey = 'supervisor' . (($index % 3) + 1);
                $supervisorId = $users[$supervisorKey];
                
                // Status dựa trên ngày
                $status = $this->getStatusForDay($day);
                
                $runId = DB::table('runs')->insertGetId([
                    'area_id' => $areas[$index],
                    'template_id' => $templateId,
                    'assigned_to' => $staffId,
                    'verified_by' => in_array($status, ['approved', 'rejected']) ? $supervisorId : null,
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
                    'template_id' => $templateId,
                    'status' => $status,
                    'assigned_to' => $staffId,
                    'verified_by' => $supervisorId,
                    'date' => $date,
                ];
            }
        }
        
        return $runs;
    }
    
    private function getStatusForDay(int $daysAgo): string
    {
        if ($daysAgo >= 5) {
            return 'approved'; // Completed and approved
        } elseif ($daysAgo >= 3) {
            return 'needs_review'; // Waiting for review
        } elseif ($daysAgo >= 1) {
            return 'completed'; // Just completed
        } else {
            return 'in_progress'; // Today - in progress
        }
    }
    
    private function getWorkStatus(string $status): ?string
    {
        $mapping = [
            'pending' => null,
            'in_progress' => 'in_progress',
            'completed' => 'completed',
            'needs_review' => 'completed',
            'approved' => 'completed',
            'rejected' => 'completed',
        ];
        
        return $mapping[$status] ?? null;
    }
    
    private function createEntries(array $runs, array $templates, array $users): int
    {
        $count = 0;
        
        foreach ($runs as $run) {
            // Chỉ tạo entries cho runs không phải pending
            if ($run['status'] === 'pending') {
                continue;
            }
            
            // Get all items for this template
            $items = DB::table('checklist_items')
                ->where('template_id', $run['template_id'])
                ->get();
            
            // Get columns
            $columns = DB::table('checklist_columns')
                ->where('template_id', $run['template_id'])
                ->get();
            
            foreach ($items as $item) {
                foreach ($columns as $column) {
                    // Status column (80% OK, 15% NOT_OK, 5% N/A)
                    if ($column->type === 'status') {
                        $rand = rand(1, 100);
                        $value = $rand <= 80 ? 'ok' : ($rand <= 95 ? 'not_ok' : 'na');
                        
                        DB::table('entries')->insert([
                            'run_id' => $run['id'],
                            'item_id' => $item->id,
                            'column_id' => $column->id,
                            'value' => $value,
                            'note' => $value === 'not_ok' ? 'Issue found - needs attention' : null,
                            'checked_by' => $run['assigned_to'],
                            'checked_at' => $run['date']->copy()->setTime(9, rand(0, 59)),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        
                        $count++;
                    }
                }
            }
        }
        
        return $count;
    }
    
    private function createSignoffs(array $runs, array $users): int
    {
        $count = 0;
        
        foreach ($runs as $run) {
            // Chỉ tạo signoffs cho runs đã approved
            if ($run['status'] !== 'approved') {
                continue;
            }
            
            // Get session for this template
            $session = DB::table('checklist_sessions')
                ->where('template_id', $run['template_id'])
                ->first();
            
            if ($session) {
                DB::table('signoffs')->insert([
                    'run_id' => $run['id'],
                    'session_id' => $session->id,
                    'signed_by' => $run['verified_by'],
                    'note' => 'Approved - All checks completed satisfactorily',
                    'signed_at' => $run['date']->copy()->setTime(11, 0),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                $count++;
            }
        }
        
        return $count;
    }
    
    private function createIncidents(array $areas, array $runs, array $users): array
    {
        $incidents = [];
        $severities = ['low', 'medium', 'high', 'critical'];
        $statuses = ['open', 'in_progress', 'resolved', 'closed'];
        
        // Tạo 15 incidents với severity và status khác nhau
        for ($i = 1; $i <= 15; $i++) {
            $areaId = $areas[array_rand($areas)];
            $severity = $severities[array_rand($severities)];
            $status = $statuses[array_rand($statuses)];
            
            // Chọn run ngẫu nhiên có entries (not_ok)
            $runWithIssue = collect($runs)->where('status', '!=', 'pending')->random();
            
            // Assign to maintenance staff
            $maintenanceKey = 'maintenance' . rand(1, 2);
            
            $daysAgo = rand(0, 10);
            $createdAt = Carbon::today()->subDays($daysAgo)->setTime(rand(8, 16), rand(0, 59));
            
            $incidentId = DB::table('incidents')->insertGetId([
                'area_id' => $areaId,
                'run_id' => $runWithIssue['id'],
                'title' => $this->getIncidentTitle($severity),
                'description' => $this->getIncidentDescription($severity),
                'severity' => $severity,
                'status' => $status,
                'priority' => $this->getPriorityForSeverity($severity),
                'reported_by' => $runWithIssue['assigned_to'],
                'assigned_to' => $users[$maintenanceKey],
                'occurred_at' => $createdAt,
                'resolved_at' => in_array($status, ['resolved', 'closed']) ? $createdAt->copy()->addHours(rand(2, 24)) : null,
                'resolution_note' => in_array($status, ['resolved', 'closed']) ? 'Issue resolved successfully' : null,
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
            'critical' => [
                'Water leakage from ceiling',
                'Power outage in main area',
                'Fire alarm malfunction',
                'Gas leak detected',
            ],
            'high' => [
                'Broken elevator',
                'HVAC system failure',
                'Plumbing issue',
                'Door lock malfunction',
            ],
            'medium' => [
                'Light bulb needs replacement',
                'Minor wall damage',
                'Loose door handle',
                'Stained carpet',
            ],
            'low' => [
                'Paint touch-up needed',
                'Cosmetic damage to furniture',
                'Window cleaning required',
                'Minor scratch on surface',
            ],
        ];
        
        $options = $titles[$severity];
        return $options[array_rand($options)];
    }
    
    private function getIncidentDescription(string $severity): string
    {
        return "Issue reported during routine inspection. Severity level: $severity. Requires immediate attention from maintenance team.";
    }
    
    private function getPriorityForSeverity(string $severity): string
    {
        $mapping = [
            'critical' => 'critical',
            'high' => 'high',
            'medium' => 'medium',
            'low' => 'low',
        ];
        
        return $mapping[$severity];
    }
    
    private function displayLoginInfo(array $users): void
    {
        $this->command->info('🔑 Login Credentials:');
        $this->command->info('');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Manager', 'manager@test.com', 'password'],
                ['Supervisor', 'supervisor1-3@test.com', 'password'],
                ['Staff', 'staff1-5@test.com', 'password'],
                ['Maintenance', 'maintenance1-2@test.com', 'password'],
            ]
        );
        $this->command->info('');
        $this->command->info('🌐 Access: http://localhost:5173');
        $this->command->info('📋 Total Users: ' . count($users));
    }
}
