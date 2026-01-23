<?php

namespace App\Repositories;

use App\Interfaces\Repositories\IncidentRepositoryInterface;
use App\Models\Incident;
use Illuminate\Pagination\LengthAwarePaginator;

class IncidentRepository implements IncidentRepositoryInterface
{
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Incident::with(['area', 'run']);

        if (isset($filters['area_id'])) {
            $query->where('area_id', $filters['area_id']);
        }
        if (isset($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('occurred_at')->paginate($perPage);
    }

    public function create(array $data): Incident
    {
        return Incident::create($data);
    }

    public function update(Incident $incident, array $data): Incident
    {
        $incident->update($data);
        return $incident;
    }

    public function delete(Incident $incident): bool
    {
        return $incident->delete();
    }
}
