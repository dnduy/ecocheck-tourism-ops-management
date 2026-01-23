<?php

namespace App\Interfaces;

use App\Models\User;

interface AuthServiceInterface
{
    public function login(string $email, string $password): ?array;
    public function logout(User $user): void;
    public function me(User $user): User;
}
