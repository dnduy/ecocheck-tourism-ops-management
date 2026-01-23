<?php

namespace App\Interfaces;

use App\Models\ChecklistTemplate;
use Illuminate\Support\Collection;

interface TemplateServiceInterface
{
    public function getAllTemplates(): Collection;
    public function getTemplate(ChecklistTemplate $template): ChecklistTemplate;
    public function createTemplate(array $data): ChecklistTemplate;
    public function updateTemplate(ChecklistTemplate $template, array $data): ChecklistTemplate;
    public function deleteTemplate(ChecklistTemplate $template): void;
    public function importTemplate(array $data, $file): \Illuminate\Support\Collection;
}
