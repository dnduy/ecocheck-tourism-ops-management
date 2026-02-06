<?php

namespace Database\Seeders;

use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'manager', 'supervisor', 'staff'];
        foreach ($roles as $role) {
            Role::findOrCreate($role, 'sanctum');
        }

        // Create default admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@local.test'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('ChangeMe123!'),
            ]
        );
        $admin->syncRoles(['admin']);

        // Create additional test users
        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor@local.test'],
            [
                'name' => 'Test Supervisor',
                'password' => Hash::make('password123'),
            ]
        );
        $supervisor->syncRoles(['supervisor']);

        $staff = User::firstOrCreate(
            ['email' => 'staff@local.test'],
            [
                'name' => 'Test Staff',
                'password' => Hash::make('password123'),
            ]
        );
        $staff->syncRoles(['staff']);

        $this->command->info('Default users created successfully!');
    }
}
