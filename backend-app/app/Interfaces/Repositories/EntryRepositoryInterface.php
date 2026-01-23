<?php

namespace App\Interfaces\Repositories;

use App\Models\Entry;
use Illuminate\Support\Collection;

interface EntryRepositoryInterface
{
    /**
     * Find an entry by composite keys.
     *
     * @param int $runId
     * @param int $itemId
     * @param int $columnId
     * @return Entry|null
     */
    public function findByCompositeKeys(int $runId, int $itemId, int $columnId): ?Entry;

    /**
     * Create a new entry.
     *
     * @param array $data
     * @return Entry
     */
    public function create(array $data): Entry;

    /**
     * Update an existing entry.
     *
     * @param Entry $entry
     * @param array $data
     * @return Entry
     */
    public function update(Entry $entry, array $data): Entry;
}
