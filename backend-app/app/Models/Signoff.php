<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Signoff extends Model
{
    use HasFactory;

    protected $fillable = [
        'run_id',
        'role',
        'user_id',
        'note',
        'signed_at',
        'review_status',
        'review_note',
        'reviewed_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(Run::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
