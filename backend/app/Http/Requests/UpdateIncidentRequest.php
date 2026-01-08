<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'severity' => ['sometimes', 'in:low,medium,high,critical'],
            'status' => ['sometimes', 'in:open,in_progress,resolved,closed'],
            'occurred_at' => ['sometimes', 'date'],
            'resolved_at' => ['sometimes', 'nullable', 'date'],
            'resolved_by' => ['sometimes', 'nullable', 'exists:users,id'],
        ];
    }
}
