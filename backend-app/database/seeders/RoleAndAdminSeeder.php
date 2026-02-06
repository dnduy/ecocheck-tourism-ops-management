<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class RoleAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'manager', 'supervisor', 'staff'];
        foreach ($roles as $role) {
            Role::findOrCreate($role, 'sanctum');
        }

        $admin = User::firstOrCreate(
            ['email' => 'admin@local.test'],
            [
                'name' => 'Admin',
                'password' => Hash::make('ChangeMe123!'),
            ]
        );

        $admin->syncRoles(['admin']);
    }
}
