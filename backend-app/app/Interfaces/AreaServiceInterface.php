<?php

namespace App\Interfaces;

use App\Models\Area;
use Illuminate\Support\Collection;

interface AreaServiceInterface
{
    public function getAllAreas(): Collection;
    public function createArea(array $data): Area;
    public function updateArea(Area $area, array $data): Area;
    public function deleteArea(Area $area): void;
}
