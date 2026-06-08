from pathlib import Path

root = Path(__file__).resolve().parent
html = (root / "geneorx_portal_layout_cleaned_safe2.html").read_text(encoding="utf-8")
script_start = html.index("const GENERIC_SYMPTOMS")
script_end = html.rindex("renderAll();") + len("renderAll();")
original = html[script_start:script_end]

header = """   <script>
/* =========================================================
   ===== AUTH USER =====
   ========================================================= */
const AUTHENTICATED_USER = "{{ Auth::check() ? Auth::user()->name : 'Guest' }}";
const IS_GUEST = @json(! Auth::check() || (session('is_web_guest') ?? false));
const LOGIN_URL = "{{ route('login') }}";

/* =========================================================
   ===== DATA =====
   ========================================================= */
@php
  $medDbJson = (isset($medDb) && count($medDb))
      ? json_encode($medDb, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG)
      : null;
@endphp
@if($medDbJson)
const MED_DB = {!! $medDbJson !!};
@else
{{-- Static fallback when medications table is empty --}}
"""

fallback_end = root / "resources/views/include/script.blade.php"
fallback_med = ""
if fallback_end.exists():
    fb = fallback_end.read_text(encoding="utf-8")
    if "const MED_DB = [" in fb:
        s = fb.index("const MED_DB = [")
        e = fb.index("];", s) + 2
        fallback_med = fb[s:e]
if not fallback_med:
    fallback_med = "const MED_DB = [];"

header += fallback_med + "\n@endif\n\n"

state_block = """
/* =========================================================
   ===== STATE =====
   ========================================================= */
const STORAGE_KEY = "geniorx_consumer_portal_v1_split";
const LEGACY_STORAGE_KEY = "geneomx_consumer_portal_v1_split";
const defaultState = () => ({
  step: 0,
  account: { email:"", consent:false },
  profile: { age:"", gender:"", pregnant:false, kidneyDisease:false, anticoagulants:false },
  meds: [],
  symptoms: { selected:[], custom:[], severity:"mild" },
  symptomOnlyMode: false,
  wellbeingBaseline: { energy:5, mood:5, sleep:5, focus:5 },
  plan: { started:false, startDate:null, recommendedSupplements:[], routine:{} },
  checkins: [],
  feedback: []
});
let state = load();
let backendSaveTimer = null;

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleBackendSave();
  renderAll();
}
function load(){
  try{
    for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
    return defaultState();
  } catch(e){ return defaultState(); }
}
function scheduleBackendSave(){
  if (IS_GUEST) return;
  clearTimeout(backendSaveTimer);
  backendSaveTimer = setTimeout(saveToBackend, 450);
}
function resetDemo(){
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  state = defaultState();
  renderAll();
  showToast("Reset \\u2713");
}
""".strip().replace("\\u2713", "\u2713")

backend_helpers = """
function localHasMeaningfulData(s){
  if(!s) return false;
  return !!(
    (s.meds && s.meds.length) ||
    (s.symptoms && s.symptoms.selected && s.symptoms.selected.length) ||
    (s.checkins && s.checkins.length) ||
    (s.profile && (s.profile.age || s.profile.gender)) ||
    (s.plan && s.plan.started) ||
    s.account?.consent
  );
}

function backendResponseHasData(data){
  return !!(
    (data.medications && data.medications.length) ||
    (data.symptoms && data.symptoms.length) ||
    (data.checkins && data.checkins.length) ||
    (data.profile && (data.profile.age || data.profile.gender))
  );
}

async function loadFromBackend() {
  if (IS_GUEST) return;
  const localSnapshot = JSON.parse(JSON.stringify(state));
  try {
    const response = await fetch('/api/profile');
    if(!response.ok) return;
    const data = await response.json();
    if(data.profile) {
      state.profile = {
        age: data.profile.age || state.profile.age || "",
        gender: data.profile.gender || state.profile.gender || "",
        pregnant: data.profile.pregnant ?? state.profile.pregnant ?? false,
        kidneyDisease: data.profile.kidneyDisease ?? state.profile.kidneyDisease ?? false,
        anticoagulants: data.profile.anticoagulants ?? state.profile.anticoagulants ?? false
      };
    }
    if(data.user?.email && !String(data.user.email).includes('guest@')) {
      state.account.email = data.user.email;
    } else if(data.account?.email && !String(data.account.email).includes('guest@')) {
      state.account.email = data.account.email;
    }
    if(typeof data.account?.consent === 'boolean') {
      state.account.consent = data.account.consent;
    }
    if(data.medications?.length) state.meds = data.medications;
    if(data.symptoms?.length) state.symptoms.selected = data.symptoms.map(s => s.name);
    if(data.checkins?.length) {
      state.checkins = data.checkins.slice().sort((a,b)=> new Date(a.dateISO||0)-new Date(b.dateISO||0));
    }
    if(data.portal_state && typeof data.portal_state==='object') {
      const ps = data.portal_state;
      if(ps.plan) state.plan = { ...defaultState().plan, ...ps.plan, routine: { ...defaultState().plan.routine, ...((ps.plan && ps.plan.routine) || {}) } };
      if(ps.wellbeingBaseline) state.wellbeingBaseline = { ...defaultState().wellbeingBaseline, ...ps.wellbeingBaseline };
      if(typeof ps.symptomOnlyMode==='boolean') state.symptomOnlyMode = ps.symptomOnlyMode;
      if(Array.isArray(ps.customMedCatalog)) {
        for(const m of ps.customMedCatalog) {
          if(m && m.id && !MED_DB.find(x=>x.id===m.id)) MED_DB.push(m);
        }
      }
      if(Array.isArray(ps.feedback)) state.feedback = ps.feedback;
    } else if(data.plan) {
      state.plan = { ...defaultState().plan, ...data.plan, routine: { ...defaultState().plan.routine, ...((data.plan && data.plan.routine) || {}) } };
    }
    if(!backendResponseHasData(data) && localHasMeaningfulData(localSnapshot)) {
      state.profile = { ...state.profile, ...localSnapshot.profile };
      state.meds = localSnapshot.meds || [];
      state.symptoms = { ...state.symptoms, ...localSnapshot.symptoms };
      state.checkins = localSnapshot.checkins || [];
      state.plan = { ...defaultState().plan, ...localSnapshot.plan, routine: { ...defaultState().plan.routine, ...((localSnapshot.plan && localSnapshot.plan.routine) || {}) } };
      state.wellbeingBaseline = { ...defaultState().wellbeingBaseline, ...localSnapshot.wellbeingBaseline };
      state.symptomOnlyMode = localSnapshot.symptomOnlyMode ?? state.symptomOnlyMode;
      state.feedback = localSnapshot.feedback || state.feedback;
      if(typeof localSnapshot.account?.consent === 'boolean') state.account.consent = localSnapshot.account.consent;
      if(data.user?.email) state.account.email = data.user.email;
      else if(localSnapshot.account?.email && !String(localSnapshot.account.email).includes('guest@')) state.account.email = localSnapshot.account.email;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      await saveToBackend();
      showToast('Saved to your account \\u2713');
    }
  } catch(e) {
    console.log('Backend profile load (optional):', e.message);
  }
}

async function saveToBackend() {
  if (IS_GUEST) return;
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify((()=>{
        const customMedCatalog = (MED_DB || []).filter(m => m && m.id && (String(m.id).startsWith("custom_") || String(m.id).includes("custom")));
        return {
          account: state.account,
          profile: {
            age: state.profile.age,
            gender: state.profile.gender,
            phone: state.profile.phone || '',
            pregnant: state.profile.pregnant,
            kidneyDisease: state.profile.kidneyDisease,
            anticoagulants: state.profile.anticoagulants,
          },
          medications: state.meds,
          symptoms: state.symptoms.selected,
          plan: state.plan,
          checkins: state.checkins,
          portal_state: {
            plan: state.plan,
            customMedCatalog: customMedCatalog,
            wellbeingBaseline: state.wellbeingBaseline,
            symptomOnlyMode: state.symptomOnlyMode,
            account: { consent: state.account.consent },
            feedback: state.feedback,
          },
        };
      })())
    });
    if(!response.ok) {
      let message = "GeneoRx could not save your latest change.";
      try { const data = await response.json(); message = data.message || message; } catch(e) {}
      showToast(message);
    }
  } catch(e) {
    console.log('Backend save error (optional):', e.message);
  }
}
""".strip().replace("\\u2713", "\u2713")

orig_lines = original.splitlines()
state_idx = next(i for i, l in enumerate(orig_lines) if "===== STATE =====" in l) - 1
util_idx = next(i for i, l in enumerate(orig_lines) if "===== UTIL =====" in l) - 1

generic_part = "\n".join(orig_lines[:state_idx])
rest_part = "\n".join(orig_lines[util_idx:])

rest_part = rest_part.replace(
    'pillUser.textContent = state.account.email ? state.account.email : "Guest";',
    'pillUser.textContent = state.account.email ? state.account.email : (AUTHENTICATED_USER !== "Guest" ? AUTHENTICATED_USER : "Guest");',
)

# Replace simple openInsightModal with reveal animation + insight popup
old_insight = rest_part[rest_part.index("function openInsightModal"):rest_part.index("document.getElementById(\"insightClose\")")]
new_insight = """
function showInsightModal(){
  const insight = computeInsightEngine();
  insightSummary.innerHTML = `<strong>${escapeHtml(insight.summary)}</strong>`;
  insightMeaning.textContent = insight.meaning;
  insightDoctor.textContent = insight.doctorPrompt;
  insightWhy.innerHTML = `${insight.patterns.length ? `Pattern: <strong>${escapeHtml(insight.patterns[0].title)}</strong><br>` : ''}${insight.interactions.length ? `Interactions: <strong>${insight.interactions.length}</strong><br>` : ''}${insight.contraindications.length ? `Cautions: <strong>${insight.contraindications.length}</strong><br>` : ''}Success prediction: <strong>${insight.prediction.score}%</strong> (${escapeHtml(insight.prediction.level)})`;
  insightBackdrop.style.display = "block";
  insightModal.style.display = "block";
}

let revealTimer = null;
function resetPatternReveal(){
  document.querySelectorAll('#revealSteps .revealStep').forEach((el, idx)=>{
    el.classList.remove('on','done');
    const icon = el.querySelector('.revealIcon');
    if(icon) icon.textContent = String(idx+1);
  });
  const bar = document.getElementById('revealBar');
  const foot = document.getElementById('revealFoot');
  if(bar) bar.style.width = '0%';
  if(foot) foot.textContent = 'Preparing your GeneoRx insight…';
}
function closePatternReveal(){
  const revealBackdrop = document.getElementById('revealBackdrop');
  const revealModal = document.getElementById('revealModal');
  if(revealBackdrop) revealBackdrop.style.display = 'none';
  if(revealModal) revealModal.style.display = 'none';
  if(revealTimer){ clearTimeout(revealTimer); revealTimer = null; }
}
function openInsightModal(){
  resetPatternReveal();
  const revealBackdrop = document.getElementById('revealBackdrop');
  const revealModal = document.getElementById('revealModal');
  const bar = document.getElementById('revealBar');
  const foot = document.getElementById('revealFoot');
  const steps = Array.from(document.querySelectorAll('#revealSteps .revealStep'));
  if(!revealBackdrop || !revealModal){ showInsightModal(); return; }
  revealBackdrop.style.display = 'block';
  revealModal.style.display = 'block';
  const labels = [
    'Reviewing your current medication selections…',
    'Checking symptom and check-in patterns…',
    'Matching nutrient depletion evidence…',
    'Building your GeneoRx insight…'
  ];
  let i = 0;
  function advance(){
    steps.forEach((el, idx)=>{
      el.classList.remove('on');
      if(idx < i){
        el.classList.add('done');
        const icon = el.querySelector('.revealIcon');
        if(icon) icon.textContent = '✓';
      }
    });
    if(i < steps.length){
      steps[i].classList.add('on');
      if(foot) foot.textContent = labels[i] || 'Analyzing…';
      if(bar) bar.style.width = `${Math.round(((i+1)/steps.length)*100)}%`;
      i += 1;
      revealTimer = setTimeout(advance, 420);
    } else {
      if(foot) foot.textContent = 'Insight ready.';
      revealTimer = setTimeout(()=>{
        closePatternReveal();
        showInsightModal();
      }, 260);
    }
  }
  advance();
}
function closeInsightModal(){
  insightBackdrop.style.display = "none";
  insightModal.style.display = "none";
}
"""
rest_part = rest_part.replace(old_insight, new_insight)

# Results page: Reveal My button + Detected Patterns + success ring grid
rest_part = rest_part.replace(
    '<div class="btns"><button class="primary" id="openInsightBtn">Open GeneoRx Insight</button></div>',
    '<div class="btns"><button class="primary" id="openInsightBtn">Reveal My GeneoRx Insight</button></div>',
)

old_advanced = """  const sAdvanced = document.createElement("div");
  sAdvanced.className = "section";
  sAdvanced.innerHTML = `
    <div class="metricGrid">
      <div class="metricCard"><div class="k">Medication success prediction</div><div class="v"><strong>${success.score}%</strong> • ${escapeHtml(success.level)}<br>${escapeHtml(success.reason)}</div></div>
      <div class="metricCard"><div class="k">Pattern detection</div><div class="v">${patterns.length ? `<strong>${escapeHtml(patterns[0].title)}</strong><br>${escapeHtml(patterns[0].note)}` : 'No strong pattern detected yet.'}</div></div>
      <div class="metricCard"><div class="k">Population insights</div><div class="v">${escapeHtml(population.message)}<br>${population.trackedSymptoms.length ? `Frequently tracked: <strong>${escapeHtml(population.trackedSymptoms.join(', '))}</strong>` : 'Track more check-ins to unlock trends.'}</div></div>
    </div>
  `;
  mainEl.appendChild(sAdvanced);"""

new_advanced = """  const sPatterns = document.createElement("div");
  sPatterns.className = "section";
  sPatterns.innerHTML = `
    <div class="tagline"><strong>Detected Patterns</strong><br>GeneoRx looks for medication, symptom, and timeline patterns.</div>
    <div style="height:10px"></div>
    <div class="item">
      <div class="k">Detected patterns</div>
      <div class="v">${patterns.length
        ? `<strong>${escapeHtml(patterns[0].title)}</strong><br>${escapeHtml(patterns[0].note)}`
        : 'No strong patterns detected yet. Add more medications, symptoms, or check-ins.'}</div>
    </div>
  `;
  mainEl.appendChild(sPatterns);

  const improveText = success.score >= 75
    ? 'Stay consistent and continue monitoring to confirm progress.'
    : success.score >= 50
      ? 'Improve adherence and keep tracking weekly to raise confidence.'
      : 'Review symptoms, side effects, and possible depletion patterns with your doctor.';
  const scoreCls = success.score >= 75 ? 'scoreHigh' : (success.score >= 50 ? 'scoreMod' : 'scoreLow');

  const sAdvanced = document.createElement("div");
  sAdvanced.className = "section";
  sAdvanced.innerHTML = `
    <div class="metricGrid">
      <div class="metricCard"><div class="k">Medication Success Probability</div><div style="display:flex;align-items:center;gap:12px;margin-top:8px"><div class="scoreBadge ${scoreCls}">${success.score}%</div><div><strong>${escapeHtml(success.level)}</strong><br><span class="fineprint">${escapeHtml(success.reason)}</span></div></div></div>
      <div class="metricCard"><div class="k">Population insights</div><div class="v"><span class="fineprint">${escapeHtml(population.message)}</span><br>${population.trackedSymptoms.length ? `Frequently tracked: <strong>${escapeHtml(population.trackedSymptoms.join(', '))}</strong>` : '<span style="font-size:12px;opacity:.75">Track more check-ins to unlock trends.</span>'}</div></div>
      <div class="metricCard"><div class="k">What may improve success</div><div class="v"><span class="fineprint">${escapeHtml(improveText)}</span></div></div>
    </div>
  `;
  mainEl.appendChild(sAdvanced);"""

if old_advanced in rest_part:
    rest_part = rest_part.replace(old_advanced, new_advanced)

footer = """
if (IS_GUEST) {
  renderAll();
} else {
  loadFromBackend().then(() => renderAll()).catch(() => renderAll());
}
</script>
"""

# Remove duplicate renderAll() from original tail before footer
rest_part = rest_part.replace("\nrenderAll();\n", "\n", 1)

out = header + generic_part + "\n\n" + state_block + "\n\n" + backend_helpers + "\n\n" + rest_part + footer
(root / "resources/views/include/script.blade.php").write_text(out, encoding="utf-8")
print(f"Wrote {len(out.splitlines())} lines")
