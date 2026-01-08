<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertEntryRequest;
use App\Models\Entry;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EntryController extends Controller
{
    public function upsert(UpsertEntryRequest $request): JsonResponse
    {
        $data = $request->validated();

        $entry = DB::transaction(function () use ($data, $request) {
            $entry = Entry::updateOrCreate(
                [
                    'run_id' => $data['run_id'],
                    'item_id' => $data['item_id'],
                    'column_id' => $data['column_id'],
                ],
                [
                    'value' => $data['value'],
                    'note' => $data['note'] ?? null,
                    'updated_by' => $request->user()->id,
                    'created_by' => $request->user()->id,
                ]
            );

            return $entry;
        });

        return response()->json($entry);
    }
}
