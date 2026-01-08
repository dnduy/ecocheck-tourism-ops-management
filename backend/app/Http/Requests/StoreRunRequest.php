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
            'checklist_template_id' => ['required', 'exists:checklist_templates,id'],
            'area_id' => ['required', 'exists:areas,id'],
            'scheduled_for' => ['nullable', 'date'],
        ];
    }
}
