<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    use \App\Traits\ApiResponse;

    public function index(): JsonResponse
    {
        $shifts = Shift::query()->orderBy('start_time')->get();
        return $this->successResponse($shifts, 'Lấy danh sách ca làm việc thành công');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'string', 'max:5'],
            'end_time' => ['required', 'string', 'max:5'],
            'type' => ['required', 'string', 'max:50'],
            'applicable_area_ids' => ['nullable', 'array'],
            'applicable_area_ids.*' => ['integer', 'exists:areas,id'],
        ]);

        $shift = Shift::create($validated);
        return $this->successResponse($shift, 'Tạo ca làm việc thành công', 201);
    }

    public function update(Request $request, Shift $shift): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'start_time' => ['sometimes', 'string', 'max:5'],
            'end_time' => ['sometimes', 'string', 'max:5'],
            'type' => ['sometimes', 'string', 'max:50'],
            'applicable_area_ids' => ['nullable', 'array'],
            'applicable_area_ids.*' => ['integer', 'exists:areas,id'],
        ]);

        $shift->update($validated);
        return $this->successResponse($shift, 'Cập nhật ca làm việc thành công');
    }

    public function destroy(Shift $shift): JsonResponse
    {
        $shift->delete();
        return $this->successResponse(null, 'Xóa ca làm việc thành công', 204);
    }
}
