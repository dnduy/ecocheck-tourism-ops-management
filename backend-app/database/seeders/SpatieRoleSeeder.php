<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;

class SpatieRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'manager', 'supervisor', 'staff'];
        foreach ($roles as $role) {
            Role::findOrCreate($role, 'sanctum');
        }

        $maintenanceRole = Role::where('name', 'maintenance')->first();
        if ($maintenanceRole) {
            User::role('maintenance')->chunk(100, function ($users) {
                foreach ($users as $user) {
                    $user->syncRoles(['staff']);
                }
            });
            $maintenanceRole->delete();
        }

        User::query()->with('roles')->chunk(100, function ($users) {
            foreach ($users as $user) {
                if ($user->roles->isEmpty()) {
                    $user->assignRole('staff');
                }
            }
        });
    }
}
