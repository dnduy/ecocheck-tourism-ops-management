<?php

namespace App\Services;

use App\Interfaces\EntryServiceInterface;
use App\Interfaces\Repositories\EntryRepositoryInterface;
use App\Models\Entry;
use Illuminate\Support\Facades\DB;

class EntryService implements EntryServiceInterface
{
    protected $entryRepository;

    public function __construct(EntryRepositoryInterface $entryRepository)
    {
        $this->entryRepository = $entryRepository;
    }

    public function upsertEntry(array $data): Entry
    {
        return DB::transaction(function () use ($data) {
            $existingEntry = $this->entryRepository->findByCompositeKeys(
                $data['run_id'],
                $data['item_id'],
                $data['column_id']
            );

            if ($existingEntry) {
                return $this->entryRepository->update($existingEntry, [
                    'value' => $data['value'],
                    'note' => $data['note'] ?? null,
                ]);
            } else {
                return $this->entryRepository->create($data);
            }
        });
    }
}
