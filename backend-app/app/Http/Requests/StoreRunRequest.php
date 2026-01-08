<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'area_id' => ['required', 'exists:areas,id'],
            'checklist_template_id' => ['nullable', 'exists:checklist_templates,id'],
            'date' => ['nullable', 'date'],
            'scheduled_for' => ['nullable', 'date'],
        ];
    }
}
