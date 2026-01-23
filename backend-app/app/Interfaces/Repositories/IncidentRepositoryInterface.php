<?php

namespace App\Interfaces\Repositories;

use App\Models\Incident;
use Illuminate\Pagination\LengthAwarePaginator;

interface IncidentRepositoryInterface
{
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator;
    public function create(array $data): Incident;
    public function update(Incident $incident, array $data): Incident;
    public function delete(Incident $incident): bool;
}
