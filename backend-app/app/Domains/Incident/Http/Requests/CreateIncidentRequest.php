<?php

namespace App\Domains\Incident\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'area_id' => 'required|exists:areas,id',
            'run_id' => 'nullable|exists:checklist_runs,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'severity' => 'required|in:low,medium,high',
        ];
    }
}
