<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RunAssignmentLog extends Model
{
    protected $table = 'run_assignment_logs';

    protected $fillable = [
        'run_id',
        'assigned_by',
        'previous_assigned_to',
        'new_assigned_to',
        'previous_verified_by',
        'new_verified_by',
        'note',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(Run::class, 'run_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
