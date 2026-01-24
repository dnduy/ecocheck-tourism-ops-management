<?php

namespace App\Interfaces\Repositories;

use App\Domains\Checklist\Models\RunSignoff as Signoff;

interface SignoffRepositoryInterface
{
    public function create(array $data): Signoff;
}
