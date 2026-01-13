<?php

namespace App\Domains\Checklist\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChecklistTemplate extends Model
{
    protected $fillable = ['area_id', 'name', 'orientation', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TemplateSession::class, 'template_id');
    }

    public function roles(): HasMany
    {
        return $this->hasMany(TemplateRole::class, 'template_id');
    }

    public function groups(): HasMany
    {
        return $this->hasMany(TemplateGroup::class, 'template_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TemplateItem::class, 'template_id');
    }

    public function columns(): HasMany
    {
        return $this->hasMany(TemplateColumn::class, 'template_id');
    }

    public function runs(): HasMany
    {
        return $this->hasMany(ChecklistRun::class, 'template_id');
    }
}
