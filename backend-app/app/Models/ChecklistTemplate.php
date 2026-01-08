<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ChecklistTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
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
        return $this->hasMany(Group::class);
    }

    public function columns(): HasMany
    {
        return $this->hasMany(TemplateColumn::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'template_roles')->withTimestamps();
    }
}
