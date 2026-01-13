<?php

namespace App\Http\Controllers;

use App\Models\Run;
use App\Models\ChecklistTemplate;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ChecklistController extends Controller
{
    /**
     * Tạo daily checklists cho ngày được chỉ định
     * POST /api/checklists/create-daily
     */
    public function createDaily(Request $request)
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'days' => 'nullable|integer|min:1|max:30'
        ]);

        $date = $validated['date'] ?? now()->toDateString();
        $days = $validated['days'] ?? 1;

        // Template to area mapping
        $mappings = [
            7 => 11,  // Bếp Chính → Khách sạn
            8 => 12,  // Quầy Bar → Nhà hàng
            9 => 13,  // Vệ Sinh WC → Bảo trì
            10 => 13, // Nhà 2 Tầng → Bảo trì
            11 => 12, // Bếp Quê → Nhà hàng
            12 => 12, // Nhà Hàng → Nhà hàng
            13 => 13  // Cây Xanh → Bảo trì
        ];

        $created = [];
        $skipped = [];

        for ($i = 0; $i < $days; $i++) {
            $currentDate = Carbon::parse($date)->addDays($i)->toDateString();

            foreach ($mappings as $templateId => $areaId) {
                $template = ChecklistTemplate::find($templateId);
                if (!$template) continue;

                // Check if already exists
                $exists = Run::where('checklist_template_id', $templateId)
                    ->where('scheduled_for', $currentDate)
                    ->where('area_id', $areaId)
                    ->exists();

                if ($exists) {
                    $skipped[] = [
                        'template' => $template->name,
                        'date' => $currentDate,
                        'reason' => 'already exists'
                    ];
                    continue;
                }

                // Create run
                $run = Run::create([
                    'checklist_template_id' => $templateId,
                    'area_id' => $areaId,
                    'scheduled_for' => $currentDate,
                    'status' => 'pending',
                    'assigned_to' => auth()->id() ?? 1,
                ]);

                $created[] = [
                    'id' => $run->id,
                    'template' => $template->name,
                    'area_id' => $areaId,
                    'date' => $currentDate
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($created) . ' checklists created',
            'created' => $created,
            'skipped' => $skipped,
            'total' => count($created) + count($skipped)
        ]);
    }

    /**
     * Lấy danh sách checklists cho ngày được chỉ định
     * GET /api/checklists/date/{date}
     */
    public function getByDate($date)
    {
        $runs = Run::where('scheduled_for', $date)
            ->with('area')
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn($run) => [
                'id' => $run->id,
                'template_id' => $run->checklist_template_id,
                'area_name' => $run->area->name ?? 'Unknown',
                'status' => $run->status,
                'assigned_to' => $run->assigned_to,
                'scheduled_for' => $run->scheduled_for
            ]);

        return response()->json([
            'success' => true,
            'date' => $date,
            'count' => count($runs),
            'checklists' => $runs
        ]);
    }

    /**
     * Xóa checklists cho ngày được chỉ định
     * DELETE /api/checklists/date/{date}
     */
    public function deleteByDate($date)
    {
        $deleted = Run::where('scheduled_for', $date)->delete();

        return response()->json([
            'success' => true,
            'message' => "$deleted checklists deleted for $date",
            'deleted_count' => $deleted
        ]);
    }
}
