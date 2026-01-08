<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateSignoffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'run_id' => ['required', 'exists:runs,id'],
            'role' => ['required', 'in:manager,supervisor,staff,maintenance'],
            'note' => ['nullable', 'string'],
        ];
    }
}
