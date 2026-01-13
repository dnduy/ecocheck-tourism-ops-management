<?php

namespace App\Domains\Incident\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => 'sometimes|in:open,in_progress,resolved',
            'assigned_to' => 'nullable|exists:users,id',
            'resolution_note' => 'nullable|string',
        ];
    }
}
