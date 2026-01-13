<?php

namespace App\Domains\Checklist\Http\Controllers;

use App\Domains\Checklist\Models\ChecklistTemplate;
use Illuminate\Http\Request;

class TemplatesController
{
    public function index()
    {
        $templates = ChecklistTemplate::with(['area', 'sessions', 'roles', 'groups', 'items'])
            ->where('is_active', true)
            ->get();
        return response()->json($templates);
    }

    public function show(int $id)
    {
        $template = ChecklistTemplate::with(['area', 'sessions', 'roles', 'groups', 'items', 'columns.session', 'columns.role'])
            ->findOrFail($id);
        return response()->json($template);
    }
}
