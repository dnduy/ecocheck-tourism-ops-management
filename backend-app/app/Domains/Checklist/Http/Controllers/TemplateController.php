<?php

namespace App\Domains\Checklist\Http\Controllers;

use App\Domains\Checklist\Models\Area;
use App\Domains\Checklist\Services\TemplateImportService;
use Illuminate\Http\Request;

class TemplateController
{
    public function __construct(
        private TemplateImportService $importService
    ) {}

    public function getAreaTemplate(int $areaId)
    {
        $area = Area::with(['templates' => function ($query) {
            $query->where('is_active', true)
                ->with(['sessions', 'roles', 'groups', 'items', 'columns.session', 'columns.role']);
        }])->findOrFail($areaId);

        $template = $area->templates->first();

        if (!$template) {
            return response()->json(['message' => 'No active template found for this area'], 404);
        }

        return response()->json($template);
    }

    public function import(Request $request)
    {
        $path = $request->input('path') ?? base_path('checklist_structure_analysis.json');

        try {
            $stats = $this->importService->importFromJson($path);
            return response()->json([
                'message' => 'Templates imported successfully',
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Import failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
