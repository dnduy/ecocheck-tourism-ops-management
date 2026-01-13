<?php

namespace App\Domains\Checklist\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateGroup extends Model
{
    protected $fillable = ['template_id', 'title', 'sort_order'];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'template_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TemplateItem::class, 'group_id');
    }
}
