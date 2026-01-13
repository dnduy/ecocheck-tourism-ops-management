<?php

namespace App\Domains\Checklist\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChecklistEntry extends Model
{
    protected $fillable = [
        'run_id',
        'item_id',
        'column_id',
        'value',
        'note',
        'photo_url',
        'checked_by',
        'checked_at',
    ];

    protected $casts = [
        'checked_at' => 'datetime',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(ChecklistRun::class, 'run_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(TemplateItem::class, 'item_id');
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(TemplateColumn::class, 'column_id');
    }

    public function checkedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_by');
    }
}
