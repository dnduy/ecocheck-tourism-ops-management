<?php

namespace App\Repositories;

use App\Interfaces\Repositories\EntryRepositoryInterface;
use App\Models\Entry;

class EntryRepository implements EntryRepositoryInterface
{
    /**
     * Find an entry by composite keys (run_id, item_id, column_id).
     * Note: Models traditionally require a single primary key, but we can query by attributes.
     * If the 'Entry' model isn't configured for composite keys, we use `where`.
     */
    public function findByCompositeKeys(int $runId, int $itemId, int $columnId): ?Entry
    {
        return Entry::where('run_id', $runId)
            ->where('item_id', $itemId)
            ->where('column_id', $columnId)
            ->first();
    }

    public function create(array $data): Entry
    {
        // Using Eloquent create which handles timestamps automatically
        return Entry::create($data);
    }

    public function update(Entry $entry, array $data): Entry
    {
        $entry->update($data);
        return $entry;
    }
}
