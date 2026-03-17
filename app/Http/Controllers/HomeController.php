<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserProfile;
use App\Models\Medication;
use App\Models\Symptom;
use App\Models\CheckIn;

class HomeController extends Controller
{
    public function treatment()
    {
        $user = auth()->user();
        return view('treatments', ['user' => $user]);
    }

    public function index()
    {
        return view('home');
    }

    /**
     * Get user's health profile data
     */
    public function getProfile()
    {
        $user = auth()->user();
        
        $profile = UserProfile::where('user_id', $user->id)->first();
        $medications = Medication::where('user_id', $user->id)->get();
        $symptoms = Symptom::where('user_id', $user->id)->get();
        $checkins = CheckIn::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'profile' => $profile ? [
                'age' => $profile->date_of_birth ? $this->calculateAge($profile->date_of_birth) : '',
                'gender' => $profile->gender ?? '',
                'phone' => $profile->phone ?? '',
                'pregnant' => (bool) ($profile->pregnant ?? false),
                'kidneyDisease' => (bool) ($profile->kidney_disease ?? false),
                'anticoagulants' => (bool) ($profile->anticoagulants ?? false),
                'medical_history' => $profile->medical_history ?? [],
            ] : null,
            'account' => [
                'email' => $user->email,
                'consent' => false,
            ],
            'medications' => $medications->map(fn($m) => [
                'id' => $m->id,
                'medId' => $m->medication_name,
                'dose' => $m->dosage,
                'durationMonths' => $m->duration_months ?? 0,
            ]),
            'symptoms' => $symptoms->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->symptom_name,
            ]),
            'checkins' => $checkins->map(fn($c) => [
                'id' => $c->id,
                'dateISO' => $c->date_checked?->toIso8601String(),
                'adherencePct' => $c->adherence_percentage ?? 0,
                'notes' => $c->notes ?? '',
            ]),
        ]);
    }

    /**
     * Save user health profile data
     */
    public function saveProfile(Request $request)
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'account.email' => 'nullable|email',
            'account.consent' => 'nullable|boolean',
            'profile.age' => 'nullable',
            'profile.gender' => 'nullable|string',
            'profile.phone' => 'nullable|string',
            'profile.pregnant' => 'nullable|boolean',
            'profile.kidneyDisease' => 'nullable|boolean',
            'profile.anticoagulants' => 'nullable|boolean',
            'medications' => 'nullable|array',
            'symptoms' => 'nullable|array',
            'checkins' => 'nullable|array',
            'plan' => 'nullable|array',
        ]);

        // Calculate DOB from age
        $dob = null;
        if(!empty($validated['profile']['age'])) {
            $age = (int)$validated['profile']['age'];
            if($age > 0 && $age < 150) {
                $dob = now()->subYears($age)->toDateString();
            }
        }

        // Save or create user profile
        $profile = UserProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'date_of_birth' => $dob,
                'gender' => $validated['profile']['gender'] ?? null,
                'phone' => $validated['profile']['phone'] ?? null,
                'pregnant' => $validated['profile']['pregnant'] ?? false,
                'kidney_disease' => $validated['profile']['kidneyDisease'] ?? false,
                'anticoagulants' => $validated['profile']['anticoagulants'] ?? false,
            ]
        );

        // Update existing profile
        $profile->update([
            'date_of_birth' => $dob,
            'gender' => $validated['profile']['gender'] ?? $profile->gender,
            'phone' => $validated['profile']['phone'] ?? $profile->phone,
            'pregnant' => $validated['profile']['pregnant'] ?? $profile->pregnant,
            'kidney_disease' => $validated['profile']['kidneyDisease'] ?? $profile->kidney_disease,
            'anticoagulants' => $validated['profile']['anticoagulants'] ?? $profile->anticoagulants,
        ]);

        // Save medications
        if(!empty($validated['medications'])) {
            Medication::where('user_id', $user->id)->delete();
            foreach($validated['medications'] as $med) {
                Medication::create([
                    'user_id' => $user->id,
                    'medication_name' => $med['medId'] ?? '',
                    'dosage' => $med['dose'] ?? '',
                    'duration_months' => $med['durationMonths'] ?? 0,
                ]);
            }
        }

        // Save symptoms
        if(!empty($validated['symptoms'])) {
            Symptom::where('user_id', $user->id)->delete();
            foreach($validated['symptoms'] as $symptom) {
                Symptom::create([
                    'user_id' => $user->id,
                    'symptom_name' => is_array($symptom) ? ($symptom['name'] ?? $symptom) : $symptom,
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Profile saved successfully']);
    }

    private function calculateAge($dob)
    {
        return now()->diffInYears($dob);
    }

}

