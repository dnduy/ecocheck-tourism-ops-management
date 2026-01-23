<?php

namespace App\Services;

use App\Interfaces\SignoffServiceInterface;
use App\Interfaces\Repositories\SignoffRepositoryInterface;
use App\Models\Signoff;
use App\Models\User;

class SignoffService implements SignoffServiceInterface
{
    protected $signoffRepository;

    public function __construct(SignoffRepositoryInterface $signoffRepository)
    {
        $this->signoffRepository = $signoffRepository;
    }

    public function createSignoff(array $data, User $signer): Signoff
    {
        $data['user_id'] = $signer->id;
        $data['signed_at'] = now();

        return $this->signoffRepository->create($data);
    }
}
