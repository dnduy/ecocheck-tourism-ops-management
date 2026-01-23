<?php

namespace App\Repositories;

use App\Interfaces\Repositories\AreaRepositoryInterface;
use App\Models\Area;
use Illuminate\Support\Collection;

class AreaRepository implements AreaRepositoryInterface
{
    public function getAll(): Collection
    {
        return Area::orderBy('name')->get();
    }

    public function find(int $id): ?Area
    {
        return Area::find($id);
    }

    public function create(array $data): Area
    {
        return Area::create($data);
    }

    public function update(Area $area, array $data): bool
    {
        return $area->update($data);
    }

    public function delete(Area $area): bool
    {
        return $area->delete();
    }
}
