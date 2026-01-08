<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
            return [
                'name' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'groups' => ['nullable', 'array'],
                'groups.*.title' => ['required', 'string', 'max:255'],
                'groups.*.items' => ['required', 'array'],
                'groups.*.items.*.title' => ['required', 'string', 'max:255'],
                'groups.*.items.*.instructions' => ['nullable', 'string'],
                'columns' => ['nullable', 'array'],
                'columns.*.label' => ['required', 'string', 'max:255'],
                'columns.*.type' => ['nullable', 'string', 'max:50'],
                'columns.*.options' => ['nullable', 'array'],
            ];
        }
}
