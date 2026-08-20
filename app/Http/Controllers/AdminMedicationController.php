<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\Medication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class AdminMedicationController extends Controller
{
    /** Support tier is read-only; admin and owner may edit the catalog. */
    private function requireWrite(): void
    {
        abort_unless(auth()->user()->canWriteAdmin(), 403, 'Support role is read-only.');
    }

    // ── List ──────────────────────────────────────────────────────────────────
    public function index(Request $request): View
    {
        $query = Medication::catalog();

        if ($search = $request->input('q')) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%");
        }

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $medications = $query->orderBy('sort_order')->orderBy('name')->paginate(25)->withQueryString();

        $topTracked = $this->mostTrackedMedications();

        return view('admin.medications.index', compact('medications', 'topTracked'));
    }

    /**
     * How many patients currently have each medication in their active tracked list
     * (medications table rows with a user_id — distinct from the catalog above).
     * Resolves catalog slugs to display names; custom (patient-added) medications
     * show their raw entry since there's no shared catalog name for them.
     */
    private function mostTrackedMedications()
    {
        $counts = Medication::whereNotNull('user_id')
            ->select('medication_name', DB::raw('COUNT(*) as uses'))
            ->groupBy('medication_name')
            ->orderByDesc('uses')
            ->get();

        $catalogNames = Medication::catalog()->pluck('name', 'slug');

        return $counts->map(fn ($row) => [
            'medId' => $row->medication_name,
            'name' => $catalogNames->get($row->medication_name, $row->medication_name),
            'isCustom' => ! $catalogNames->has($row->medication_name),
            'uses' => $row->uses,
        ]);
    }

    // ── Create form ───────────────────────────────────────────────────────────
    public function create(): View
    {
        return view('admin.medications.form', ['medication' => null]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $this->requireWrite();

        $data = $this->validate($request);

        $medication = Medication::create($data);

        AdminAuditLog::record('medication.create', $medication, [], $medication->name);

        return redirect()->route('admin.medications')
            ->with('success', "Medication \"{$data['name']}\" created.");
    }

    // ── Edit form ─────────────────────────────────────────────────────────────
    public function edit(Medication $medication): View
    {
        return view('admin.medications.form', compact('medication'));
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public function update(Request $request, Medication $medication): RedirectResponse
    {
        $this->requireWrite();

        $data = $this->validate($request, $medication->id);

        $medication->update($data);

        AdminAuditLog::record('medication.update', $medication, [], $medication->name);

        return redirect()->route('admin.medications')
            ->with('success', "Medication \"{$medication->name}\" updated.");
    }

    // ── Toggle active ─────────────────────────────────────────────────────────
    public function toggle(Medication $medication): RedirectResponse
    {
        $this->requireWrite();

        $medication->update(['is_active' => ! $medication->is_active]);
        $state = $medication->is_active ? 'activated' : 'deactivated';

        AdminAuditLog::record('medication.toggle', $medication, ['state' => $state], $medication->name);

        return back()->with('success', "\"{$medication->name}\" {$state}.");
    }

    // ── Destroy ───────────────────────────────────────────────────────────────
    public function destroy(Medication $medication): RedirectResponse
    {
        $this->requireWrite();

        $name = $medication->name;

        AdminAuditLog::record('medication.delete', $medication, ['slug' => $medication->slug], $name);

        $medication->delete();

        return redirect()->route('admin.medications')
            ->with('success', "Medication \"{$name}\" deleted.");
    }

    // ── Validation helper ─────────────────────────────────────────────────────
    private function validate(Request $request, ?int $ignoreId = null): array
    {
        $slugRule = 'required|alpha_dash|max:100|unique:medications,slug'.($ignoreId ? ",{$ignoreId}" : '');

        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'slug' => $slugRule,
            'description' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'symptom_chips' => 'nullable|string',
            'claims_json' => 'nullable|string',
        ]);

        // Parse textarea JSON fields
        $symptomChips = [];
        if (! empty($validated['symptom_chips'])) {
            $symptomChips = array_filter(
                array_map('trim', explode("\n", $validated['symptom_chips']))
            );
        }

        $claims = [];
        if (! empty($validated['claims_json'])) {
            try {
                $decoded = json_decode($validated['claims_json'], true, 512, JSON_THROW_ON_ERROR);
                $claims = is_array($decoded) ? $decoded : [];
            } catch (\JsonException $e) {
                throw ValidationException::withMessages([
                    'claims_json' => 'Claims must be valid JSON (array of claim objects).',
                ]);
            }
        }

        return [
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'symptom_chips' => array_values($symptomChips),
            'claims' => $claims,
        ];
    }
}
