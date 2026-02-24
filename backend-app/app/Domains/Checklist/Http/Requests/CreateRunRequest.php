<?php

namespace App\Domains\Checklist\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'area_id' => 'required|exists:areas,id',
            'date' => 'required|date',
            'template_id' => 'nullable|exists:checklist_templates,id',
            'session_id' => 'nullable|exists:template_sessions,id',
            'assigned_to' => 'nullable|exists:users,id',
        ];
    }
}
