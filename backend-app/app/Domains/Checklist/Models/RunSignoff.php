<?php

namespace App\Domains\Checklist\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RunSignoff extends Model
{
    protected $fillable = [
        'run_id',
        'session_id',
        'user_id',
        'role_id',
        'role',
        'review_status',
        'review_note',
        'reviewed_at',
        'signed_by',
        'signed_at',
        'note',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(ChecklistRun::class, 'run_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TemplateSession::class, 'session_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(TemplateRole::class, 'role_id');
    }

    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by');
    }
}
