<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Area;
use App\Models\Item;
use App\Domains\Checklist\Models\TemplateSession;
use App\Domains\Checklist\Models\TemplateRole;

class ChecklistTemplate extends Model
{
    use HasFactory;

    protected $table = 'checklist_templates';

    protected $fillable = [
        'area_id',
        'name',
        'description',
        'version',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'bool',
    ];

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class, 'template_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TemplateSession::class, 'template_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'template_id');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function columns(): HasMany
    {
        return $this->hasMany(TemplateColumn::class, 'template_id');
    }

    public function roles(): HasMany
    {
        return $this->hasMany(TemplateRole::class, 'template_id');
    }
}
