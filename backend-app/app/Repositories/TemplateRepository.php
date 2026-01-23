<?php

namespace App\Repositories;

use App\Interfaces\Repositories\TemplateRepositoryInterface;
use App\Models\ChecklistTemplate;
use App\Models\Group;
use App\Models\Item;
use App\Models\TemplateColumn;
use Illuminate\Support\Collection;

class TemplateRepository implements TemplateRepositoryInterface
{
    public function getAll(): Collection
    {
        return ChecklistTemplate::with(['groups.items', 'columns'])->latest()->get();
    }

    public function find(int $id): ?ChecklistTemplate
    {
        return ChecklistTemplate::find($id);
    }

    public function create(array $data): ChecklistTemplate
    {
        return ChecklistTemplate::create($data);
    }

    public function update(ChecklistTemplate $template, array $data): ChecklistTemplate
    {
        $template->update($data);
        return $template;
    }

    public function delete(ChecklistTemplate $template): bool
    {
        return $template->delete();
    }

    public function createGroup(array $data): Group
    {
        return Group::create($data);
    }

    public function updateGroup(Group $group, array $data): bool
    {
        return $group->update($data);
    }

    public function deleteGroupsNotIn(ChecklistTemplate $template, array $ids): void
    {
        $template->groups()->whereNotIn('id', $ids)->delete();
    }

    public function createItem(array $data): Item
    {
        return Item::create($data);
    }

    public function updateItem(Item $item, array $data): bool
    {
        return $item->update($data);
    }

    public function deleteItemsNotIn(Group $group, array $ids): void
    {
        $group->items()->whereNotIn('id', $ids)->delete();
    }

    public function createColumn(array $data): TemplateColumn
    {
        return TemplateColumn::create($data);
    }

    public function deleteColumns(ChecklistTemplate $template): void
    {
        $template->columns()->delete();
    }

    public function loadRelations(ChecklistTemplate $template): ChecklistTemplate
    {
        $template->load(['groups.items', 'columns']);
        return $template;
    }
}
