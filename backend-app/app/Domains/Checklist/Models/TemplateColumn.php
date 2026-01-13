<?php

namespace App\Domains\Checklist\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateColumn extends Model
{
    protected $fillable = ['template_id', 'session_id', 'role_id', 'sort_order'];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'template_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TemplateSession::class, 'session_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(TemplateRole::class, 'role_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(ChecklistEntry::class, 'column_id');
    }
}
