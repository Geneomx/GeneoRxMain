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
use Illuminate\Validation\ValidationException;

class HomeController extends Controller
{
    /**
     * Keys every hydrated check-in must carry so clients can read them
     * without guarding, even for rows stored before `data` existed.
     */
    private const CHECKIN_ENVELOPE_DEFAULTS = [
        'symptoms' => ['items' => []],
        'wellbeing' => ['energy' => null, 'mood' => null, 'sleep' => null, 'focus' => null, 'digestive' => null, 'circulation' => null, 'immunity' => null],
        'supplementsTaken' => [],
        'supplementsPlanned' => [],
        'sideEffects' => '',
        'medicationDoses' => [],
    ];

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
            'medications' => $medications->map(fn ($m) => array_merge([
                'id' => $m->id,
                'medId' => $m->medication_name,
                'dose' => $m->dosage,
                'durationMonths' => $m->duration_months ?? 0,
            ], Arr::only((array) ($portal['medicationDetails'][$m->medication_name] ?? []), ['strength', 'frequency', 'startDate', 'modelInputsConfirmed']))),
            'symptoms' => $symptoms->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->symptom_name,
            ]),
            'checkins' => $checkins->map(function (CheckIn $c) {
                // Every row leaves with the same typed envelope, whether it was
                // stored with a full JSON blob or only the denormalized columns
                // (legacy / data-less rows). Stored values win over defaults;
                // top-level array_replace keeps list-valued keys intact.
                $data = is_array($c->data) ? $c->data : [];
                unset($data['id']);

                $row = array_replace(self::CHECKIN_ENVELOPE_DEFAULTS, $data, [
                    'id' => $c->id,
                    'dateISO' => $c->date_checked?->toIso8601String() ?? (string) data_get($data, 'dateISO', ''),
                    'adherencePct' => $c->adherence_percentage === null ? null : (int) $c->adherence_percentage,
                    'notes' => (string) ($c->notes !== null && $c->notes !== '' ? $c->notes : data_get($data, 'notes', '')),
                ]);
                $row['symptoms'] = array_replace(self::CHECKIN_ENVELOPE_DEFAULTS['symptoms'], is_array($row['symptoms']) ? $row['symptoms'] : []);
                $row['wellbeing'] = array_replace(self::CHECKIN_ENVELOPE_DEFAULTS['wellbeing'], is_array($row['wellbeing']) ? $row['wellbeing'] : []);

                return $row;
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
            'profile.age' => 'nullable|integer|between:1,120',
            'profile.gender' => 'nullable|string',
            'profile.phone' => 'nullable|string',
            'profile.pregnant' => 'nullable|boolean',
            'profile.kidneyDisease' => 'nullable|boolean',
            'profile.anticoagulants' => 'nullable|boolean',
            'medications' => 'nullable|array',
            'medications.*' => 'required|array',
            'medications.*.medId' => 'required|string|max:255',
            'medications.*.dose' => 'nullable|string|max:100',
            'medications.*.strength' => 'nullable|string|max:100',
            'medications.*.frequency' => 'nullable|string|max:100',
            'medications.*.startDate' => 'nullable|date_format:Y-m-d',
            'portal_state.symptoms.details.*.onsetDate' => 'nullable|date_format:Y-m-d',
            'portal_state.symptoms.details.*.severity' => 'nullable|in:mild,moderate,severe',
            'portal_state.symptoms.details.*.notes' => 'nullable|string|max:2000',
            'medications.*.modelInputsConfirmed' => 'nullable|boolean',
            'medications.*.durationMonths' => 'nullable|numeric|min:0|max:1800',
            'symptoms' => 'nullable|array',
            'checkins' => 'nullable|array',
            'checkins.*' => 'required|array',
            'checkins.*.clientId' => 'nullable|uuid|distinct',
            'checkins.*.dateISO' => 'required|date|before:tomorrow',
            'checkins.*.adherencePct' => 'nullable|integer|between:0,100',
            'checkins.*.medicationDoses' => 'nullable|array|max:100',
            'checkins.*.medicationDoses.*.medId' => 'required|string|max:255',
            'checkins.*.medicationDoses.*.medicationName' => 'required|string|max:255',
            'checkins.*.medicationDoses.*.status' => 'required|in:all,some,unsure,not-scheduled',
            'checkins.*.medicationDoses.*.scheduled' => 'nullable|integer|min:1|max:100000',
            'checkins.*.medicationDoses.*.missed' => 'nullable|integer|min:0|max:100000',
            'checkins.*.wellbeing' => 'nullable|array',
            'checkins.*.wellbeing.energy' => 'nullable|numeric|between:0,10',
            'checkins.*.wellbeing.mood' => 'nullable|numeric|between:0,10',
            'checkins.*.wellbeing.sleep' => 'nullable|numeric|between:0,10',
            'checkins.*.wellbeing.focus' => 'nullable|numeric|between:0,10',
            'checkins.*.wellbeing.digestive' => 'nullable|numeric|between:0,10',
            'checkins.*.wellbeing.circulation' => 'nullable|numeric|between:0,10',
            'checkins.*.wellbeing.immunity' => 'nullable|numeric|between:0,10',
            'checkins.*.notes' => 'nullable|string|max:10000',
            'plan' => 'nullable|array',
            'portal_state' => 'nullable|array',
            'portal_state.summaryOverview' => 'nullable|array:7,30,all|max:3',
            'portal_state.summaryOverview.*' => 'nullable|string|max:2000',
            // Check-in history is merged, not replaced, so a stale or empty
            // client array can no longer wipe it. Deletion is explicit:
            //  - deleted_checkins: ids the client intentionally removed
            //  - replace_all: the one legitimate full wipe (account reset)
            'deleted_checkins' => 'nullable|array',
            'replace_all' => 'nullable|boolean',
        ]);

        // Portal state is versioned JSON too. Nested validation must not drop
        // sibling keys such as wellbeingBaseline or reminderPreferences.
        if (is_array($request->input('portal_state'))) {
            $validated['portal_state'] = $request->input('portal_state');
        }

        // Check-ins intentionally carry versioned JSON (wellbeing, completion,
        // symptom ratings, supplements and future fields). Nested validation
        // above checks the required envelope; retain the full validated rows
        // rather than Laravel's projection of only the named child fields.
        if (isset($validated['checkins'])) {
            $validated['checkins'] = $request->input('checkins');
        }

        // Reject invalid dose counts before any part of the profile is written.
        foreach ($validated['checkins'] ?? [] as $index => $checkin) {
            if (! array_key_exists('medicationDoses', $checkin)) {
                continue;
            }
            $entries = $checkin['medicationDoses'] ?? [];
            $ids = [];
            foreach ($entries as $entry) {
                if (in_array($entry['medId'], $ids, true) || ($entry['status'] === 'some' && (! isset($entry['scheduled'], $entry['missed']) || $entry['missed'] > $entry['scheduled']))) {
                    throw ValidationException::withMessages(["checkins.$index.medicationDoses" => 'Enter valid scheduled and missed counts for each medication.']);
                }
                $ids[] = $entry['medId'];
            }
        }

        return DB::transaction(function () use ($user, $validated) {
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
                'date_of_birth' => array_key_exists('age', $validated['profile'] ?? []) ? $dob : $profile->date_of_birth,
                'gender' => $validated['profile']['gender'] ?? $profile->gender,
                'phone' => array_key_exists('phone', $validated['profile'] ?? []) ? $validated['profile']['phone'] : $profile->phone,
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
            if (array_key_exists('medications', $validated) && is_array($validated['medications'])) {
                $details = [];
                foreach ($validated['medications'] as $med) {
                    $id = $med['medId'];
                    $details[$id] = array_merge((array) ($mergedPortal['medicationDetails'][$id] ?? []), Arr::only($med, ['strength', 'frequency', 'startDate', 'modelInputsConfirmed']));
                }
                $mergedPortal['medicationDetails'] = $details;
                $portalChanged = true;
            }
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
        });
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
            $byClientId = $existing->filter(fn ($row) => is_string(data_get($row->data, 'clientId')))->keyBy(fn ($row) => data_get($row->data, 'clientId'));
            $bySignature = [];
            foreach ($existing as $row) {
                $bySignature[$this->checkinSignature($row->date_checked, $row->adherence_percentage === null ? null : (int) $row->adherence_percentage, (string) $row->notes)] ??= $row;
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
                $adherence = isset($row['adherencePct']) ? (int) $row['adherencePct'] : null;
                // The integer rule accepts numeric strings; store real ints so
                // clients never read "7" where they expect 7.
                if (is_array($row['medicationDoses'] ?? null)) {
                    foreach ($row['medicationDoses'] as $i => $entry) {
                        foreach (['scheduled', 'missed'] as $count) {
                            if (is_array($entry) && isset($entry[$count])) {
                                $row['medicationDoses'][$i][$count] = (int) $entry[$count];
                            }
                        }
                    }
                }
                if (array_key_exists('medicationDoses', $row)) {
                    $entries = array_values(array_filter($row['medicationDoses'] ?? [], fn ($entry) => $entry['status'] !== 'not-scheduled'));
                    if ($entries === [] || collect($entries)->contains(fn ($entry) => $entry['status'] === 'unsure')) {
                        $adherence = null;
                    } elseif (collect($entries)->every(fn ($entry) => $entry['status'] === 'all')) {
                        $adherence = 100;
                    } elseif (collect($entries)->contains(fn ($entry) => ! isset($entry['scheduled']) || $entry['scheduled'] < 1)) {
                        $adherence = null;
                    } else {
                        $adherence = (int) round((array_sum(array_column($entries, 'scheduled')) - collect($entries)->sum(fn ($entry) => $entry['status'] === 'all' ? 0 : ($entry['missed'] ?? 0))) / array_sum(array_column($entries, 'scheduled')) * 100);
                    }
                    $row['adherencePct'] = $adherence;
                }
                $notes = (string) ($row['notes'] ?? '');

                $data = $row;
                Arr::forget($data, 'id');

                $rowId = isset($row['id']) ? (string) $row['id'] : null;
                $signature = $this->checkinSignature($dateChecked, $adherence, $notes);

                $match = ($rowId !== null && $byId->has($rowId))
                    ? $byId->get($rowId)
                    : (isset($row['clientId']) ? $byClientId->get($row['clientId']) : ($bySignature[$signature] ?? null));

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
    private function checkinSignature(mixed $dateChecked, ?int $adherence, string $notes): string
    {
        $day = $dateChecked instanceof \DateTimeInterface
            ? $dateChecked->format('Y-m-d')
            : (string) Carbon::parse((string) $dateChecked)->format('Y-m-d');

        return $day.'|'.($adherence === null ? 'unknown' : $adherence).'|'.trim($notes);
    }

    private function calculateAge($dob)
    {
        // Carbon 3 diffInYears() is signed — ->age always yields a positive int
        return Carbon::parse($dob)->age;
    }
}
