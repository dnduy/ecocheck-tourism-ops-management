<?php

namespace App\Interfaces;

use App\Models\Entry;

interface EntryServiceInterface
{
    /**
     * Update or insert an entry checklist item.
     *
     * @param array $data
     * @return Entry
     */
    public function upsertEntry(array $data): Entry;
}
