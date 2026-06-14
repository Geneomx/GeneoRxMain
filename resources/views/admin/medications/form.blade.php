@extends('admin.layout')
@section('title', $medication ? 'Edit  '.$medication->name : 'Add Medication')

@section('content')
@php
  $isEdit = !is_null($medication);
  $action = $isEdit ? route('admin.medications.update', $medication) : route('admin.medications.store');
  $symptomText = $isEdit ? implode("\n", $medication->symptom_chips ?? []) : '';

  $claimsInitial = [];
  if (old('claims_json')) {
    try {
      $decoded = json_decode(old('claims_json'), true, 512, JSON_THROW_ON_ERROR);
      $claimsInitial = is_array($decoded) ? $decoded : [];
    } catch (\JsonException $e) {
      $claimsInitial = [];
    }
  } elseif ($isEdit && $medication->claims) {
    $claimsInitial = $medication->claims;
  }
@endphp

<style>
  .med-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 720px) { .med-form-grid { grid-template-columns: 1fr; } }

  .symptom-preview { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; min-height: 28px; }
  .symptom-chip {
    display: inline-flex; align-items: center;
    padding: 4px 10px; border-radius: 999px;
    font-size: 12px; font-weight: 600;
    background: var(--teal-50); color: var(--teal-dark);
    border: 1px solid var(--teal-100);
  }
  .symptom-chip.empty { color: var(--text-dim); background: var(--bg-muted); border-color: var(--border-soft); font-weight: 500; }

  .claims-empty {
    padding: 28px 20px; text-align: center;
    border: 1px dashed var(--border); border-radius: var(--r);
    color: var(--text-muted); font-size: 13.5px;
    background: var(--bg-soft);
  }

  .claim-card {
    border: 1px solid var(--border-soft);
    border-radius: var(--r-lg);
    background: var(--bg-soft);
    margin-bottom: 14px;
    overflow: hidden;
  }
  .claim-card:last-child { margin-bottom: 0; }
  .claim-card-hd {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 16px;
    background: var(--bg);
    border-bottom: 1px solid var(--border-soft);
  }
  .claim-card-title { font-size: 13px; font-weight: 700; color: var(--text); }
  .claim-card-bd { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

  .quality-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .quality-btn {
    padding: 6px 12px; border-radius: 999px;
    font-size: 12px; font-weight: 700;
    border: 1px solid var(--border);
    background: var(--bg); color: var(--text-soft);
    cursor: pointer; font-family: var(--sans);
    transition: all 0.12s;
  }
  .quality-btn.active-high { background: #F0FDF4; color: #166534; border-color: #BBF7D0; }
  .quality-btn.active-moderate { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
  .quality-btn.active-low { background: var(--bg-muted); color: var(--text-muted); border-color: var(--border); }

  .list-rows { display: flex; flex-direction: column; gap: 8px; }
  .list-row { display: flex; gap: 8px; align-items: center; }
  .list-row input { flex: 1; height: 36px; }
  .list-row .btn { flex-shrink: 0; }

  .citation-hint {
    font-size: 11.5px; color: var(--text-dim);
    margin-top: 4px;
  }
  .citation-hint code {
    font-size: 11px; background: var(--bg-muted);
    padding: 1px 5px; border-radius: 4px;
  }

  .advanced-toggle {
    font-size: 12.5px; font-weight: 600; color: var(--text-muted);
    cursor: pointer; border: none; background: none;
    font-family: var(--sans); padding: 0;
    text-decoration: underline; text-underline-offset: 2px;
  }
  .advanced-panel { display: none; margin-top: 14px; }
  .advanced-panel.open { display: block; }

  .step-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 6px;
    background: var(--teal-50); color: var(--teal-dark);
    font-size: 11px; font-weight: 800; margin-right: 8px;
  }
</style>

<div class="page-header">
  <div>
    <div style="margin-bottom:6px;">
      <a href="{{ route('admin.medications') }}" style="font-size:13px;color:var(--text-muted);">← Medications</a>
    </div>
    <h1>{{ $isEdit ? 'Edit: '.$medication->name : 'Add medication' }}</h1>
    <p>{{ $isEdit ? 'Update catalog entry, symptoms, and evidence-backed nutrient claims.' : 'Add a medication to the app catalog with symptoms and scientific evidence.' }}</p>
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
  <textarea name="claims_json" id="claimsJson" hidden aria-hidden="true"></textarea>

  {{-- BASIC INFO --}}
  <div class="admin-card">
    <div class="admin-card-hd">
      <div>
        <h2><span class="step-badge">1</span>Basic information</h2>
        <p>Name and ID shown in the mobile medication picker.</p>
      </div>
    </div>
    <div class="admin-card-bd">
      <div class="med-form-grid">
        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Name <span style="color:#e53e3e;">*</span></label>
          <input type="text" name="name" value="{{ old('name', $medication?->name) }}"
                 placeholder="e.g. Metformin" required style="width:100%;">
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Slug (ID) <span style="color:#e53e3e;">*</span></label>
          <input type="text" name="slug" id="slugField"
                 value="{{ old('slug', $medication?->slug) }}"
                 placeholder="e.g. metformin" required
                 style="width:100%;font-family:monospace;letter-spacing:.3px;"
                 pattern="[a-z0-9\-_]+" title="Lowercase letters, numbers, hyphens and underscores only">
        </div>
      </div>

      <div class="field-group" style="margin-top:16px;margin-bottom:0;">
        <label class="field-label">Description <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional, admin only)</span></label>
        <input type="text" name="description" value="{{ old('description', $medication?->description) }}"
               placeholder="Short internal note" style="width:100%;">
      </div>

      <div class="med-form-grid" style="margin-top:16px;align-items:end;">
        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Sort order</label>
          <input type="number" name="sort_order" min="0"
                 value="{{ old('sort_order', $medication?->sort_order ?? 0) }}" style="width:100%;">
          <div class="field-hint">Lower numbers appear first in the picker.</div>
        </div>
        <div style="padding-bottom:4px;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
            <input type="hidden" name="is_active" value="0">
            <input type="checkbox" name="is_active" value="1"
                   {{ old('is_active', $medication?->is_active ?? true) ? 'checked' : '' }}
                   style="width:16px;height:16px;accent-color:var(--teal);flex-shrink:0;">
            <span style="font-size:13.5px;font-weight:500;color:var(--text);">Active — visible in app</span>
          </label>
        </div>
      </div>
    </div>
  </div>

  {{-- SYMPTOMS --}}
  <div class="admin-card">
    <div class="admin-card-hd">
      <div>
        <h2><span class="step-badge">2</span>Symptom quick-select</h2>
        <p>One symptom per line — shown as chips when users pick this medication.</p>
      </div>
    </div>
    <div class="admin-card-bd">
      <div class="field-group" style="margin-bottom:0;">
        <label class="field-label">Symptoms (one per line)</label>
        <textarea name="symptom_chips" id="symptomInput" rows="6"
                  placeholder="Fatigue&#10;Brain fog&#10;Tingling hands/feet&#10;Muscle aches"
                  style="width:100%;font-size:13.5px;">{{ old('symptom_chips', $symptomText) }}</textarea>
        <div class="field-hint">Preview:</div>
        <div class="symptom-preview" id="symptomPreview"></div>
      </div>
    </div>
  </div>

  {{-- EVIDENCE / CLAIMS --}}
  <div class="admin-card">
    <div class="admin-card-hd">
      <div>
        <h2><span class="step-badge">3</span>Nutrient evidence</h2>
        <p>Add each nutrient affected by this medication with citations (PMID, DOI, or URL).</p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" id="addClaimBtn">+ Add claim</button>
    </div>
    <div class="admin-card-bd">
      @if($errors->has('claims_json'))
        <div class="flash error" style="margin-bottom:12px;">{{ $errors->first('claims_json') }}</div>
      @endif

      <div id="claimsBuilder"></div>

      <div style="margin-top:14px;">
        <button type="button" class="advanced-toggle" id="advancedToggle">Show raw JSON (advanced)</button>
        <div class="advanced-panel" id="advancedPanel">
          <textarea id="claimsJsonPreview" rows="10" readonly
                    style="width:100%;font-family:monospace;font-size:12px;margin-top:8px;background:var(--bg-muted);"></textarea>
        </div>
      </div>
    </div>
  </div>

  <div style="display:flex;gap:12px;padding-top:4px;">
    <button type="submit" class="btn btn-primary">
      {{ $isEdit ? 'Save changes' : 'Create medication' }}
    </button>
    <a href="{{ route('admin.medications') }}" class="btn btn-ghost">Cancel</a>
  </div>
</form>

<script>
const QUALITIES = ['High', 'Moderate', 'Low'];
let claims = @json($claimsInitial);

function normalizeClaim(raw) {
  return {
    nutrient: raw?.nutrient ?? '',
    source_quality: QUALITIES.includes(raw?.source_quality) ? raw.source_quality : 'Moderate',
    citations: Array.isArray(raw?.citations) && raw.citations.length ? raw.citations.map(String) : [''],
    notes: Array.isArray(raw?.notes) && raw.notes.length ? raw.notes.map(String) : [''],
  };
}

function ensureClaims() {
  if (!claims.length) {
    claims = [normalizeClaim({})];
  }
  claims = claims.map(normalizeClaim);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function qualityClass(q) {
  if (q === 'High') return 'active-high';
  if (q === 'Low') return 'active-low';
  return 'active-moderate';
}

function renderListRows(items, claimIdx, field, placeholder) {
  return items.map((val, rowIdx) => `
    <div class="list-row">
      <input type="text" value="${esc(val)}"
             placeholder="${esc(placeholder)}"
             data-claim="${claimIdx}" data-field="${field}" data-row="${rowIdx}">
      <button type="button" class="btn btn-ghost btn-sm" data-remove-row="${claimIdx}" data-field="${field}" data-row="${rowIdx}"
              ${items.length <= 1 ? 'disabled style="opacity:.4;"' : ''}>Remove</button>
    </div>
  `).join('');
}

function renderClaims() {
  ensureClaims();
  const root = document.getElementById('claimsBuilder');

  if (!claims.length) {
    root.innerHTML = '<div class="claims-empty">No evidence claims yet. Click <strong>+ Add claim</strong> to add nutrient depletion data.</div>';
    syncJson();
    return;
  }

  root.innerHTML = claims.map((claim, idx) => `
    <div class="claim-card" data-claim-card="${idx}">
      <div class="claim-card-hd">
        <div class="claim-card-title">Claim ${idx + 1}${claim.nutrient ? ': ' + esc(claim.nutrient) : ''}</div>
        <button type="button" class="btn btn-danger btn-sm" data-remove-claim="${idx}">Remove claim</button>
      </div>
      <div class="claim-card-bd">
        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Nutrient <span style="color:#e53e3e;">*</span></label>
          <input type="text" value="${esc(claim.nutrient)}" placeholder="e.g. Vitamin B12, Magnesium"
                 data-claim="${idx}" data-field="nutrient" style="width:100%;">
        </div>

        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Evidence quality</label>
          <div class="quality-row" data-quality-row="${idx}">
            ${QUALITIES.map(q => `
              <button type="button" class="quality-btn ${claim.source_quality === q ? qualityClass(q) : ''}"
                      data-quality="${idx}" data-value="${q}">${q}</button>
            `).join('')}
          </div>
        </div>

        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Citations</label>
          <div class="list-rows">${renderListRows(claim.citations, idx, 'citations', 'PMID:26900641 or https://…')}</div>
          <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px;" data-add-row="${idx}" data-field="citations">+ Add citation</button>
          <div class="citation-hint">All become clickable in the app: <code>PMID:12345678</code>, <code>PMCID:PMC4110863</code>, <code>DOI:10.1234/…</code>, or <code>https://…</code></div>
        </div>

        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Notes <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
          <div class="list-rows">${renderListRows(claim.notes, idx, 'notes', 'Short clinical note for this nutrient')}</div>
          <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px;" data-add-row="${idx}" data-field="notes">+ Add note</button>
        </div>
      </div>
    </div>
  `).join('');

  syncJson();
}

function syncJson() {
  const cleaned = claims
    .map(c => ({
      nutrient: (c.nutrient || '').trim(),
      source_quality: c.source_quality,
      citations: (c.citations || []).map(s => s.trim()).filter(Boolean),
      notes: (c.notes || []).map(s => s.trim()).filter(Boolean),
    }))
    .filter(c => c.nutrient);

  const json = JSON.stringify(cleaned, null, 2);
  document.getElementById('claimsJson').value = json;
  document.getElementById('claimsJsonPreview').value = json;
}

function updateSymptomPreview() {
  const ta = document.getElementById('symptomInput');
  const preview = document.getElementById('symptomPreview');
  const chips = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
  if (!chips.length) {
    preview.innerHTML = '<span class="symptom-chip empty">Type symptoms above to see preview</span>';
    return;
  }
  preview.innerHTML = chips.map(c => `<span class="symptom-chip">${esc(c)}</span>`).join('');
}

document.getElementById('claimsBuilder').addEventListener('input', (e) => {
  const t = e.target;
  const idx = Number(t.dataset.claim);
  const field = t.dataset.field;
  const row = t.dataset.row;
  if (Number.isNaN(idx) || !field) return;

  if (field === 'nutrient') {
    claims[idx].nutrient = t.value;
    const title = document.querySelector(`[data-claim-card="${idx}"] .claim-card-title`);
    if (title) title.textContent = 'Claim ' + (idx + 1) + (t.value.trim() ? ': ' + t.value.trim() : '');
  } else if (row !== undefined) {
    claims[idx][field][Number(row)] = t.value;
  }
  syncJson();
});

document.getElementById('claimsBuilder').addEventListener('click', (e) => {
  const addQ = e.target.closest('[data-quality]');
  if (addQ) {
    const idx = Number(addQ.dataset.quality);
    claims[idx].source_quality = addQ.dataset.value;
    renderClaims();
    return;
  }

  const addRow = e.target.closest('[data-add-row]');
  if (addRow) {
    const idx = Number(addRow.dataset.addRow);
    const field = addRow.dataset.field;
    claims[idx][field].push('');
    renderClaims();
    return;
  }

  const removeRow = e.target.closest('[data-remove-row]');
  if (removeRow) {
    const idx = Number(removeRow.dataset.removeRow);
    const field = removeRow.dataset.field;
    const row = Number(removeRow.dataset.row);
    if (claims[idx][field].length > 1) {
      claims[idx][field].splice(row, 1);
      renderClaims();
    }
    return;
  }

  const removeClaim = e.target.closest('[data-remove-claim]');
  if (removeClaim) {
    const idx = Number(removeClaim.dataset.removeClaim);
    if (claims.length === 1) {
      claims = [normalizeClaim({})];
    } else {
      claims.splice(idx, 1);
    }
    renderClaims();
  }
});

document.getElementById('addClaimBtn').addEventListener('click', () => {
  claims.push(normalizeClaim({}));
  renderClaims();
});

document.getElementById('advancedToggle').addEventListener('click', function () {
  const panel = document.getElementById('advancedPanel');
  const open = panel.classList.toggle('open');
  this.textContent = open ? 'Hide raw JSON (advanced)' : 'Show raw JSON (advanced)';
});

document.getElementById('symptomInput').addEventListener('input', updateSymptomPreview);

document.getElementById('medForm').addEventListener('submit', () => syncJson());

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

ensureClaims();
renderClaims();
updateSymptomPreview();
</script>
@endsection
