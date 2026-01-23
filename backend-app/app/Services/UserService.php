<?php

namespace App\Services;

use App\Interfaces\UserServiceInterface;
use App\Interfaces\Repositories\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserService implements UserServiceInterface
{
    protected $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function getAllUsers(): Collection
    {
        return $this->userRepository->getAll();
    }

    public function createUser(array $data): User
    {
        $data['password'] = Hash::make($data['password']);

        if (!isset($data['avatar'])) {
            $data['avatar'] = 'https://ui-avatars.com/api/?name=' . urlencode($data['name']) . '&background=random&color=fff';
        }

        return $this->userRepository->create($data);
    }

    public function updateUser(User $user, array $data): User
    {
        if (isset($data['password']) && $data['password']) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $this->userRepository->update($user, $data);
        return $user;
    }

    public function deleteUser(User $user, User $requester): void
    {
        if ($user->id === $requester->id) {
            throw ValidationException::withMessages(['user' => 'Không thể tự xóa chính bạn']);
        }

        $this->userRepository->delete($user);
    }
}
