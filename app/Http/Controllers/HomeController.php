<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\Medication;
use App\Models\Symptom;
use App\Models\UserProfile;
use App\Services\AnalyticsService;
use App\Services\PlanService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class HomeController extends Controller
{
    public function treatment()
    {
        $user = auth()->user();
        $medDb = Medication::toMedDb(); // Pass DB-managed catalog to frontend

        return view('treatments', ['user' => $user, 'medDb' => $medDb]);
    }

    public function index()
    {
        return view('home');
    }

    /**
     * Get user's health profile data
     */
    public function getProfile(PlanService $plans)
    {
        $user = auth()->user();

        // Return a clean empty profile for guest sessions so they always start fresh
        if (session('is_web_guest')) {
            return response()->json([
                'user' => ['name' => 'Guest', 'email' => '', 'emailVerified' => true],
                'profile' => null,
                'account' => ['email' => '', 'consent' => false],
                'plan' => null,
                'subscription' => $plans->stateFor($user),
                'portal_state' => [],
                'medications' => [],
                'symptoms' => [],
                'checkins' => [],
            ]);
        }

        $profile = UserProfile::where('user_id', $user->id)->first();
        $medications = Medication::where('user_id', $user->id)->get();
        $symptoms = Symptom::where('user_id', $user->id)->get();
        $checkins = CheckIn::where('user_id', $user->id)
            ->orderByDesc('date_checked')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $portal = $profile?->portal_state ?? [];

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'emailVerified' => (bool) $user->email_verified_at,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
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
                'consent' => (bool) data_get($portal, 'account.consent', false),
            ],
            'plan' => data_get($portal, 'plan'),
            'subscription' => $plans->stateFor($user),
            'portal_state' => $portal,
            'medications' => $medications->map(fn ($m) => [
                'id' => $m->id,
                'medId' => $m->medication_name,
                'dose' => $m->dosage,
                'durationMonths' => $m->duration_months ?? 0,
            ]),
            'symptoms' => $symptoms->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->symptom_name,
            ]),
            'checkins' => $checkins->map(function (CheckIn $c) {
                $data = is_array($c->data) ? $c->data : [];
                if (count($data) > 0) {
                    $base = $data;
                    unset($base['id']);

                    return array_merge($base, [
                        'id' => $c->id,
                        'dateISO' => $c->date_checked?->toIso8601String() ?? (string) data_get($data, 'dateISO', ''),
                        'adherencePct' => (int) ($c->adherence_percentage ?? data_get($data, 'adherencePct', 0)),
                        'notes' => (string) ($c->notes !== null && $c->notes !== '' ? $c->notes : data_get($data, 'notes', '')),
                    ]);
                }

                return [
                    'id' => $c->id,
                    'dateISO' => $c->date_checked?->toIso8601String(),
                    'adherencePct' => (int) ($c->adherence_percentage ?? 0),
                    'notes' => (string) ($c->notes ?? ''),
                ];
            })->values(),
        ]);
    }

    /**
     * Save user health profile data
     */
    public function saveProfile(Request $request, PlanService $plans, AnalyticsService $analytics)
    {
        $user = auth()->user();

        // Guest demo sessions are read-only  silently succeed without writing anything
        if (session('is_web_guest')) {
            return response()->json(['success' => true, 'message' => 'Guest mode  data not saved.']);
        }

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
            'portal_state' => 'nullable|array',
        ]);

        $dob = null;
        if (! empty($validated['profile']['age'])) {
            $age = (int) $validated['profile']['age'];
            if ($age > 0 && $age < 150) {
                $dob = now()->subYears($age)->toDateString();
            }
        }

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

        $profile->update([
            'date_of_birth' => $dob,
            'gender' => $validated['profile']['gender'] ?? $profile->gender,
            'phone' => $validated['profile']['phone'] ?? $profile->phone,
            'pregnant' => $validated['profile']['pregnant'] ?? $profile->pregnant,
            'kidney_disease' => $validated['profile']['kidneyDisease'] ?? $profile->kidney_disease,
            'anticoagulants' => $validated['profile']['anticoagulants'] ?? $profile->anticoagulants,
        ]);

        if (array_key_exists('medications', $validated) && is_array($validated['medications'])) {
            Medication::where('user_id', $user->id)->delete();
            foreach ($validated['medications'] as $med) {
                Medication::create([
                    'user_id' => $user->id,
                    'medication_name' => $med['medId'] ?? '',
                    'dosage' => $med['dose'] ?? '',
                    'duration_months' => $med['durationMonths'] ?? 0,
                ]);
            }
        }

        if (array_key_exists('symptoms', $validated) && is_array($validated['symptoms'])) {
            Symptom::where('user_id', $user->id)->delete();
            foreach ($validated['symptoms'] as $symptom) {
                Symptom::create([
                    'user_id' => $user->id,
                    'symptom_name' => is_array($symptom) ? ($symptom['name'] ?? $symptom) : $symptom,
                ]);
            }
        }

        $mergedPortal = $profile->portal_state ?? [];
        $portalChanged = false;
        if (isset($validated['plan'])) {
            $mergedPortal['plan'] = $validated['plan'];
            $portalChanged = true;
        }
        if (isset($validated['portal_state']) && is_array($validated['portal_state'])) {
            $mergedPortal = array_replace_recursive($mergedPortal, $validated['portal_state']);
            $portalChanged = true;
        }
        if (array_key_exists('account', $validated) && is_array($validated['account'] ?? null) && array_key_exists('consent', $validated['account'] ?? [])) {
            $mergedPortal['account'] = array_merge(
                (array) ($mergedPortal['account'] ?? []),
                [
                    'consent' => (bool) $validated['account']['consent'],
                ]
            );
            $portalChanged = true;
        }
        if ($portalChanged) {
            $profile->update(['portal_state' => $mergedPortal]);
        }

        if (array_key_exists('checkins', $validated) && is_array($validated['checkins'])) {
            if ($plans->featureLocked($user, 'checkins', count($validated['checkins']))) {
                $analytics->track('locked_feature_viewed', ['feature' => 'third_checkin'], $user);

                return response()->json([
                    'message' => 'Upgrade to Plus to keep tracking weekly progress.',
                    'feature' => 'checkins',
                    'subscription' => $plans->stateFor($user),
                ], 402);
            }

            CheckIn::where('user_id', $user->id)->delete();
            foreach ($validated['checkins'] as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $data = $row;
                $dateStr = $data['dateISO'] ?? null;
                $dateChecked = $dateStr ? Carbon::parse((string) $dateStr) : now();
                Arr::forget($data, 'id');

                CheckIn::create([
                    'user_id' => $user->id,
                    'date_checked' => $dateChecked,
                    'adherence_percentage' => (int) ($data['adherencePct'] ?? 0),
                    'notes' => (string) ($data['notes'] ?? ''),
                    'data' => $data,
                    'status' => 'active',
                ]);
            }
            $profile->update(['check_ins_count' => count($validated['checkins'])]);
        }

        return response()->json(['success' => true, 'message' => 'Profile saved successfully']);
    }

    private function calculateAge($dob)
    {
        return now()->diffInYears($dob);
    }
}
