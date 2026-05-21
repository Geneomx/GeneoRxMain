<?php

namespace App\Http\Controllers;

use App\Models\Medication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class AdminMedicationController extends Controller
{
    // ── List ──────────────────────────────────────────────────────────────────
    public function index(Request $request): View
    {
        $query = Medication::query();

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

        return view('admin.medications.index', compact('medications'));
    }

    // ── Create form ───────────────────────────────────────────────────────────
    public function create(): View
    {
        return view('admin.medications.form', ['medication' => null]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validate($request);

        Medication::create($data);

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
        $data = $this->validate($request, $medication->id);

        $medication->update($data);

        return redirect()->route('admin.medications')
            ->with('success', "Medication \"{$medication->name}\" updated.");
    }

    // ── Toggle active ─────────────────────────────────────────────────────────
    public function toggle(Medication $medication): RedirectResponse
    {
        $medication->update(['is_active' => ! $medication->is_active]);
        $state = $medication->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "\"{$medication->name}\" {$state}.");
    }

    // ── Destroy ───────────────────────────────────────────────────────────────
    public function destroy(Medication $medication): RedirectResponse
    {
        $name = $medication->name;
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
