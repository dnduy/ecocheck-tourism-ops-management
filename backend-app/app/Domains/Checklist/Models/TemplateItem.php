<?php

namespace App\Domains\Checklist\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateItem extends Model
{
    protected $fillable = ['template_id', 'group_id', 'content', 'sort_order'];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'template_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(TemplateGroup::class, 'group_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(ChecklistEntry::class, 'item_id');
    }
}
