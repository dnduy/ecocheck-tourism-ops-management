<?php

namespace App\Repositories;

use App\Interfaces\Repositories\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Support\Collection;

class UserRepository implements UserRepositoryInterface
{
    public function getStaffUsers(): Collection
    {
        return User::role('staff')->get();
    }

    public function getSupervisors(): Collection
    {
        return User::role('supervisor')->get();
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function getAll(): Collection
    {
        return User::with('roles')->select('id', 'name', 'email', 'avatar')->latest()->get();
    }

    public function create(array $data): User
    {
        $role = $data['role'] ?? null;
        unset($data['role']);

        $user = User::create($data);
        if ($role) {
            $user->syncRoles([$role]);
        }
        return $user;
    }

    public function update(User $user, array $data): bool
    {
        $role = $data['role'] ?? null;
        unset($data['role']);

        $updated = $user->update($data);
        if ($role) {
            $user->syncRoles([$role]);
        }
        return $updated;
    }

    public function delete(User $user): bool
    {
        return $user->delete();
    }
}
