<?php

namespace App\Interfaces;

use App\Models\Incident;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface IncidentServiceInterface
{
    public function getIncidents(array $filters, int $perPage): LengthAwarePaginator;
    public function createIncident(array $data, User $reporter): Incident;
    public function updateIncident(Incident $incident, array $data): Incident;
    public function deleteIncident(Incident $incident): void;
}
