<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateColumn extends Model
{
    use HasFactory;

    protected $table = 'template_columns';

    protected $fillable = [
        'template_id',
        'session_id',
        'role_id',
        'sort_order',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'template_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class, 'column_id');
    }
}
