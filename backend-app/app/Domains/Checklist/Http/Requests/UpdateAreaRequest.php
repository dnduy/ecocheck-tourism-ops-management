<?php

namespace App\Domains\Checklist\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'manager';
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:areas,name,' . $this->route('id'),
        ];
    }
}
