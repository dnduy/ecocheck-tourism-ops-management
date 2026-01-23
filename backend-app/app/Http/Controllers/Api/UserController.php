<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class UserController extends Controller
{
    use \App\Traits\ApiResponse;

    protected $userService;

    public function __construct(\App\Interfaces\UserServiceInterface $userService)
    {
        $this->userService = $userService;
    }

    public function index(): JsonResponse
    {
        $users = $this->userService->getAllUsers();
        return $this->successResponse($users, 'Lấy danh sách người dùng thành công');
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->createUser($request->validated());
        return $this->successResponse($user, 'Tạo người dùng thành công', 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->userService->updateUser($user, $request->validated());
        return $this->successResponse($user, 'Cập nhật người dùng thành công');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        try {
            $this->userService->deleteUser($user, $request->user());
            return $this->successResponse(null, 'Đã xóa người dùng');
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
