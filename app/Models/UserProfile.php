<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    protected $table = 'user_profiles';

    protected $fillable = [
        'user_id',
        'plan',
        'check_ins_count',
        'bio',
        'date_of_birth',
        'phone',
        'gender',
        'pregnant',
        'kidney_disease',
        'anticoagulants',
        'medical_history',
        'portal_state',
    ];

    protected $casts = [
        'medical_history' => 'array',
        'pregnant' => 'boolean',
        'kidney_disease' => 'boolean',
        'anticoagulants' => 'boolean',
        'portal_state' => 'array',
    ];

    /**
     * Get the user that owns this profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
