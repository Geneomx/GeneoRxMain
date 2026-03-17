<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckIn extends Model
{
    protected $table = 'check_ins';
    
    protected $fillable = [
        'user_id',
        'medications',
        'symptoms',
        'insights',
        'notes',
        'status',
    ];

    protected $casts = [
        'medications' => 'array',
        'symptoms' => 'array',
        'insights' => 'array',
    ];

    /**
     * Get the user that owns this check-in.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
