<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Checklist\Models\TemplateSession;
use App\Models\RunAssignmentLog;

class Run extends Model
{
    use HasFactory;

    protected $table = 'checklist_runs';

    protected $fillable = [
        'template_id',
        'session_id',
        'area_id',
        'status',
        'work_status',
        'assigned_to',
        'verified_by',
        'run_date',
        'started_at',
        'completed_at',
        'review_requested_at',
        'source_template_note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'run_date' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'review_requested_at' => 'datetime',
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

    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class);
    }

    public function signoffs(): HasMany
    {
        return $this->hasMany(Signoff::class);
    }

    public function assignmentLogs(): HasMany
    {
        return $this->hasMany(RunAssignmentLog::class, 'run_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function verifiedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
