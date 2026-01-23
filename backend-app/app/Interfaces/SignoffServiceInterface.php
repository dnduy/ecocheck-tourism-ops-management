<?php

namespace App\Interfaces;

use App\Models\Signoff;
use App\Models\User;

interface SignoffServiceInterface
{
    public function createSignoff(array $data, User $signer): Signoff;
}
