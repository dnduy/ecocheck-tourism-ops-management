<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateColumn extends Model
{
    use HasFactory;

    protected $fillable = [
        'checklist_template_id',
        'label',
        'type',
        'options',
        'sort_order',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'checklist_template_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class, 'column_id');
    }
}
