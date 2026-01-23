<?php

namespace App\Interfaces;

use Illuminate\Support\Collection;

interface StatsServiceInterface
{
    /**
     * Get statistics for staff users (staff and maintenance roles).
     *
     * @return Collection
     */
    public function getStaffStats(): Collection;

    /**
     * Get statistics for supervisors.
     *
     * @return Collection
     */
    public function getSupervisorStats(): Collection;

    /**
     * Get detailed work stats for a specific staff member.
     *
     * @param int $staffId
     * @return array
     */
    public function getStaffDetail(int $staffId): array;
}
