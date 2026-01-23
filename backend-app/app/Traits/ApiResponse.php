<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Success Response
     *
     * @param mixed $data
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function successResponse($data, $message = 'Thành công', $code = 200): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'code' => $code,
            'data' => $data,
        ], $code);
    }

    /**
     * Error Response
     *
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function errorResponse($message = 'Đã có lỗi xảy ra', $code = 400): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'code' => $code,
            'data' => null,
        ], $code);
    }
}
