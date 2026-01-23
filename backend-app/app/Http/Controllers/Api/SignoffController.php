<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateSignoffRequest;
use App\Models\Signoff;
use Illuminate\Http\JsonResponse;

class SignoffController extends Controller
{
    use \App\Traits\ApiResponse;

    protected $signoffService;

    public function __construct(\App\Interfaces\SignoffServiceInterface $signoffService)
    {
        $this->signoffService = $signoffService;
    }

    public function store(CreateSignoffRequest $request): JsonResponse
    {
        $signoff = $this->signoffService->createSignoff($request->validated(), $request->user());
        return $this->successResponse($signoff, 'Ký duyệt thành công', 201);
    }
}
