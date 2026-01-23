<?php

namespace App\Interfaces\Repositories;

use App\Models\ChecklistTemplate;
use Illuminate\Support\Collection;

interface TemplateRepositoryInterface
{
    public function getAll(): Collection;
    public function find(int $id): ?ChecklistTemplate;
    public function create(array $data): ChecklistTemplate;
    public function update(ChecklistTemplate $template, array $data): ChecklistTemplate;
    public function delete(ChecklistTemplate $template): bool;

    // Relation management
    public function createGroup(array $data): \App\Models\Group;
    public function updateGroup(\App\Models\Group $group, array $data): bool;
    public function deleteGroupsNotIn(ChecklistTemplate $template, array $ids): void;

    public function createItem(array $data): \App\Models\Item;
    public function updateItem(\App\Models\Item $item, array $data): bool;
    public function deleteItemsNotIn(\App\Models\Group $group, array $ids): void;

    public function createColumn(array $data): \App\Models\TemplateColumn;
    public function deleteColumns(ChecklistTemplate $template): void;

    public function loadRelations(ChecklistTemplate $template): ChecklistTemplate;
}
