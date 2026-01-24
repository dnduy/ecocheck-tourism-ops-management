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
            'assigned_to' => 'nullable|exists:users,id',
        ];
    }
}
