<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTemplateRequest;
use App\Models\ChecklistTemplate;
use App\Models\Group;
use App\Models\Item;
use App\Models\TemplateColumn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TemplateController extends Controller
{
    use \App\Traits\ApiResponse;

    protected $templateService;

    public function __construct(\App\Interfaces\TemplateServiceInterface $templateService)
    {
        $this->templateService = $templateService;
    }

    public function index(): JsonResponse
    {
        $templates = $this->templateService->getAllTemplates();
        return $this->successResponse($templates, 'Lấy danh sách template thành công');
    }

    public function show(ChecklistTemplate $template): JsonResponse
    {
        $template = $this->templateService->getTemplate($template);
        return $this->successResponse($template, 'Lấy chi tiết template thành công');
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        // Validation handled by FormRequest
        $template = $this->templateService->createTemplate($request->validated());
        return $this->successResponse($template, 'Tạo template thành công', 201);
    }

    public function update(StoreTemplateRequest $request, ChecklistTemplate $template): JsonResponse
    {
        $template = $this->templateService->updateTemplate($template, $request->validated());
        return $this->successResponse($template, 'Cập nhật template thành công');
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        try {
            $templates = $this->templateService->importTemplate(
                $request->only(['name', 'description']),
                $request->file('file')
            );
            return $this->successResponse($templates, 'Import template thành công', 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function destroy(ChecklistTemplate $template): JsonResponse
    {
        $this->templateService->deleteTemplate($template);
        return $this->successResponse(null, 'Xóa template thành công');
    }
}
