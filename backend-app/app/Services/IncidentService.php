<?php

namespace App\Services;

use App\Interfaces\IncidentServiceInterface;
use App\Interfaces\Repositories\IncidentRepositoryInterface;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class IncidentService implements IncidentServiceInterface
{
    protected $incidentRepository;

    public function __construct(IncidentRepositoryInterface $incidentRepository)
    {
        $this->incidentRepository = $incidentRepository;
    }

    public function getIncidents(array $filters, int $perPage): LengthAwarePaginator
    {
        return $this->incidentRepository->getAll($filters, $perPage);
    }

    public function createIncident(array $data, User $reporter): Incident
    {
        $data['status'] = 'open';
        $data['reported_by'] = $reporter->id;
        $data['occurred_at'] = $data['occurred_at'] ?? now();

        return $this->incidentRepository->create($data);
    }

    public function updateIncident(Incident $incident, array $data): Incident
    {
        return $this->incidentRepository->update($incident, $data);
    }

    public function deleteIncident(Incident $incident): void
    {
        $this->incidentRepository->delete($incident);
    }
}
