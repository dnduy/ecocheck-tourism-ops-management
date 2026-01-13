<?php

namespace App\Domains\Checklist\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertSignoffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'run_id' => 'required|exists:checklist_runs,id',
            'session_id' => 'required|exists:template_sessions,id',
            'role_id' => 'nullable|exists:template_roles,id',
            'note' => 'nullable|string',
        ];
    }
}
