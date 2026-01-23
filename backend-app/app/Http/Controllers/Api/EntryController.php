<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertEntryRequest;
use App\Models\Entry;
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
        $entry = $this->entryService->upsertEntry($request->validated());

        return $this->successResponse($entry, 'Cập nhật mục kiểm tra thành công');
    }
}
