<?php

namespace App\Interfaces\Repositories;

use App\Models\Area;
use Illuminate\Support\Collection;

interface AreaRepositoryInterface
{
    public function getAll(): Collection;
    public function find(int $id): ?Area;
    public function create(array $data): Area;
    public function update(Area $area, array $data): bool;
    public function delete(Area $area): bool;
}
