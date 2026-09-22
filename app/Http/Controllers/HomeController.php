<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\Medication;
use App\Models\Symptom;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\AnalyticsService;
use App\Support\IntroSlides;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

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
        return view('home', [
            'introSlides' => IntroSlides::all(),
        ]);
    }

    /**
     * Get user's health profile data
     */
    public function getProfile()
    {
        $user = auth()->user();

        // Return a clean empty profile for guest sessions so they always start fresh
        if (session('is_web_guest')) {
            return response()->json([
                'user' => ['name' => 'Guest', 'email' => '', 'emailVerified' => true],
                'doctor' => null,
                'profile' => null,
                'account' => ['email' => '', 'consent' => false, 'subscribed' => false],
                'plan' => null,
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
            // Present only for a registered, active clinician. The app shows
            // them their own clinic rather than the patient wizard.
            'doctor' => $user->isDoctor() ? [
                'id' => $user->doctorProfile->id,
                'name' => $user->doctorProfile->name,
                'specialty' => $user->doctorProfile->specialty,
            ] : null,
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
                'subscribed' => $user->isSubscribed(),
            ],
            'plan' => data_get($portal, 'plan'),
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
                    'dateISO' => $c->date_checked?->toIso8601String() ?? '',
                    'adherencePct' => (int) ($c->adherence_percentage ?? 0),
                    'notes' => (string) ($c->notes ?? ''),
                ];
            })->values(),
        ]);
    }

    /**
     * Save user health profile data
     */
    public function saveProfile(Request $request, AnalyticsService $analytics)
    {
        $user = auth()->user();

        // Guest demo sessions stay on this device until the user registers
        if (session('is_web_guest')) {
            return response()->json(['success' => true, 'message' => 'Guest mode — saved on this device only.']);
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
            // Check-in history is merged, not replaced, so a stale or empty
            // client array can no longer wipe it. Deletion is explicit:
            //  - deleted_checkins: ids the client intentionally removed
            //  - replace_all: the one legitimate full wipe (account reset)
            'deleted_checkins' => 'nullable|array',
            'replace_all' => 'nullable|boolean',
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
            // A payload without a usable age must not wipe a stored birth date
            'date_of_birth' => $dob ?? $profile->date_of_birth,
            'gender' => $validated['profile']['gender'] ?? $profile->gender,
            'phone' => $validated['profile']['phone'] ?? $profile->phone,
            'pregnant' => $validated['profile']['pregnant'] ?? $profile->pregnant,
            'kidney_disease' => $validated['profile']['kidneyDisease'] ?? $profile->kidney_disease,
            'anticoagulants' => $validated['profile']['anticoagulants'] ?? $profile->anticoagulants,
        ]);

        if (array_key_exists('medications', $validated) && is_array($validated['medications'])) {
            DB::transaction(function () use ($user, $validated) {
                Medication::where('user_id', $user->id)->delete();
                foreach ($validated['medications'] as $med) {
                    Medication::create([
                        'user_id' => $user->id,
                        'medication_name' => $med['medId'] ?? '',
                        'dosage' => $med['dose'] ?? '',
                        'duration_months' => $med['durationMonths'] ?? 0,
                    ]);
                }
            });
        }

        if (array_key_exists('symptoms', $validated) && is_array($validated['symptoms'])) {
            DB::transaction(function () use ($user, $validated) {
                Symptom::where('user_id', $user->id)->delete();
                foreach ($validated['symptoms'] as $symptom) {
                    Symptom::create([
                        'user_id' => $user->id,
                        'symptom_name' => is_array($symptom) ? ($symptom['name'] ?? $symptom) : $symptom,
                    ]);
                }
            });
        }

        $mergedPortal = $profile->portal_state ?? [];
        $portalChanged = false;
        if (isset($validated['plan'])) {
            $mergedPortal['plan'] = $validated['plan'];
            $portalChanged = true;
        }
        if (isset($validated['portal_state']) && is_array($validated['portal_state'])) {
            $mergedPortal = array_replace_recursive($mergedPortal, $validated['portal_state']);
            // List-valued keys must replace wholesale — index-wise merging would
            // resurrect entries the client deleted.
            foreach (['feedback', 'customMedCatalog', 'symptoms'] as $listKey) {
                if (array_key_exists($listKey, $validated['portal_state'])) {
                    $mergedPortal[$listKey] = $validated['portal_state'][$listKey];
                }
            }
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
            $this->syncCheckins($user, $profile, $validated);
        }

        return response()->json(['success' => true, 'message' => 'Profile saved successfully']);
    }

    /**
     * Merge the client's check-in list into stored history instead of wiping
     * and recreating it. This is the fix for silent data loss: a stale or empty
     * client array (from a failed hydrate, an old app version, or a torn sync)
     * used to delete every check-in the user had.
     *
     * Rules:
     *  - Rows are matched by server `id` first, then by a content signature so
     *    an id-less re-save does not duplicate an existing row.
     *  - A matched row is UPDATED; an unmatched incoming row is INSERTED.
     *  - Rows present on the server but ABSENT from the payload are PRESERVED —
     *    absence is never treated as deletion.
     *  - Deletion is explicit via `deleted_checkins` (ids), or the whole history
     *    is replaced when `replace_all` is true (the account-reset path).
     */
    private function syncCheckins(User $user, UserProfile $profile, array $validated): void
    {
        $incoming = array_values(array_filter($validated['checkins'], 'is_array'));
        $replaceAll = (bool) ($validated['replace_all'] ?? false);
        $deletedIds = array_map('strval', $validated['deleted_checkins'] ?? []);

        DB::transaction(function () use ($user, $profile, $incoming, $replaceAll, $deletedIds) {
            if ($replaceAll) {
                CheckIn::where('user_id', $user->id)->delete();
            } elseif ($deletedIds !== []) {
                CheckIn::where('user_id', $user->id)->whereIn('id', $deletedIds)->delete();
            }

            // Existing rows, indexed both by id and by content signature so an
            // incoming row can be matched either way.
            $existing = CheckIn::where('user_id', $user->id)->get();
            $byId = $existing->keyBy('id');
            $bySignature = [];
            foreach ($existing as $row) {
                $bySignature[$this->checkinSignature($row->date_checked, (int) $row->adherence_percentage, (string) $row->notes)] ??= $row;
            }

            $matchedIds = [];

            foreach ($incoming as $row) {
                // A row the client also listed for deletion must not be
                // re-created just because a stale copy lingered in the array.
                if (isset($row['id']) && in_array((string) $row['id'], $deletedIds, true)) {
                    continue;
                }

                $dateStr = $row['dateISO'] ?? null;
                $dateChecked = $dateStr ? Carbon::parse((string) $dateStr) : now();
                $adherence = (int) ($row['adherencePct'] ?? 0);
                $notes = (string) ($row['notes'] ?? '');

                $data = $row;
                Arr::forget($data, 'id');

                $rowId = isset($row['id']) ? (string) $row['id'] : null;
                $signature = $this->checkinSignature($dateChecked, $adherence, $notes);

                $match = ($rowId !== null && $byId->has($rowId))
                    ? $byId->get($rowId)
                    : ($bySignature[$signature] ?? null);

                // Merge rather than overwrite the JSON blob. A client that does
                // not know about a newer field (an older app build, or one
                // rebuilding a check-in object) would otherwise erase it on the
                // next save. Top-level array_replace, NOT recursive: `data`
                // holds lists such as symptoms.items and supplementsTaken which
                // must replace wholesale rather than deep-merge.
                $existingData = ($match && is_array($match->data)) ? $match->data : [];

                $attributes = [
                    'date_checked' => $dateChecked,
                    'adherence_percentage' => $adherence,
                    'notes' => $notes,
                    'data' => array_replace($existingData, $data),
                    'status' => 'active',
                ];

                // Never resurrect a row the client just asked to delete.
                if ($match && in_array((string) $match->id, $deletedIds, true)) {
                    $match = null;
                }

                if ($match && ! in_array($match->id, $matchedIds, true)) {
                    $match->update($attributes);
                    $matchedIds[] = $match->id;
                } else {
                    $created = CheckIn::create($attributes + ['user_id' => $user->id]);
                    $matchedIds[] = $created->id;
                }
            }

            $profile->update([
                'check_ins_count' => CheckIn::where('user_id', $user->id)->count(),
            ]);
        });
    }

    /**
     * Stable content signature for a check-in, used to match an id-less client
     * row to a stored one. Mirrors the client-side dedupe key (date + adherence
     * + notes) so a plain re-save updates in place rather than duplicating.
     */
    private function checkinSignature(mixed $dateChecked, int $adherence, string $notes): string
    {
        $day = $dateChecked instanceof \DateTimeInterface
            ? $dateChecked->format('Y-m-d')
            : (string) Carbon::parse((string) $dateChecked)->format('Y-m-d');

        return $day.'|'.$adherence.'|'.trim($notes);
    }

    private function calculateAge($dob)
    {
        // Carbon 3 diffInYears() is signed — ->age always yields a positive int
        return Carbon::parse($dob)->age;
    }
}
