<?php

namespace App\Domains\Checklist\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => 'sometimes|in:open,done',
            'assigned_to' => 'nullable|exists:users,id',
            'verified_by' => 'nullable|exists:users,id',
        ];
    }
}
