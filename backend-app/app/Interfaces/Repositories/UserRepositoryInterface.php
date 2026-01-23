<?php

namespace App\Interfaces\Repositories;

use Illuminate\Support\Collection;
use App\Models\User;

interface UserRepositoryInterface
{
    public function getStaffAndMaintenanceUsers(): Collection;
    public function getSupervisors(): Collection;
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;

    // CRUD Support
    public function getAll(): Collection;
    public function create(array $data): User;
    public function update(User $user, array $data): bool;
    public function delete(User $user): bool;
}
