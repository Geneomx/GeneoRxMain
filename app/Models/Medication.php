<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Medication extends Model
{
    protected $fillable = [
        'user_id',
        'medication_name',
        'dosage',
        'duration_months',
        'name',
        'slug',
        'description',
        'symptom_chips',
        'claims',
    ];

    protected $casts = [
        'symptom_chips' => 'array',
        'claims' => 'array',
    ];

    /**
     * Get the user that owns this medication.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
