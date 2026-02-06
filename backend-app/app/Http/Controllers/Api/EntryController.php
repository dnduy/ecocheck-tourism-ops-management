<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertEntryRequest;
use App\Models\Entry;
use App\Models\Run;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EntryController extends Controller
{
    use \App\Traits\ApiResponse;

    protected $entryService;

    public function __construct(\App\Interfaces\EntryServiceInterface $entryService)
    {
        $this->entryService = $entryService;
    }

    public function upsert(UpsertEntryRequest $request): JsonResponse
    {
        // Validation handled by FormRequest
        $data = $request->validated();
        $run = Run::find($data['run_id']);
        if (!$run) {
            return response()->json(['error' => 'Run not found'], 404);
        }

        $user = $request->user();
        if (!$user || !\App\Support\RunAccess::canEditEntries($user, $run)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $entry = $this->entryService->upsertEntry($data);

        return $this->successResponse($entry, 'Cập nhật mục kiểm tra thành công');
    }
}
