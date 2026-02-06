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
            // For updates (PUT), make groups fields optional
            $isUpdate = $this->isMethod('PUT');
            
            return [
                'area_id' => ['required', 'exists:areas,id'],
                'name' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'groups' => ['nullable', 'array'],
                'groups.*.title' => [$isUpdate ? 'nullable' : 'required', 'string', 'max:255'],
                'groups.*.items' => [$isUpdate ? 'nullable' : 'required', 'array'],
                'groups.*.items.*.title' => [$isUpdate ? 'nullable' : 'required', 'string', 'max:255'],
                'groups.*.items.*.instructions' => ['nullable', 'string'],
                'columns' => ['nullable', 'array'],
                'columns.*.label' => [$isUpdate ? 'nullable' : 'required', 'string', 'max:255'],
                'columns.*.type' => ['nullable', 'string', 'max:50'],
                'columns.*.options' => ['nullable', 'array'],
            ];
        }
}
