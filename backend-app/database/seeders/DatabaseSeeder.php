<?php

namespace Database\Seeders;

use App\Domains\User\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default manager
        User::firstOrCreate(
            ['email' => 'admin@local.test'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('ChangeMe123!'),
                'role' => 'manager',
            ]
        );

        // Create additional test users
        User::firstOrCreate(
            ['email' => 'supervisor@local.test'],
            [
                'name' => 'Test Supervisor',
                'password' => Hash::make('password123'),
                'role' => 'supervisor',
            ]
        );

        User::firstOrCreate(
            ['email' => 'staff@local.test'],
            [
                'name' => 'Test Staff',
                'password' => Hash::make('password123'),
                'role' => 'staff',
            ]
        );

        User::firstOrCreate(
            ['email' => 'maintenance@local.test'],
            [
                'name' => 'Test Maintenance',
                'password' => Hash::make('password123'),
                'role' => 'maintenance',
            ]
        );

        $this->command->info('Default users created successfully!');
    }
}
