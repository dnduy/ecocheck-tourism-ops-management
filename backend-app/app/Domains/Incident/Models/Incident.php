<?php

namespace App\Domains\Incident\Models;

use App\Domains\Checklist\Models\Area;
use App\Domains\Checklist\Models\ChecklistRun;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Incident extends Model
{
    protected $fillable = [
        'area_id',
        'run_id',
        'title',
        'description',
        'severity',
        'status',
        'assigned_to',
        'resolution_note',
    ];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(ChecklistRun::class, 'run_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
