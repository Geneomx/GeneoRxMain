<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medication extends Model
{
    protected $fillable = [
        // Catalog fields (admin-managed)
        'name',
        'slug',
        'description',
        'symptom_chips',
        'claims',
        'is_active',
        'sort_order',
        // User-tracking fields (legacy user records)
        'user_id',
        'medication_name',
        'dosage',
        'duration_months',
    ];

    protected $casts = [
        'symptom_chips' => 'array',
        'claims' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Return the JS-ready MED_DB array for injection into the frontend.
     */
    public static function toMedDb(): array
    {
        return static::active()
            ->whereNotNull('slug')   // exclude legacy user-tracking rows (no slug)
            ->whereNotNull('name')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->slug,
                'name' => $m->name,
                'symptomChips' => $m->symptom_chips ?? [],
                'claims' => $m->claims ?? [],
            ])
            ->toArray();
    }
}
