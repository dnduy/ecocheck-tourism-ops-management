<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'run_id' => ['required', 'exists:runs,id'],
            'item_id' => ['required', 'exists:items,id'],
            'column_id' => ['required', 'exists:template_columns,id'],
            'value' => ['required'],
            'note' => ['nullable', 'string'],
        ];
    }
}
