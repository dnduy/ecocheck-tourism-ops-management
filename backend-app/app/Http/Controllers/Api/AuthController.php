<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use \App\Traits\ApiResponse;

    protected $authService;

    public function __construct(\App\Interfaces\AuthServiceInterface $authService)
    {
        $this->authService = $authService;
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->email, $request->password);

        if (!$result) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        return $this->successResponse($result, 'Đăng nhập thành công');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $this->authService->me($request->user());
        return $this->successResponse($user, 'Lấy thông tin người dùng thành công');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());
        return $this->successResponse(null, 'Đăng xuất thành công');
    }
}
