@extends('admin.layout')
@section('title', $medication ? 'Edit  '.$medication->name : 'Add Medication')

@section('content')
@php
  $isEdit   = !is_null($medication);
  $action   = $isEdit ? route('admin.medications.update', $medication) : route('admin.medications.store');
  $claimsJson = $isEdit && $medication->claims
      ? json_encode($medication->claims, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
      : "[\n  {\n    \"nutrient\": \"Vitamin B12\",\n    \"source_quality\": \"High\",\n    \"citations\": [\"PMID:26900641\"],\n    \"notes\": [\"Example note.\"]\n  }\n]";
  $symptomText = $isEdit ? implode("\n", $medication->symptom_chips ?? []) : '';
@endphp

<div class="page-header">
  <div>
    <div style="margin-bottom:6px;">
      <a href="{{ route('admin.medications') }}" style="font-size:13px;color:var(--text-muted);">← Medications</a>
    </div>
    <h1>{{ $isEdit ? 'Edit: '.$medication->name : 'Add Medication' }}</h1>
    <p>{{ $isEdit ? 'Update the medication entry in the catalog.' : 'Create a new medication in the database catalog.' }}</p>
  </div>
</div>

@if($errors->any())
  <div class="flash error" style="margin-bottom:20px;">
    @foreach($errors->all() as $e)<div>{{ $e }}</div>@endforeach
  </div>
@endif

<form method="POST" action="{{ $action }}" id="medForm">
  @csrf
  @if($isEdit) @method('PUT') @endif

  {{-- ── BASIC INFO ── --}}
  <div class="admin-card">
    <div class="admin-card-hd"><div><h2>Basic information</h2></div></div>
    <div class="admin-card-bd">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field-group">
          <label class="field-label">Name <span style="color:#e53e3e;">*</span></label>
          <input type="text" name="name" value="{{ old('name', $medication?->name) }}"
                 placeholder="e.g. Metformin" required style="width:100%;">
          <div class="field-hint">Display name shown to users in the medication picker.</div>
        </div>
        <div class="field-group">
          <label class="field-label">Slug (ID) <span style="color:#e53e3e;">*</span></label>
          <input type="text" name="slug" id="slugField"
                 value="{{ old('slug', $medication?->slug) }}"
                 placeholder="e.g. metformin" required
                 style="width:100%;font-family:monospace;letter-spacing:.3px;"
                 pattern="[a-z0-9\-_]+" title="Lowercase letters, numbers, hyphens and underscores only">
          <div class="field-hint">Unique machine ID. Lowercase letters, numbers, hyphens only.</div>
        </div>
      </div>

      <div class="field-group">
        <label class="field-label">Description <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
        <input type="text" name="description" value="{{ old('description', $medication?->description) }}"
               placeholder="Short note for admin reference only" style="width:100%;">
      </div>

      <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;align-items:end;">
        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Sort order</label>
          <input type="number" name="sort_order" min="0"
                 value="{{ old('sort_order', $medication?->sort_order ?? 0) }}" style="width:100%;">
          <div class="field-hint">Lower numbers appear first.</div>
        </div>
        <div style="padding-bottom:4px;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
            <input type="hidden" name="is_active" value="0">
            <input type="checkbox" name="is_active" id="isActive" value="1"
                   {{ old('is_active', $medication?->is_active ?? true) ? 'checked' : '' }}
                   style="width:16px;height:16px;accent-color:var(--teal);flex-shrink:0;">
            <span style="font-size:13.5px;font-weight:500;color:var(--text);">Active  shown to users in medication picker</span>
          </label>
        </div>
      </div>

    </div>
  </div>

  {{-- ── SYMPTOM CHIPS ── --}}
  <div class="admin-card">
    <div class="admin-card-hd">
      <div>
        <h2>Symptom chips</h2>
        <p>One symptom per line. Shown as quick-select tags when a user picks this medication.</p>
      </div>
    </div>
    <div class="admin-card-bd">
      <div class="field-group" style="margin-bottom:0;">
        <label class="field-label">Symptoms (one per line)</label>
        <textarea name="symptom_chips" rows="8"
                  placeholder="Fatigue&#10;Brain fog&#10;Tingling hands/feet&#10;Muscle aches"
                  style="width:100%;font-family:monospace;font-size:13px;">{{ old('symptom_chips', $symptomText) }}</textarea>
        <div class="field-hint">
          Common names: Fatigue, Low energy, Brain fog, Poor focus, Muscle aches, Muscle cramps,
          GI discomfort, Nausea, Dizziness, Headache, Tingling hands/feet, Heart palpitations,
          Swelling, Anxiety, Sleep changes, Mood changes, Constipation, Hair loss.
        </div>
      </div>
    </div>
  </div>

  {{-- ── CLAIMS JSON ── --}}
  <div class="admin-card">
    <div class="admin-card-hd">
      <div>
        <h2>Nutrient claims (JSON)</h2>
        <p>Evidence-backed nutrient depletion claims. Must be valid JSON.</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="formatJson()">Format JSON</button>
    </div>
    <div class="admin-card-bd">
      @if($errors->has('claims_json'))
        <div class="flash error" style="margin-bottom:12px;">{{ $errors->first('claims_json') }}</div>
      @endif
      <div class="field-group" style="margin-bottom:0;">
        <label class="field-label">Claims array</label>
        <textarea name="claims_json" id="claimsJson" rows="18"
                  style="width:100%;font-family:monospace;font-size:12.5px;">{{ old('claims_json', $claimsJson) }}</textarea>
        <div class="field-hint" style="margin-top:8px;">
          <strong>Schema per item:</strong>
          <code style="font-size:11.5px;background:var(--bg-muted);padding:2px 7px;border-radius:4px;display:inline-block;margin-top:4px;">
            { "nutrient": "Vitamin B12", "source_quality": "High | Moderate | Low", "citations": ["PMID:12345678"], "notes": ["Note text."] }
          </code>
        </div>
      </div>
    </div>
  </div>

  {{-- ── SUBMIT ── --}}
  <div style="display:flex;gap:12px;padding-top:4px;">
    <button type="submit" class="btn btn-primary">
      {{ $isEdit ? 'Save changes' : 'Create medication' }}
    </button>
    <a href="{{ route('admin.medications') }}" class="btn btn-ghost">Cancel</a>
  </div>
</form>

<script>
// Auto-generate slug from name on create
@if(!$isEdit)
document.querySelector('[name="name"]').addEventListener('input', function () {
  const slugField = document.getElementById('slugField');
  if (!slugField.dataset.touched) {
    slugField.value = this.value.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
});
document.getElementById('slugField').addEventListener('input', function () {
  this.dataset.touched = '1';
});
@endif

function formatJson() {
  const ta = document.getElementById('claimsJson');
  try {
    ta.value = JSON.stringify(JSON.parse(ta.value), null, 2);
    ta.style.borderColor = '';
  } catch(e) {
    ta.style.borderColor = '#e53e3e';
    alert('Invalid JSON: ' + e.message);
  }
}
</script>
@endsection
