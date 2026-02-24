<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:pending,in_progress,completed,needs_review,approved,rejected,open,done,draft,active'],
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'verified_by' => ['nullable', 'exists:users,id'],
            'session_id' => ['nullable', 'exists:template_sessions,id'],
        ];
    }
}
