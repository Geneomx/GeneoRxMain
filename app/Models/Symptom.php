<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Symptom extends Model
{
    protected $fillable = [
        'user_id',
        'symptom_name',
        'name',
        'slug',
        'description',
    ];

    /**
     * Get the user that owns this symptom.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
