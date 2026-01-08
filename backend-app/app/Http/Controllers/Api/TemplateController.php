<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTemplateRequest;
use App\Models\ChecklistTemplate;
use Illuminate\Http\JsonResponse;

class TemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = ChecklistTemplate::latest()->get();
        return response()->json($templates);
    }

    public function show(ChecklistTemplate $template): JsonResponse
    {
        return response()->json($template);
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $template = ChecklistTemplate::create([
            'name' => $request->name,
            'description' => $request->description ?? null,
            'version' => $request->version ?? 'v1',
            'is_active' => $request->is_active ?? true,
        ]);
        
        return response()->json($template, 201);
    }
}
