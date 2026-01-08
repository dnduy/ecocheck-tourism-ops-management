<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateSignoffRequest;
use App\Models\Signoff;
use Illuminate\Http\JsonResponse;

class SignoffController extends Controller
{
    public function store(CreateSignoffRequest $request): JsonResponse
    {
        $signoff = Signoff::create([
            'run_id' => $request->run_id,
            'role' => $request->role,
            'user_id' => $request->user()->id,
            'note' => $request->note,
            'signed_at' => now(),
        ]);

        return response()->json($signoff, 201);
    }
}
