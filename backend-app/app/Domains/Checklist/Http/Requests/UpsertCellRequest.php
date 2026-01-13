<?php

namespace App\Domains\Checklist\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertCellRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'run_id' => 'required|exists:checklist_runs,id',
            'item_id' => 'required|exists:template_items,id',
            'column_id' => 'required|exists:template_columns,id',
            'value' => 'required|in:ok,not_ok,na,',
            'note' => 'nullable|string',
            'photo_url' => 'nullable|string|max:500',
        ];
    }
}
