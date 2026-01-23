<?php

namespace App\Repositories;

use App\Interfaces\Repositories\SignoffRepositoryInterface;
use App\Models\Signoff;

class SignoffRepository implements SignoffRepositoryInterface
{
    public function create(array $data): Signoff
    {
        return Signoff::create($data);
    }
}
