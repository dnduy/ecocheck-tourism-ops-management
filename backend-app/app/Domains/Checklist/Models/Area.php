<?php

namespace App\Domains\Checklist\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Area extends Model
{
    protected $fillable = ['name'];

    public function templates(): HasMany
    {
        return $this->hasMany(ChecklistTemplate::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(ChecklistRun::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }
}
