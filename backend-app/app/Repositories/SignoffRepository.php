<?php

namespace App\Repositories;

use App\Interfaces\Repositories\SignoffRepositoryInterface;
use App\Domains\Checklist\Models\RunSignoff as Signoff;

class SignoffRepository implements SignoffRepositoryInterface
{
    public function create(array $data): Signoff
    {
        return Signoff::create($data);
    }
}
