<?php

namespace App\Domains\Checklist\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChecklistRun extends Model
{
    protected $fillable = [
        'template_id',
        'session_id',
        'area_id',
        'run_date',
        'status',
        'assigned_to',
        'verified_by',
        'work_status',
        'started_at',
        'completed_at',
        'review_requested_at',
        'created_by',
    ];

    protected $casts = [
        'run_date' => 'date',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'template_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TemplateSession::class, 'session_id');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(ChecklistEntry::class, 'run_id');
    }

    public function signoffs(): HasMany
    {
        return $this->hasMany(RunSignoff::class, 'run_id');
    }
}
