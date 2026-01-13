<?php

namespace App\Domains\Checklist\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateRole extends Model
{
    protected $fillable = ['template_id', 'name', 'sort_order'];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'template_id');
    }

    public function columns(): HasMany
    {
        return $this->hasMany(TemplateColumn::class, 'role_id');
    }

    public function signoffs(): HasMany
    {
        return $this->hasMany(RunSignoff::class, 'role_id');
    }
}
