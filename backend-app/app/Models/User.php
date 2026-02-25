<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Checklist\Models\RunSignoff;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected string $guard_name = 'sanctum';

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function getRoleAttribute(): ?string
    {
        return $this->getRoleNames()->first();
    }

    public function areas(): BelongsToMany
    {
        return $this->belongsToMany(Area::class)->withTimestamps();
    }

    public function runs(): HasMany
    {
        return $this->hasMany(Run::class, 'created_by');
    }

    public function assignedRuns(): HasMany
    {
        return $this->hasMany(Run::class, 'assigned_to');
    }

    public function verifiedRuns(): HasMany
    {
        return $this->hasMany(Run::class, 'verified_by');
    }

    public function signoffs(): HasMany
    {
        return $this->hasMany(RunSignoff::class, 'signed_by');
    }

    public function incidentsReported(): HasMany
    {
        return $this->hasMany(Incident::class, 'reported_by');
    }

    public function incidentsResolved(): HasMany
    {
        return $this->hasMany(Incident::class, 'resolved_by');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }

    public function isSupervisor(): bool
    {
        return $this->hasRole('supervisor');
    }

    public function isStaff(): bool
    {
        return $this->hasRole('staff');
    }
}
