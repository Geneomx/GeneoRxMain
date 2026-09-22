<?php

namespace App\Support;

use App\Models\CheckIn;
use App\Models\Medication;
use App\Models\Symptom;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Carbon;

/**
 * What a doctor sees when a patient has shared their profile.
 *
 * Read-only, and built here rather than assembled in a view so there is one
 * answer to "what exactly did we hand over". Three rules shape it:
 *
 *  - Only what the patient recorded. Nothing is inferred, scored or diagnosed
 *    on their behalf, and the wording says self-reported where it is.
 *  - A rating they skipped stays null. It never becomes a zero, because a zero
 *    reads as "terrible" to a clinician rather than "not answered".
 *  - No account plumbing: no email, no password state, no billing.
 */
final class PatientSummary
{
    /** The four original wellbeing ratings plus the three body systems. */
    private const SYSTEMS = ['energy', 'mood', 'sleep', 'focus', 'digestive', 'circulation', 'immunity'];

    /** @return array<string, mixed> */
    public static function for(User $patient): array
    {
        $profile = UserProfile::where('user_id', $patient->id)->first();
        $latest = CheckIn::where('user_id', $patient->id)
            ->orderByDesc('date_checked')
            ->orderByDesc('id')
            ->first();

        return [
            'patient' => $patient->name,
            'age' => $profile?->date_of_birth ? self::age($profile->date_of_birth) : null,
            'gender' => $profile?->gender ?: null,
            'flags' => self::flags($profile),
            'medications' => Medication::where('user_id', $patient->id)
                ->orderBy('name')->pluck('name')->filter()->values()->all(),
            'symptoms' => Symptom::where('user_id', $patient->id)
                ->orderBy('symptom_name')->pluck('symptom_name')->filter()->values()->all(),
            'latest_checkin' => self::checkin($latest),
            'checkins_total' => CheckIn::where('user_id', $patient->id)->count(),
            // Every renderer has to say this out loud.
            'self_reported' => true,
        ];
    }

    /** @return array<int, string> Safety flags a clinician would want first. */
    private static function flags(?UserProfile $profile): array
    {
        if (! $profile) {
            return [];
        }

        return array_values(array_filter([
            $profile->pregnant ? 'Pregnant or breastfeeding' : null,
            $profile->kidney_disease ? 'Kidney disease' : null,
            $profile->anticoagulants ? 'Anticoagulants / blood thinners' : null,
        ]));
    }

    /** @return array<string, mixed>|null */
    private static function checkin(?CheckIn $checkin): ?array
    {
        if (! $checkin) {
            return null;
        }

        $data = is_array($checkin->data) ? $checkin->data : [];
        $wellbeing = (array) ($data['wellbeing'] ?? []);

        $ratings = [];
        foreach (self::SYSTEMS as $key) {
            // A skipped rating stays null all the way to the doctor's screen.
            $value = $wellbeing[$key] ?? null;
            $ratings[$key] = is_numeric($value) ? (int) $value : null;
        }

        return [
            'date' => $checkin->date_checked?->toDateString(),
            'adherence' => $checkin->adherence_percentage !== null
                ? (int) $checkin->adherence_percentage
                : null,
            'ratings' => $ratings,
            'side_effects' => array_values(array_filter((array) ($data['sideEffects'] ?? []))),
            // The patient's own words about their week, which is often the most
            // useful thing on this page.
            'notes' => filled($checkin->notes) ? (string) $checkin->notes : null,
        ];
    }

    private static function age(mixed $dob): ?int
    {
        try {
            return (int) Carbon::parse((string) $dob)->age;
        } catch (\Throwable) {
            return null;
        }
    }
}
