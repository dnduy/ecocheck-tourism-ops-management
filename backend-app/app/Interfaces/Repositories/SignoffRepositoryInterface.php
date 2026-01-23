<?php

namespace App\Interfaces\Repositories;

use App\Models\Signoff;

interface SignoffRepositoryInterface
{
    public function create(array $data): Signoff;
}
