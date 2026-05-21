<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPushToken extends Model
{
    protected $fillable = [
        'user_id',
        'platform',
        'expo_push_token',
        'last_seen_at',
        'disabled_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'disabled_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
