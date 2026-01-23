<?php

namespace App\Services;

use App\Interfaces\AreaServiceInterface;
use App\Interfaces\Repositories\AreaRepositoryInterface;
use App\Models\Area;
use Illuminate\Support\Collection;

class AreaService implements AreaServiceInterface
{
    protected $areaRepository;

    public function __construct(AreaRepositoryInterface $areaRepository)
    {
        $this->areaRepository = $areaRepository;
    }

    public function getAllAreas(): Collection
    {
        return $this->areaRepository->getAll();
    }

    public function createArea(array $data): Area
    {
        return $this->areaRepository->create($data);
    }

    public function updateArea(Area $area, array $data): Area
    {
        $this->areaRepository->update($area, $data);
        return $area;
    }

    public function deleteArea(Area $area): void
    {
        $this->areaRepository->delete($area);
    }
}
