   <script>
/* =========================================================
   ===== AUTH USER =====
   ========================================================= */
const AUTHENTICATED_USER = "{{ Auth::check() ? Auth::user()->name : 'Guest' }}";
const AUTH_EMAIL = @json(Auth::check() ? Auth::user()->email : '');
const IS_GUEST = @json(! Auth::check() || (session('is_web_guest') ?? false));
const LOGIN_URL = "{{ route('login') }}";
const ACCOUNT_SETTINGS_URL = "{{ route('account.settings') }}";

/* =========================================================
   ===== I18N (portal wizard) =====
   ========================================================= */
function portalLang(){
  try {
    const code = localStorage.getItem("geneorx_language_v1") || "en";
    if (window.GENEORX_I18N && window.GENEORX_I18N[code]) return code;
  } catch (e) {}
  return "en";
}
function t(key, vars){
  const lang = portalLang();
  const pack = (window.GENEORX_I18N && window.GENEORX_I18N[lang]) || (window.GENEORX_I18N && window.GENEORX_I18N.en) || {};
  const fallback = (window.GENEORX_I18N && window.GENEORX_I18N.en) || {};
  let str = pack[key] || fallback[key] || key;
  if (vars && typeof vars === "object") {
    Object.entries(vars).forEach(([k, v])=>{
      str = str.replaceAll(`{${k}}`, String(v ?? ""));
    });
  }
  return str;
}
function toastT(key, vars){ showToast(t(key, vars)); }
function alertT(key, vars){ alert(t(key, vars)); }
function compactMetricLabel(key){
  return t(key).replace(/\s*\([^)]*\)\s*$/, "");
}
function impactLabel(change){
  const map = {
    "Worse": "impact.worse",
    "No change": "impact.no_change",
    "Slightly better": "impact.slightly_better",
    "Much better": "impact.much_better",
    "Not present": "impact.not_present",
  };
  return map[change] ? t(map[change]) : String(change || "");
}
function tierLabel(tier){
  const map = {
    High: "tier.high",
    Moderate: "tier.moderate",
    Low: "tier.low",
    Pending: "tier.pending",
    Preliminary: "tier.preliminary",
  };
  return map[tier] ? t(map[tier]) : String(tier || "");
}
function successLabel(level){
  const map = {
    Strong: "success.strong",
    Moderate: "success.moderate",
    "At risk": "success.at_risk",
  };
  return map[level] ? t(map[level]) : String(level || "");
}
function doseLabel(dose){
  return dose ? t(`dose.${dose}`) : "";
}
function fmtDelta(n){
  return `${n >= 0 ? "+" : ""}${n}`;
}
function wellbeingSummaryText(wellbeing){
  const wb = wellbeing || {};
  return [
    `${compactMetricLabel("wellbeing.energy")} ${wb.energy ?? "—"}/10`,
    `${compactMetricLabel("wellbeing.mood")} ${wb.mood ?? "—"}/10`,
    `${compactMetricLabel("wellbeing.sleep")} ${wb.sleep ?? "—"}/10`,
    `${compactMetricLabel("wellbeing.focus")} ${wb.focus ?? "—"}/10`,
  ].join(" · ");
}
window.addEventListener("geneorx:languagechange", ()=>{
  if (typeof renderAll === "function") renderAll();
});

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
const MED_DB = [
  { id:"metformin", name:"Metformin", symptomChips:["Fatigue","Tingling hands/feet","Brain fog","Low mood","GI discomfort"],
    claims:[{ nutrient:"Vitamin B12", source_quality:"High", citations:["PMID:26900641"],
      notes:["Long-term metformin is associated with B12 deficiency risk; consider monitoring if symptoms present."]}]},

  { id:"atorvastatin", name:"Atorvastatin (statin)", symptomChips:["Muscle aches","Fatigue","Brain fog","Sleep changes"],
    claims:[{ nutrient:"CoQ10", source_quality:"Moderate", citations:["PMID:26192349"],
      notes:["Statins are associated with lower CoQ10 levels; symptom benefit from supplementation varies."]}]},

  { id:"rosuvastatin", name:"Rosuvastatin (statin)", symptomChips:["Muscle aches","Fatigue","Brain fog","Sleep changes"],
    claims:[{ nutrient:"CoQ10", source_quality:"Moderate", citations:["PMID:26192349"],
      notes:["Statins inhibit CoQ10 synthesis via the mevalonate pathway; monitoring is reasonable with myopathy symptoms."]}]},

  { id:"simvastatin", name:"Simvastatin (statin)", symptomChips:["Muscle aches","Fatigue","Brain fog","Sleep changes"],
    claims:[{ nutrient:"CoQ10", source_quality:"Moderate", citations:["PMID:26192349"],
      notes:["Statins inhibit CoQ10 synthesis via the mevalonate pathway; higher potency raises the signal further."]}]},

  { id:"omeprazole", name:"Omeprazole (PPI)", symptomChips:["GI discomfort","Fatigue","Dizziness","Muscle cramps","Brain fog"],
    claims:[
      { nutrient:"Magnesium", source_quality:"High", citations:["PMID:22392879"],
        notes:["Long-term PPI use has a hypomagnesemia safety signal; consider Mg evaluation if symptomatic."]},
      { nutrient:"Vitamin B12", source_quality:"Moderate", citations:["PMCID:PMC4110863"],
        notes:["Association depends on duration and population; labs help clarify."]},
    ]},

  { id:"pantoprazole", name:"Pantoprazole (PPI)", symptomChips:["GI discomfort","Fatigue","Dizziness","Muscle cramps"],
    claims:[
      { nutrient:"Magnesium", source_quality:"High", citations:["PMID:22392879"],
        notes:["Class effect: long-term PPI use reduces gastric acid needed for Mg absorption."]},
      { nutrient:"Vitamin B12", source_quality:"Moderate", citations:["PMCID:PMC4110863"],
        notes:["Reduced gastric acid may impair B12 release from dietary protein over time."]},
    ]},

  /* GLP-1 / GIP-GLP-1 agonists */
  { id:"semaglutide", name:"Semaglutide (GLP-1)", symptomChips:["GI discomfort","Nausea","Constipation","Fatigue","Hair loss"],
    claims:[
      { nutrient:"Vitamin D", source_quality:"Moderate", citations:["PMID:37596620"],
        notes:["Significant weight loss on GLP-1 therapy alters Vitamin D distribution; monitoring recommended during extended treatment."]},
      { nutrient:"Zinc", source_quality:"Low", citations:["PMID:35970808"],
        notes:["Reduced caloric intake and GI absorption changes during GLP-1 treatment may affect zinc status; track dietary intake."]},
      { nutrient:"Vitamin B12", source_quality:"Low", citations:["PMID:36941988"],
        notes:["Slowed gastric motility and reduced food intake on GLP-1 agents may impair B12 absorption in some patients."]},
    ]},

  { id:"tirzepatide", name:"Tirzepatide (GIP/GLP-1)", symptomChips:["GI discomfort","Nausea","Constipation","Fatigue","Hair loss"],
    claims:[
      { nutrient:"Vitamin D", source_quality:"Moderate", citations:["PMID:37596620"],
        notes:["Rapid weight loss associated with tirzepatide can alter fat-soluble vitamin distribution, including Vitamin D."]},
      { nutrient:"Zinc", source_quality:"Low", citations:["PMID:35970808"],
        notes:["Reduced food intake during treatment may decrease dietary zinc; monitoring in long-term use is prudent."]},
      { nutrient:"Vitamin B12", source_quality:"Low", citations:["PMID:36941988"],
        notes:["GI motility changes and caloric restriction may reduce B12 absorption in susceptible individuals."]},
    ]},

  { id:"liraglutide", name:"Liraglutide (GLP-1)", symptomChips:["GI discomfort","Nausea","Constipation","Fatigue"],
    claims:[
      { nutrient:"Vitamin D", source_quality:"Moderate", citations:["PMID:37596620"],
        notes:["Weight loss on liraglutide affects fat-soluble vitamin status; Vitamin D levels should be periodically reviewed."]},
      { nutrient:"Zinc", source_quality:"Low", citations:["PMID:35970808"],
        notes:["Appetite suppression and dietary restriction may lower zinc intake during extended liraglutide use."]},
    ]},

  { id:"dulaglutide", name:"Dulaglutide (GLP-1)", symptomChips:["GI discomfort","Nausea","Constipation","Fatigue"],
    claims:[
      { nutrient:"Vitamin D", source_quality:"Moderate", citations:["PMID:37596620"],
        notes:["GLP-1 class effect: weight loss can redistribute fat-soluble vitamins; Vitamin D monitoring is reasonable."]},
      { nutrient:"Vitamin B12", source_quality:"Low", citations:["PMID:36941988"],
        notes:["Reduced gastric motility and intake on GLP-1 treatment may modestly impact B12 absorption."]},
    ]},

  /* Cardiovascular  ACE inhibitors */
  { id:"lisinopril", name:"Lisinopril (ACE inhibitor)", symptomChips:["Dizziness","Fatigue","Muscle cramps"],
    claims:[
      { nutrient:"Zinc", source_quality:"Moderate", citations:["PMID:9550460"],
        notes:["ACE inhibitors contain zinc-binding moieties; long-term use may reduce serum zinc in some patients."]},
    ]},

  { id:"enalapril", name:"Enalapril (ACE inhibitor)", symptomChips:["Dizziness","Fatigue","Muscle cramps"],
    claims:[
      { nutrient:"Zinc", source_quality:"Moderate", citations:["PMID:9550460"],
        notes:["ACE inhibitors have zinc-chelating properties; monitoring zinc is reasonable with extended use."]},
    ]},

  /* ARBs */
  { id:"losartan", name:"Losartan (ARB)", symptomChips:["Dizziness","Fatigue","Muscle cramps"],
    claims:[
      { nutrient:"Zinc", source_quality:"Low", citations:["PMID:9550460"],
        notes:["Some evidence suggests ARBs may share a modest zinc-lowering class effect with ACE inhibitors."]},
    ]},

  /* CCBs */
  { id:"amlodipine", name:"Amlodipine (CCB)", symptomChips:["Swelling","Dizziness","Fatigue"],
    claims:[
      { nutrient:"CoQ10", source_quality:"Low", citations:["PMID:15003176"],
        notes:["Observational data suggest cardiovascular medications including CCBs may be associated with lower CoQ10 in some patients; clinical relevance is unclear."]},
    ]},

  /* Beta-blockers */
  { id:"metoprolol", name:"Metoprolol (beta blocker)", symptomChips:["Fatigue","Dizziness","Low energy","Sleep changes"],
    claims:[
      { nutrient:"CoQ10", source_quality:"Low", citations:["PMID:15003176"],
        notes:["Beta-blockers have been observed to reduce CoQ10 levels in some heart failure patients; supplementation studies show variable results."]},
      { nutrient:"Melatonin", source_quality:"Low", citations:["PMID:9590511"],
        notes:["Metoprolol may suppress melatonin synthesis, which can contribute to sleep disturbances in some patients."]},
    ]},

  /* Thyroid */
  { id:"levothyroxine", name:"Levothyroxine (thyroid)", symptomChips:["Fatigue","Brain fog","Muscle aches","Dizziness","Hair loss","Low energy"],
    claims:[
      { nutrient:"Selenium", source_quality:"Moderate", citations:["PMID:28642112"],
        notes:["Selenium is required for T4→T3 conversion; suboptimal selenium may impair thyroid hormone activity."]},
      { nutrient:"Iron", source_quality:"Moderate", citations:["PMID:16001874"],
        notes:["Iron deficiency reduces thyroid hormone synthesis; co-existing iron deficiency can blunt levothyroxine response."]},
      { nutrient:"Zinc", source_quality:"Moderate", citations:["PMID:24861516"],
        notes:["Zinc is involved in thyroid hormone metabolism; deficiency is associated with impaired thyroid function."]},
    ]},

  /* Diuretics */
  { id:"furosemide", name:"Furosemide (loop diuretic)", symptomChips:["Muscle cramps","Dizziness","Fatigue","Heart palpitations","Low energy"],
    claims:[
      { nutrient:"Potassium", source_quality:"High", citations:["PMID:17536977"],
        notes:["Loop diuretics cause significant urinary potassium wasting; serum potassium monitoring is standard of care."]},
      { nutrient:"Magnesium", source_quality:"High", citations:["PMID:17536977"],
        notes:["Furosemide increases urinary magnesium excretion; hypomagnesemia is a known class effect."]},
      { nutrient:"Calcium", source_quality:"Moderate", citations:["PMID:17536977"],
        notes:["Loop diuretics increase urinary calcium excretion; long-term use may affect bone mineral density."]},
      { nutrient:"B vitamins", source_quality:"Low", citations:["PMID:22716193"],
        notes:["Increased urinary excretion and reduced absorption with chronic loop diuretic use may lower B1 (thiamine) levels."]},
    ]},

  { id:"hydrochlorothiazide", name:"Hydrochlorothiazide (HCTZ)", symptomChips:["Muscle cramps","Dizziness","Fatigue","Heart palpitations"],
    claims:[
      { nutrient:"Potassium", source_quality:"High", citations:["PMID:17536977"],
        notes:["Thiazide diuretics cause potassium wasting; hypokalemia is a common, well-documented effect."]},
      { nutrient:"Magnesium", source_quality:"High", citations:["PMID:17536977"],
        notes:["Thiazides increase renal magnesium excretion; monitoring is warranted in long-term use."]},
      { nutrient:"Zinc", source_quality:"Moderate", citations:["PMID:9550460"],
        notes:["Thiazide diuretics may increase urinary zinc loss; relevant in patients with marginal dietary zinc intake."]},
    ]},

  { id:"spironolactone", name:"Spironolactone (K-sparing diuretic)", symptomChips:["Dizziness","Fatigue","Muscle cramps"],
    claims:[
      { nutrient:"Potassium", source_quality:"High", citations:["PMID:17536977"],
        notes:["Spironolactone retains potassium; hyperkalemia risk requires monitoring, particularly with ACE inhibitors or ARBs."]},
      { nutrient:"Magnesium", source_quality:"Moderate", citations:["PMID:17536977"],
        notes:["Potassium-sparing diuretics also conserve magnesium; serum levels can rise  review if also supplementing."]},
    ]},

  /* Anticoagulants */
  { id:"warfarin", name:"Warfarin (anticoagulant)", symptomChips:["Fatigue","Dizziness","Brain fog"],
    claims:[
      { nutrient:"Vitamin K", source_quality:"High", citations:["PMID:25851918"],
        notes:["Warfarin works by blocking Vitamin K recycling. Consistent Vitamin K intake (not avoidance) is key  abrupt changes alter INR. Discuss stable supplementation with your clinician."]},
    ]},
];
@endif

const GENERIC_SYMPTOMS = [
  "Fatigue","Low energy","Brain fog","Poor focus","Mood changes","Sleep changes",
  "GI discomfort","Constipation","Dizziness","Headache","Muscle cramps","Tingling hands/feet",
  "Heart palpitations","Muscle aches","Swelling","Anxiety","Nausea"
];

const SUPPLEMENT_MAP = {
  "CoQ10": ["CoQ10 (ubiquinol)"],
  "Vitamin D": ["Vitamin D3 (consider K2)"],
  "Vitamin B12": ["Methyl B12"],
  "Magnesium": ["Magnesium glycinate"],
  "Potassium": ["Electrolytes / potassium foods"],
  "Calcium": ["Calcium + bone support"],
  "B vitamins": ["B-complex (methylated)"],
};

const LAB_SUGGESTIONS = {
  "Vitamin B12": ["Vitamin B12", "MMA (methylmalonic acid)", "Homocysteine (optional)"],
  "Vitamin D": ["25(OH) Vitamin D"],
  "Magnesium": ["Magnesium (serum)", "RBC magnesium (if available)"],
  "Potassium": ["BMP/CMP (electrolytes)"],
  "Calcium": ["Calcium", "Albumin", "PTH (if abnormal)"],
  "CoQ10": ["No standard routine lab; consider symptom tracking + clinician guidance"],
  "B vitamins": ["CBC", "Homocysteine (optional)", "B12 + Folate"],
};


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
function dedupeCheckins(checkins){
  const seen = new Set();
  return (checkins || []).filter(c => {
    const key = `${c.dateISO}|${c.adherencePct}|${JSON.stringify(c.wellbeing || {})}|${(c.notes || "").trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
let state = load();
let backendSaveTimer = null;

let profileModalOpen = false;
let profileModalCommit = null;

function save(opts){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleBackendSave();
  if (!opts || !opts.skipRender) renderAll();
}
function load(){
  try{
    for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.checkins)) parsed.checkins = dedupeCheckins(parsed.checkins);
        return parsed;
      }
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
  toastT("toast.reset");
}

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
      state.checkins = dedupeCheckins(data.checkins).slice().sort((a,b)=> new Date(a.dateISO||0)-new Date(b.dateISO||0));
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
      state.checkins = dedupeCheckins(localSnapshot.checkins || []);
      state.plan = { ...defaultState().plan, ...localSnapshot.plan, routine: { ...defaultState().plan.routine, ...((localSnapshot.plan && localSnapshot.plan.routine) || {}) } };
      state.wellbeingBaseline = { ...defaultState().wellbeingBaseline, ...localSnapshot.wellbeingBaseline };
      state.symptomOnlyMode = localSnapshot.symptomOnlyMode ?? state.symptomOnlyMode;
      state.feedback = localSnapshot.feedback || state.feedback;
      if(typeof localSnapshot.account?.consent === 'boolean') state.account.consent = localSnapshot.account.consent;
      if(data.user?.email) state.account.email = data.user.email;
      else if(localSnapshot.account?.email && !String(localSnapshot.account.email).includes('guest@')) state.account.email = localSnapshot.account.email;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      await saveToBackend();
      toastT("toast.saved_account");
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

/* =========================================================
   ===== UTIL =====
   ========================================================= */
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function uniq(arr){ return [...new Set(arr)]; }
function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function fmtDate(iso){
  if(!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {year:"numeric",month:"short",day:"numeric"});
}

const WELLBEING_FIELDS = [
  { key: "energy", label: "wellbeing.energy" },
  { key: "mood", label: "wellbeing.mood" },
  { key: "sleep", label: "wellbeing.sleep" },
  { key: "focus", label: "wellbeing.focus" },
];

function renderWellbeingScoreRow(fieldKey, labelKey, inputId, value){
  const score = clamp(parseInt(value, 10) || 0, 0, 10);
  const pills = Array.from({ length: 11 }, (_, n) =>
    `<button type="button" class="score-pill" data-score="${n}" aria-pressed="${n === score ? "true" : "false"}">${n}</button>`
  ).join("");
  return `
    <div class="score-picker" data-field="${escapeHtml(fieldKey)}">
      <div class="score-picker-head">
        <label for="${escapeHtml(inputId)}">${escapeHtml(t(labelKey))}</label>
        <span class="score-picker-value" data-score-value>${score}</span>
      </div>
      <div class="score-picker-track" role="group" aria-label="${escapeHtml(t(labelKey))}">
        ${pills}
      </div>
      <input type="hidden" id="${escapeHtml(inputId)}" value="${score}" />
    </div>
  `;
}

function renderWellbeingScoreGrid(values, idPrefix){
  const getId = (key)=>{
    if (!idPrefix) return key;
    return idPrefix + key.charAt(0).toUpperCase() + key.slice(1);
  };
  return `
    <div class="score-picker-grid">
      ${WELLBEING_FIELDS.map(({ key, label }) =>
        renderWellbeingScoreRow(key, label, getId(key), values?.[key] ?? 5)
      ).join("")}
    </div>
  `;
}

function wireWellbeingScorePickers(root){
  if (!root) return;
  root.querySelectorAll(".score-picker").forEach(picker => {
    const hidden = picker.querySelector('input[type="hidden"]');
    const valueEl = picker.querySelector("[data-score-value]");
    picker.querySelectorAll(".score-pill").forEach(btn => {
      btn.addEventListener("click", ()=>{
        const score = clamp(parseInt(btn.dataset.score || "0", 10), 0, 10);
        picker.querySelectorAll(".score-pill").forEach(b =>
          b.setAttribute("aria-pressed", b === btn ? "true" : "false")
        );
        if (hidden) hidden.value = String(score);
        if (valueEl) valueEl.textContent = String(score);
      });
    });
  });
}

function readWellbeingScores(ids){
  const read = (id)=> clamp(parseInt(document.getElementById(id)?.value || "0", 10), 0, 10);
  return {
    energy: read(ids.energy),
    mood: read(ids.mood),
    sleep: read(ids.sleep),
    focus: read(ids.focus),
  };
}

const CHECKIN_IMPACT_OPTIONS = ["Worse", "No change", "Slightly better", "Much better", "Not present"];
const CHECKIN_IMPACT_KEYS = {
  "Worse": "impact.worse",
  "No change": "impact.no_change",
  "Slightly better": "impact.slightly_better",
  "Much better": "impact.much_better",
  "Not present": "impact.not_present",
};

function renderImpactPicker(inputId, selected){
  const value = CHECKIN_IMPACT_OPTIONS.includes(selected) ? selected : "No change";
  const chips = CHECKIN_IMPACT_OPTIONS.map(x =>
    `<button type="button" class="chip impact-chip" data-impact="${escapeHtml(x)}" aria-pressed="${x === value ? "true" : "false"}">${escapeHtml(t(CHECKIN_IMPACT_KEYS[x]))}</button>`
  ).join("");
  return `
    <div class="sym-impact-picker" data-impact-picker>
      <span class="sym-field-label">${escapeHtml(t("checkin.change"))}</span>
      <div class="chips sym-impact-chips" role="group" aria-label="${escapeHtml(t("checkin.change"))}">${chips}</div>
      <input type="hidden" id="${escapeHtml(inputId)}" value="${escapeHtml(value)}" />
    </div>
  `;
}

function wireImpactPickers(root){
  if (!root) return;
  root.querySelectorAll("[data-impact-picker]").forEach(picker => {
    const hidden = picker.querySelector('input[type="hidden"]');
    picker.querySelectorAll(".impact-chip").forEach(btn => {
      btn.addEventListener("click", ()=>{
        const val = btn.dataset.impact || "No change";
        picker.querySelectorAll(".impact-chip").forEach(b =>
          b.setAttribute("aria-pressed", b === btn ? "true" : "false")
        );
        if (hidden) hidden.value = val;
      });
    });
  });
}

/* =========================================================
   ===== TOAST =====
   ========================================================= */
let toastTimer = null;
function showToast(msg="Saved ✓"){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ t.style.display="none"; }, 1200);
}

/* =========================================================
   ===== CITATIONS (CLICKABLE PMID/PMCID) =====
   ========================================================= */
function citationToLink(token){
  const t = String(token||"").trim();
  if(/^PMID:\d+$/i.test(t)){
    const id = t.split(":")[1];
    return `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
  }
  if(/^PMCID:PMC\d+$/i.test(t)){
    const id = t.split(":")[1].toUpperCase();
    return `https://pmc.ncbi.nlm.nih.gov/articles/${id}/`;
  }
  const doiMatch = t.match(/^DOI:\s*(10\.\S+)$/i);
  if(doiMatch) return `https://doi.org/${doiMatch[1]}`;
  if(/^10\.\d{4,}\/\S+$/i.test(t)) return `https://doi.org/${t}`;
  if(/^https?:\/\/\S+$/i.test(t)) return t;
  return "";
}
function renderCitationChip(token){
  const url = citationToLink(token);
  const safeTok = escapeHtml(token);
  if(url){
    return `<a class="cite" href="${url}" target="_blank" rel="noopener noreferrer">${safeTok}</a>`;
  }
  return `<span class="cite">${safeTok}</span>`;
}

/* =========================================================
   ===== SCORING + RECOMMENDATIONS (TEXT-ONLY) =====
   ========================================================= */
function doseFactor(d){ return d==="low" ? 0.85 : (d==="high" ? 1.25 : 1.0); }
function durationFactor(months){ const m = clamp(months||0, 0, 24); return 0.55 + (m/24)*0.75; }
function severityFactor(sev){ return sev==="severe" ? 1.35 : (sev==="moderate" ? 1.15 : 1.0); }
function qualityWeight(q){ return q==="High" ? 4 : (q==="Moderate" ? 3 : 2); }
function tierFromScore(score){ if(score >= 70) return "High"; if(score >= 45) return "Moderate"; return "Low"; }

function computeNutrientScores(){
  const scores = {};
  const sevF = severityFactor(state.symptoms.severity);

  for(const mi of state.meds){
    const med = MED_DB.find(x => x.id===mi.medId);
    if(!med) continue;
    const f = doseFactor(mi.dose) * durationFactor(mi.durationMonths) * sevF;

    for(const cl of (med.claims||[])){
      const w = qualityWeight(cl.source_quality) * 10 * f;
      scores[cl.nutrient] = (scores[cl.nutrient]||0) + w;
    }
  }

  // symptom-only fallback
  if(Object.keys(scores).length===0 && state.symptoms.selected.length){
    const burden = state.symptoms.selected.length * 9 * sevF;
    scores["Magnesium"] = (scores["Magnesium"]||0) + burden;
    scores["B vitamins"] = (scores["B vitamins"]||0) + burden * 0.85;
    scores["Vitamin D"] = (scores["Vitamin D"]||0) + burden * 0.60;
  }

  return Object.entries(scores)
    .map(([k,v]) => [k, clamp(Math.round(v), 0, 100)])
    .sort((a,b)=>b[1]-a[1]);
}

function recommendSupplements(nutrientScores){
  const out = [];
  for(const [nut, score] of nutrientScores.slice(0,10)){
    const tier = tierFromScore(score);
    const sups = (SUPPLEMENT_MAP[nut] || []);
    for(const s of sups){ out.push({ nutrient: nut, tier, supplement: s, score }); }
  }
  const rank = { High:3, Moderate:2, Low:1 };
  const best = new Map();
  for(const item of out){
    const prev = best.get(item.supplement);
    if(!prev || rank[item.tier] > rank[prev.tier]) best.set(item.supplement, item);
  }
  return [...best.values()].sort((a,b)=>{
    if(rank[b.tier] !== rank[a.tier]) return rank[b.tier]-rank[a.tier];
    return (b.score||0) - (a.score||0);
  }).slice(0,10);
}

/* =========================================================
   ===== EVIDENCE =====
   ========================================================= */
function claimsForSelectedMeds(){
  const out = [];
  for(const mi of state.meds){
    const med = MED_DB.find(x => x.id===mi.medId);
    if(!med) continue;
    for(const cl of (med.claims||[])){ out.push({ medId: med.id, medName: med.name, ...cl }); }
  }
  return out;
}
function aggregateEvidenceByNutrient(claims){
  const map = {};
  for(const cl of claims){
    if(!map[cl.nutrient]) map[cl.nutrient] = [];
    map[cl.nutrient].push(cl);
  }
  return map;
}
function summarizeSourceQuality(claims){
  const qs = (claims||[]).map(c=>c.source_quality).filter(Boolean);
  if(qs.includes("High")) return "High";
  if(qs.includes("Moderate")) return "Moderate";
  if(qs.includes("Preliminary")) return "Preliminary";
  return "Pending";
}
function badgeClass(q){
  if(q==="High") return "high";
  if(q==="Moderate") return "mod";
  if(q==="Preliminary") return "pre";
  return "pending";
}
function renderEvidencePanel(nutrient, claims){
  const labs = LAB_SUGGESTIONS[nutrient] || [];
  const labHtml = labs.length
    ? `<div class="note"><strong>${escapeHtml(t("evidence.labs"))}</strong> ${escapeHtml(labs.join(", "))}</div>`
    : `<div class="note"><strong>${escapeHtml(t("evidence.labs"))}</strong> ${escapeHtml(t("evidence.labs_ask"))}</div>`;

  if(!claims || !claims.length){
    return `<div class="fineprint">${escapeHtml(t("evidence.not_loaded"))}</div>${labHtml}`;
  }

  const seen = new Set();
  const citations = [];
  const notes = [];

  for(const cl of claims){
    (cl.citations||[]).forEach(id=>{
      const key = String(id||"").trim();
      if(!key || seen.has(key)) return;
      seen.add(key);
      citations.push(key);
    });
    if(cl.notes && String(cl.notes).trim()) notes.push(String(cl.notes).trim());
  }

  const noteText = uniq(notes).slice(0,3).join(" ");
  const citeHtml = citations.slice(0,6).map(id => renderCitationChip(id)).join("");

  return `
    <div class="fineprint">${escapeHtml(t("evidence.citations_click"))}</div>
    <div class="citeList">${citeHtml || `<div class="fineprint">${escapeHtml(t("evidence.no_citations"))}</div>`}</div>
    ${noteText ? `<div class="note"><strong>${escapeHtml(t("evidence.notes"))}</strong> ${escapeHtml(noteText)}</div>` : ``}
    ${labHtml}
  `;
}

function evidenceCoverage(){
  const selected = state.meds.map(m=>m.medId);
  const evidenceCount = selected.filter(id=>{
    const med = MED_DB.find(x=>x.id===id);
    return med && (med.claims||[]).some(c => (c.citations||[]).length>0);
  }).length;
  return { selectedCount: selected.length, evidenceCount };
}

function safetyFlags(){
  const p = state.profile || {};
  const flags = [];
  if(p.pregnant) flags.push(t("flag.pregnant"));
  if(p.kidneyDisease) flags.push(t("flag.kidney"));
  if(p.anticoagulants) flags.push(t("flag.anticoag"));
  return flags;
}

/* =========================================================
   ===== SYMPTOMS =====
   ========================================================= */
function getSymptomUniverse(){
  const base = state.meds.length ? (()=>{
    const chips = [];
    state.meds.forEach(mi=>{
      const med = MED_DB.find(x=>x.id===mi.medId);
      if(med) chips.push(...(med.symptomChips||[]));
    });
    return uniq(chips).slice(0,24);
  })() : GENERIC_SYMPTOMS.slice();
  return uniq([...(base||[]), ...((state.symptoms && state.symptoms.custom) || [])]).slice(0,40);
}

function addCustomSymptom(sym){
  const value = String(sym||'').trim();
  if(!value) return false;
  if(!state.symptoms.custom.includes(value)) state.symptoms.custom.push(value);
  if(!state.symptoms.selected.includes(value)) state.symptoms.selected.push(value);
  return true;
}

function computeDrugInteractions(){
  const ids = state.meds.map(m=>m.medId);
  const interactions = [];
  if(ids.includes('metformin') && ids.includes('omeprazole')){
    interactions.push({
      title: t('engine.interaction.metformin_omeprazole.title'),
      level:'Moderate',
      note: t('engine.interaction.metformin_omeprazole.note'),
      action: t('engine.interaction.metformin_omeprazole.action'),
    });
  }
  if(ids.includes('lisinopril') && ids.includes('losartan')){
    interactions.push({
      title: t('engine.interaction.lisinopril_losartan.title'),
      level:'High',
      note: t('engine.interaction.lisinopril_losartan.note'),
      action: t('engine.interaction.lisinopril_losartan.action'),
    });
  }
  if(ids.includes('amlodipine') && ids.includes('metoprolol')){
    interactions.push({
      title: t('engine.interaction.amlodipine_metoprolol.title'),
      level:'Moderate',
      note: t('engine.interaction.amlodipine_metoprolol.note'),
      action: t('engine.interaction.amlodipine_metoprolol.action'),
    });
  }
  return interactions;
}

function computeContraindications(){
  const ids = state.meds.map(m=>m.medId);
  const flags = [];
  if(state.profile.pregnant && (ids.includes('lisinopril') || ids.includes('losartan'))){
    flags.push({
      title: t('engine.contra.pregnancy_ace_arb.title'),
      level:'High',
      note: t('engine.contra.pregnancy_ace_arb.note'),
      action: t('engine.contra.pregnancy_ace_arb.action'),
    });
  }
  if(state.profile.kidneyDisease && (ids.includes('metformin') || ids.includes('lisinopril') || ids.includes('losartan'))){
    flags.push({
      title: t('engine.contra.kidney.title'),
      level:'High',
      note: t('engine.contra.kidney.note'),
      action: t('engine.contra.kidney.action'),
    });
  }
  if(state.profile.anticoagulants && state.plan.recommendedSupplements.some(x=>String(x).toLowerCase().includes('coq10'))){
    flags.push({
      title: t('engine.contra.anticoag_supplement.title'),
      level:'Moderate',
      note: t('engine.contra.anticoag_supplement.note'),
      action: t('engine.contra.anticoag_supplement.action'),
    });
  }
  return flags;
}


function levelClass(level){
  if(level === "High") return "alertHigh";
  if(level === "Moderate") return "alertModerate";
  return "alertLow";
}

function computeMedicationSuccessPrediction(){
  let score = 50;
  if(state.plan.started) score += 10;
  if(state.checkins.length >= 2) score += 10;
  if(state.symptoms.severity === "severe") score -= 15;
  if(state.symptoms.selected.length >= 4) score -= 10;
  score -= computeDrugInteractions().length * 8;
  score -= computeContraindications().length * 10;
  const last = latestCheckin();
  if(last){
    if(last.adherencePct >= 80) score += 15;
    else if(last.adherencePct < 60) score -= 15;
  }
  score = clamp(score, 0, 100);
  const level = score >= 75 ? "Strong" : score >= 50 ? "Moderate" : "At risk";
  const reason = score >= 75
    ? t('engine.prediction.reason_strong')
    : score >= 50
      ? t('engine.prediction.reason_moderate')
      : t('engine.prediction.reason_at_risk');
  return { score, level, reason };
}

function detectHealthPatterns(){
  const ids = state.meds.map(m=>m.medId);
  const syms = state.symptoms.selected || [];
  const patterns = [];
  if(ids.includes('metformin') && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Tingling hands/feet'))){
    patterns.push({ title: t('engine.pattern.metformin_b12.title'), confidence:'High', note: t('engine.pattern.metformin_b12.note') });
  }
  if(ids.includes('omeprazole') && (syms.includes('Muscle cramps') || syms.includes('Dizziness') || syms.includes('Fatigue'))){
    patterns.push({ title: t('engine.pattern.ppi_magnesium.title'), confidence:'Moderate', note: t('engine.pattern.ppi_magnesium.note') });
  }
  if(ids.includes('atorvastatin') && (syms.includes('Muscle aches') || syms.includes('Fatigue'))){
    patterns.push({ title: t('engine.pattern.statin.title'), confidence:'Moderate', note: t('engine.pattern.statin.note') });
  }
  if(state.symptomOnlyMode && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Poor focus'))){
    patterns.push({ title: t('engine.pattern.symptom_bvitamin.title'), confidence:'Moderate', note: t('engine.pattern.symptom_bvitamin.note') });
  }
  if(state.symptomOnlyMode && (syms.includes('Muscle cramps') || syms.includes('Sleep changes') || syms.includes('Anxiety'))){
    patterns.push({ title: t('engine.pattern.symptom_magnesium.title'), confidence:'Moderate', note: t('engine.pattern.symptom_magnesium.note') });
  }
  return patterns;
}

function computeInsightEngine(){
  const patterns = detectHealthPatterns();
  const interactions = computeDrugInteractions();
  const contraindications = computeContraindications();
  const prediction = computeMedicationSuccessPrediction();
  const topScore = computeNutrientScores()[0];
  const symptomText = (state.symptoms.selected || []).slice(0,4).join(", ") || t('engine.insight.no_symptoms');
  const medNames = state.meds.map(m => {
    const med = MED_DB.find(x=>x.id===m.medId);
    return med ? med.name : m.medId;
  }).join(", ") || t('engine.insight.no_meds');

  let summary = t('engine.insight.summary_empty');
  let meaning = t('engine.insight.meaning_empty');
  let doctorPrompt = t('engine.insight.doctor_empty');

  if(patterns.length){
    const top = patterns[0];
    summary = t('engine.insight.summary_pattern', { meds: medNames, pattern: top.title.toLowerCase() });
    meaning = top.note || t('engine.insight.meaning_default');
    doctorPrompt = interactions.length || contraindications.length
      ? t('engine.insight.doctor_pattern_alerts', { pattern: top.title })
      : t('engine.insight.doctor_pattern', { pattern: top.title });
  } else if(topScore){
    summary = t('engine.insight.summary_nutrient', { symptoms: symptomText, nutrient: topScore[0] });
    meaning = t('engine.insight.meaning_nutrient', { nutrient: topScore[0] });
    doctorPrompt = t('engine.insight.doctor_nutrient', { nutrient: topScore[0] });
  }

  if(prediction.score < 50){
    meaning += t('engine.insight.meaning_low_prediction');
  }
  if(interactions.length){
    meaning += interactions.length > 1
      ? t('engine.insight.meaning_interactions_many', { count: interactions.length })
      : t('engine.insight.meaning_interactions_one', { count: interactions.length });
  }
  if(contraindications.length){
    meaning += contraindications.length > 1
      ? t('engine.insight.meaning_cautions_many', { count: contraindications.length })
      : t('engine.insight.meaning_cautions_one', { count: contraindications.length });
  }

  return { summary, meaning, doctorPrompt, patterns, interactions, contraindications, prediction };
}

function generateDynamicHealthStory(checkinOverride){
  const medNames = state.meds.map(m => {
    const med = MED_DB.find(x=>x.id===m.medId);
    return med ? med.name : m.medId;
  });
  const symptoms = state.symptoms?.selected || [];
  const severity = state.symptoms?.severity || "mild";
  const patterns = detectHealthPatterns();
  const success = computeMedicationSuccessPrediction();
  const interactions = computeDrugInteractions();
  const contraindications = computeContraindications();
  const last = checkinOverride ?? latestCheckin();
  const nutrientScores = computeNutrientScores();
  const topNutrient = nutrientScores.length ? nutrientScores[0] : null;
  const parts = [];

  if (medNames.length) {
    const medsText = medNames.slice(0, 2).join(", ") + (medNames.length > 2 ? t("summary.story.meds_other") : "");
    const maxMonths = Math.max(...state.meds.map(x => Number(x.durationMonths || 0)), 0);
    if (maxMonths > 0) {
      parts.push(t("summary.story.meds_duration", { meds: medsText, months: maxMonths }));
    } else {
      parts.push(t("summary.story.meds", { meds: medsText }));
    }
  } else if (state.symptomOnlyMode) {
    parts.push(t("summary.story.symptom_only"));
  } else {
    parts.push(t("summary.story.no_meds"));
  }

  if (symptoms.length) {
    const symText = symptoms.slice(0, 3).join(", ") + (symptoms.length > 3 ? ", and other symptoms" : "");
    parts.push(t("summary.story.symptoms", { symptoms: symText, severity }));
  } else {
    parts.push(t("summary.story.no_symptoms"));
  }

  if (patterns.length) {
    const p = patterns[0];
    parts.push(t("summary.story.pattern", { pattern: p.title.toLowerCase(), note: p.note }));
  } else if (topNutrient) {
    parts.push(t("summary.story.top_nutrient", { nutrient: topNutrient[0], score: topNutrient[1] }));
  } else {
    parts.push(t("summary.story.no_signal"));
  }

  if (last) {
    const better = (last.symptoms?.items || []).filter(x => x.change === "Much better" || x.change === "Slightly better").map(x => x.symptom);
    const worse = (last.symptoms?.items || []).filter(x => x.change === "Worse").map(x => x.symptom);
    if (better.length && !worse.length) {
      parts.push(t("summary.story.improved", { symptoms: better.slice(0, 2).join(" and ") }));
    } else if (worse.length) {
      parts.push(t("summary.story.worse", { symptoms: worse.slice(0, 2).join(" and ") }));
    } else {
      parts.push(t("summary.story.mixed"));
    }
    parts.push(t("summary.story.success_with_checkin", { score: success.score, level: success.level }));
  } else {
    parts.push(t("summary.story.success_no_checkin", { score: success.score, level: success.level }));
  }

  if (interactions.length || contraindications.length) {
    const bits = [];
    if (interactions.length) bits.push(t("summary.story.alert_interactions", { count: interactions.length }));
    if (contraindications.length) bits.push(t("summary.story.alert_cautions", { count: contraindications.length }));
    parts.push(t("summary.story.alerts", { alerts: bits.join(" and ") }));
  }

  if (topNutrient) {
    parts.push(t("summary.story.discuss_nutrient", { nutrient: topNutrient[0] }));
  } else {
    parts.push(t("summary.story.discuss_general"));
  }

  return parts.join(" ");
}

function computePopulationInsights(){
  const syms = state.symptoms.selected || [];
  const items = (state.checkins || []).flatMap(c => (c.symptoms?.items || []));
  const counts = {};
  items.forEach(i => { counts[i.symptom] = (counts[i.symptom] || 0) + 1; });
  const topTracked = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
  return {
    topSymptoms: syms.slice(0,3),
    trackedSymptoms: topTracked,
    checkinCount: state.checkins.length,
    message: state.checkins.length
      ? t('engine.population.with_checkins')
      : t('engine.population.no_checkins')
  };
}

function downloadDoctorReport(checkinIndex){
  if (!state.checkins.length) return;
  if (typeof checkinIndex !== "number" || checkinIndex < 0 || checkinIndex >= state.checkins.length) {
    checkinIndex = state.checkins.length - 1;
  }
  const checkin = state.checkins[checkinIndex];
  const snapshot = buildClinicianSnapshotText(checkinIndex);
  const datePart = checkin?.dateISO ? String(checkin.dateISO).slice(0, 10) : "report";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>GeneoRx Doctor Report</title><style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.45;color:#111}pre{white-space:pre-wrap;font-family:Menlo,monospace;font-size:12px;border:1px solid #ddd;border-radius:12px;padding:16px;background:#fafafa}</style></head><body><h1>GeneoRx Doctor Report</h1><p>Check-in ${checkinIndex + 1} · ${escapeHtml(fmtDate(checkin.dateISO))}</p><pre>${snapshot.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</pre></body></html>`;
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `geneorx_report_checkin_${checkinIndex + 1}_${datePart}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

let reportPickerSelectedIndex = 0;

function checkinListLabel(c, idx){
  const latest = idx === state.checkins.length - 1;
  return `${escapeHtml(fmtDate(c.dateISO))} · ${escapeHtml(t("common.adherence"))} <strong>${c.adherencePct}%</strong>${latest ? ` · ${escapeHtml(t("common.latest"))}` : ""}`;
}

function openReportPickerModal(preferredIndex){
  reportPickerSelectedIndex = typeof preferredIndex === "number"
    ? clamp(preferredIndex, 0, state.checkins.length - 1)
    : state.checkins.length - 1;

  const list = document.getElementById("reportPickerList");
  if (!list) return;
  list.innerHTML = "";

  state.checkins.forEach((c, idx)=>{
    const div = document.createElement("div");
    div.className = `item report-picker-item${idx === reportPickerSelectedIndex ? " report-picker-item--on" : ""}`;
    div.innerHTML = `
      <div class="k">${escapeHtml(t("checkin.label_n"))} ${idx + 1}${idx === state.checkins.length - 1 ? ` · ${escapeHtml(t("common.latest"))}` : ""}</div>
      <div class="v">${escapeHtml(fmtDate(c.dateISO))} · ${escapeHtml(t("common.adherence"))} <strong>${c.adherencePct}%</strong></div>
    `;
    div.addEventListener("click", ()=>{
      reportPickerSelectedIndex = idx;
      list.querySelectorAll(".report-picker-item").forEach(el => el.classList.remove("report-picker-item--on"));
      div.classList.add("report-picker-item--on");
    });
    list.appendChild(div);
  });

  document.getElementById("reportPickerBackdrop").style.display = "block";
  document.getElementById("reportPickerModal").style.display = "block";
}

function closeReportPickerModal(){
  const backdrop = document.getElementById("reportPickerBackdrop");
  const modal = document.getElementById("reportPickerModal");
  if (backdrop) backdrop.style.display = "none";
  if (modal) modal.style.display = "none";
}

function promptDownloadDoctorReport(preferredIndex){
  promptMyCheckins(preferredIndex);
}

function updateMyCheckinsAvailability(){
  if (!btnMyCheckinsEl) return;
  const hasCheckins = state.checkins.length > 0;
  btnMyCheckinsEl.disabled = !hasCheckins;
  btnMyCheckinsEl.style.opacity = hasCheckins ? "1" : "0.45";
  btnMyCheckinsEl.style.cursor = hasCheckins ? "pointer" : "not-allowed";
  btnMyCheckinsEl.title = hasCheckins ? t("tooltip.my_checkins") : t("tooltip.my_checkins_disabled");
  if (pillChecksBadgeEl) {
    pillChecksBadgeEl.classList.toggle("is-disabled", !hasCheckins);
    pillChecksBadgeEl.title = hasCheckins ? t("tooltip.checkins_badge") : t("tooltip.checkins_badge_disabled");
  }
}

function renderCheckinDetailHtml(checkin){
  const wellbeing = checkin.wellbeing || {};
  const symptoms = (checkin.symptoms?.items || []).map(x => `${x.symptom}: ${impactLabel(x.change || "No change")}`).join(" · ");
  const supplements = (checkin.supplementsTaken || []).length ? checkin.supplementsTaken.join(", ") : t("checkin.none_logged");
  const sideEffects = (checkin.sideEffects || []).length ? checkin.sideEffects.join(", ") : t("common.none");
  const notes = checkin.notes ? checkin.notes : t("checkin.no_notes");
  return `
    <div class="checkin-detail-panel">
      <div class="checkin-detail-row"><span class="checkin-detail-k">${escapeHtml(t("checkin.detail.wellbeing"))}</span><span class="checkin-detail-v">${escapeHtml(wellbeingSummaryText(wellbeing))}</span></div>
      <div class="checkin-detail-row"><span class="checkin-detail-k">${escapeHtml(t("checkin.detail.symptoms"))}</span><span class="checkin-detail-v">${symptoms ? escapeHtml(symptoms) : escapeHtml(t("checkin.none_tracked"))}</span></div>
      <div class="checkin-detail-row"><span class="checkin-detail-k">${escapeHtml(t("checkin.detail.supplements"))}</span><span class="checkin-detail-v">${escapeHtml(supplements)}</span></div>
      <div class="checkin-detail-row"><span class="checkin-detail-k">${escapeHtml(t("checkin.detail.side_effects"))}</span><span class="checkin-detail-v">${escapeHtml(sideEffects)}</span></div>
      <div class="checkin-detail-row"><span class="checkin-detail-k">${escapeHtml(t("checkin.detail.notes"))}</span><span class="checkin-detail-v">${escapeHtml(notes)}</span></div>
    </div>
  `;
}

let checkinViewSelectedIndex = 0;

function renderCheckinViewModalContent(){
  const list = document.getElementById("checkinViewList");
  const detail = document.getElementById("checkinViewDetail");
  if (!list || !detail) return;

  list.innerHTML = "";
  state.checkins.forEach((c, idx)=>{
    const div = document.createElement("div");
    div.className = `item report-picker-item${idx === checkinViewSelectedIndex ? " report-picker-item--on" : ""}`;
    div.innerHTML = `<div class="v">${checkinListLabel(c, idx)}</div>`;
    div.addEventListener("click", ()=>{
      checkinViewSelectedIndex = idx;
      renderCheckinViewModalContent();
    });
    list.appendChild(div);
  });

  detail.innerHTML = renderCheckinDetailHtml(state.checkins[checkinViewSelectedIndex]);
}

function openCheckinViewModal(preferredIndex){
  if (!state.checkins.length) return;
  checkinViewSelectedIndex = typeof preferredIndex === "number"
    ? clamp(preferredIndex, 0, state.checkins.length - 1)
    : state.checkins.length - 1;
  renderCheckinViewModalContent();
  document.getElementById("checkinViewBackdrop").style.display = "block";
  document.getElementById("checkinViewModal").style.display = "block";
}

function closeCheckinViewModal(){
  const backdrop = document.getElementById("checkinViewBackdrop");
  const modal = document.getElementById("checkinViewModal");
  if (backdrop) backdrop.style.display = "none";
  if (modal) modal.style.display = "none";
}

function promptMyCheckins(preferredIndex){
  if (!state.checkins.length) {
    toastT("checkin.no_checkins_toast");
    setStep(5);
    return;
  }
  openCheckinViewModal(preferredIndex);
}

function promptViewCheckin(){
  promptMyCheckins();
}

/* =========================================================
   ===== ROUTINE BUILDER =====
   ========================================================= */
function buildRoutineFromSupplements(supps){
  const routine = { morning:[], midday:[], night:[], notes:[] };
  const s = (supps||[]).map(x=>String(x).toLowerCase());
  const hasMg = s.some(x=>x.includes("magnesium"));
  const hasB12 = s.some(x=>x.includes("b12"));
  const hasCoq10 = s.some(x=>x.includes("coq10"));
  const hasD = s.some(x=>x.includes("vitamin d"));

  if(hasB12) routine.morning.push("Methyl B12   morning (often energizing)");
  if(hasD) routine.morning.push("Vitamin D3   with a meal that includes fat");
  if(hasCoq10) routine.midday.push("CoQ10   with lunch (with food)");
  if(hasMg) routine.night.push("Magnesium glycinate   evening/night (often calming)");

  routine.notes.push("If nausea occurs, take supplements with food and reduce dose temporarily.");
  routine.notes.push("Avoid stacking new supplements all at once phase in over 3–7 days.");
  routine.notes.push("Educational only; confirm timing/dose with clinician.");

  return routine;
}

/* =========================================================
   ===== COACH + CHECKINS =====
   ========================================================= */
function latestCheckin(){
  if(!state.checkins.length) return null;
  return state.checkins[state.checkins.length-1];
}

function checkinStorageNote(){
  return IS_GUEST
    ? t("checkin.storage_guest")
    : t("checkin.storage_account");
}

function wireReportDownloadButton(btn, preferredIndex){
  if(!btn) return;
  btn.addEventListener("click", ()=> promptMyCheckins(preferredIndex));
}

function renderLastCheckinCard(last, options = {}){
  const { showProgressLink = false, showDownloadReport = false } = options;
  const checkinIndex = state.checkins.findIndex(c => c === last);
  const wellbeing = last.wellbeing || {};
  const symptoms = (last.symptoms?.items || []).map(x => `${x.symptom}: ${impactLabel(x.change || "No change")}`).join(" · ");
  const supplements = (last.supplementsTaken || []).length ? last.supplementsTaken.join(", ") : t("checkin.none_logged");
  const sideEffects = (last.sideEffects || []).length ? last.sideEffects.join(", ") : t("common.none");
  const notes = last.notes ? last.notes : t("checkin.no_notes");
  const actionBtns = [];
  if (showDownloadReport) {
    actionBtns.push(`<button class="ghost" id="btnDownloadMyReport">${escapeHtml(t("checkin.my_checkins_btn"))}</button>`);
  }
  if (showProgressLink) {
    actionBtns.push(`<button class="ghost" id="btnViewProgress">${escapeHtml(t("checkin.view_progress"))}</button>`);
  }

  const card = document.createElement("div");
  card.className = "section";
  card.innerHTML = `
    <div class="tagline">
      <strong>${escapeHtml(t("checkin.last_title"))}</strong><br>
      ${escapeHtml(fmtDate(last.dateISO))} · ${escapeHtml(t("common.adherence"))} <strong>${last.adherencePct}%</strong>
    </div>
    <div class="fineprint" style="margin-top:8px">${escapeHtml(checkinStorageNote())}</div>
    <div style="height:10px"></div>
    <div class="list">
      <div class="item"><div class="k">${escapeHtml(t("checkin.detail.wellbeing"))}</div><div class="v">${escapeHtml(wellbeingSummaryText(wellbeing))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("checkin.detail.symptoms"))}</div><div class="v">${symptoms ? escapeHtml(symptoms) : escapeHtml(t("checkin.none_tracked"))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("checkin.detail.supplements_taken"))}</div><div class="v">${escapeHtml(supplements)}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("checkin.detail.side_effects"))}</div><div class="v">${escapeHtml(sideEffects)}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("checkin.detail.notes"))}</div><div class="v">${escapeHtml(notes)}</div></div>
    </div>
    ${actionBtns.length ? `<div class="btns" style="margin-top:12px">${actionBtns.join("")}</div>` : ""}
  `;
  wireReportDownloadButton(card.querySelector("#btnDownloadMyReport"), checkinIndex >= 0 ? checkinIndex : state.checkins.length - 1);
  if (showProgressLink) {
    card.querySelector("#btnViewProgress").addEventListener("click", ()=> setStep(6));
  }
  return card;
}

function computeWeeklyCoachMessage(){
  const last = latestCheckin();
  const base = state.wellbeingBaseline || {energy:5,mood:5,sleep:5,focus:5};
  const scores = computeNutrientScores();
  const topDriver = scores.length ? `${scores[0][0]} (${scores[0][1]}%)` : t('engine.coach.bullet_empty');

  if(!last){
    return {
      headline: t('engine.coach.headline_ready'),
      bullets: [
        t('engine.coach.bullet_add_meds'),
        t('engine.coach.bullet_start_plan'),
        t('engine.coach.bullet_log_checkin'),
      ],
      nextBestAction: t('engine.coach.action_results'),
    };
  }

  const dE = last.wellbeing.energy - base.energy;
  const dM = last.wellbeing.mood - base.mood;
  const dS = last.wellbeing.sleep - base.sleep;
  const dF = last.wellbeing.focus - base.focus;

  const items = last.symptoms?.items || [];
  const best = items.reduce((acc,x)=> (acc===null || (x.changeScore||0)>(acc.changeScore||0)) ? x : acc, null);
  const worst = items.reduce((acc,x)=> (acc===null || (x.changeScore||0)<(acc.changeScore||0)) ? x : acc, null);

  let next = t('engine.coach.action_consistent');
  if(last.adherencePct < 60) next = t('engine.coach.action_adherence');
  else if((worst?.change||"") === "Worse") next = t('engine.coach.action_worse_symptom', { symptom: worst.symptom });
  else if(dE <= 0 && dS <= 0) next = t('engine.coach.action_hydration');
  else if(dE > 0 || dS > 0) next = t('engine.coach.action_nice_trend');

  const bestValue = best?.symptom ? `${best.symptom} (${impactLabel(best.change || "No change")})` : t('engine.coach.bullet_empty');
  const worstValue = worst?.symptom ? `${worst.symptom} (${impactLabel(worst.change || "No change")})` : t('engine.coach.bullet_empty');

  const bullets = [
    t('engine.coach.bullet_wellbeing', { dE: fmtDelta(dE), dM: fmtDelta(dM), dS: fmtDelta(dS), dF: fmtDelta(dF) }),
    t('engine.coach.bullet_best', { value: bestValue }),
    t('engine.coach.bullet_worst', { value: worstValue }),
    t('engine.coach.bullet_driver', { driver: topDriver }),
  ];

  const headline =
    (dE + dS + dM + dF) > 0 ? t('engine.coach.headline_trending_up') :
    (dE + dS + dM + dF) < 0 ? t('engine.coach.headline_stabilize') :
    t('engine.coach.headline_clearer_signal');

  return { headline, bullets, nextBestAction: next };
}

/* =========================================================
   ===== 30-SECOND VISIT SNAPSHOT (LOGIC) =====
   ========================================================= */
function buildClinicianSnapshotText(checkinIndex){
  let checkin = null;
  if (state.checkins.length) {
    if (typeof checkinIndex !== "number" || checkinIndex < 0 || checkinIndex >= state.checkins.length) {
      checkinIndex = state.checkins.length - 1;
    }
    checkin = state.checkins[checkinIndex];
  }
  const flags = safetyFlags();
  const meds = state.meds.map(m=>{
    const med = MED_DB.find(x=>x.id===m.medId);
    const nm = med ? med.name : m.medId;
    return `- ${nm} • dose: ${m.dose} • duration: ${m.durationMonths||0} months`;
  });

  const scores = computeNutrientScores();
  const top = scores.slice(0,6).map(([n,sc]) => `- ${n}: ${tierFromScore(sc)} signal (${sc}%)`);
  const interactions = computeDrugInteractions().map(x=>`- ${x.title} (${x.level})`);
  const contraindications = computeContraindications().map(x=>`- ${x.title} (${x.level})`);
  const success = computeMedicationSuccessPrediction();
  const patterns = detectHealthPatterns();

  const supp = (state.plan.recommendedSupplements||[]);
  const adh = checkin ? `${checkin.adherencePct}%` : " ";
  const labs = uniq(scores.slice(0,5).flatMap(([n]) => LAB_SUGGESTIONS[n] || [])).slice(0,8);
  const symptoms = state.symptoms.selected.length ? state.symptoms.selected.join(", ") : "None selected";
  const lastDate = checkin ? fmtDate(checkin.dateISO) : " ";
  const story = generateDynamicHealthStory(checkin);

  const protocolBlock = [
    "Current protocol (supplement support):",
    supp.length ? supp.map(x=>`- ${x}`).join("\n") : "- Not started / none saved",
    `Adherence (latest check-in): ${adh}`,
  ].join("\n");

  return [
    "GENEORX — YOUR DOCTOR VISIT SNAPSHOT",
    "===================================",
    "",
    `Patient: ${state.account.email || "Anonymous"}   Age: ${state.profile.age || " "}   Gender: ${state.profile.gender || " "}`,
    `Safety flags: ${flags.length ? flags.join(", ") : "None reported"}`,
    `Medication success probability: ${success.score}% (${success.level})`,
    "",
    "Medications:",
    meds.length ? meds.join("\n") : "- None reported",
    "",
    `Symptoms (recent): ${symptoms}`,
    "",
    "Detected patterns:",
    patterns.length ? patterns.map(x=>`- ${x.title} (${x.confidence})`).join("\n") : "- No strong pattern detected yet",
    "",
    "Nutrient risk signals (GeneoRx estimate):",
    top.length ? top.join("\n") : "- No signals yet (add meds/symptoms)",
    "",
    "Drug interactions:",
    interactions.length ? interactions.join("\n") : "- None identified from current internal rules",
    "",
    "Contraindications / cautions:",
    contraindications.length ? contraindications.join("\n") : "- None identified from current safety rules",
    "",
    protocolBlock,
    "",
    "Optional labs to consider (clinical context needed):",
    labs.length ? labs.map(x=>`- ${x}`).join("\n") : "-  ",
    "",
    "Health story:",
    story,
    "",
    `Latest check-in date: ${lastDate}`,
    "",
    "Note: Educational guidance with evidence transparency; confirm labs, dosing, and interactions with your clinician."
  ].join("\n");
}

/* =========================================================
   ===== SHARE / COPY / DOWNLOAD =====
   ========================================================= */
async function copyToClipboard(text){
  try{ await navigator.clipboard.writeText(text); return true; }
  catch(e){
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return true;
  }
}

/* =========================================================
   ===== UI REFS =====
   ========================================================= */
const mainEl = document.getElementById("main");
const sideEl = document.getElementById("side");
const stepsEl = document.getElementById("steps");
const pillUser = document.getElementById("pillUser");
const pillPlan = document.getElementById("pillPlan");
const pillChecks = document.getElementById("pillChecks");
const mainTitle = document.getElementById("mainTitle");
const mainSub = document.getElementById("mainSub");
const summaryTop = document.getElementById("summaryTop");
const contactBox = document.getElementById("contactBox");

const btnMyCheckinsEl = document.getElementById("btnMyCheckins");
const pillChecksBadgeEl = document.getElementById("pillChecksBadge");

if (btnMyCheckinsEl) {
  btnMyCheckinsEl.addEventListener("click", ()=> promptMyCheckins());
}
if (pillChecksBadgeEl) {
  pillChecksBadgeEl.addEventListener("click", ()=> promptMyCheckins());
}

const reportPickerBackdrop = document.getElementById("reportPickerBackdrop");
const reportPickerModal = document.getElementById("reportPickerModal");
const reportPickerClose = document.getElementById("reportPickerClose");
const reportPickerDownload = document.getElementById("reportPickerDownload");

if (reportPickerClose) {
  reportPickerClose.addEventListener("click", closeReportPickerModal);
}
if (reportPickerBackdrop) {
  reportPickerBackdrop.addEventListener("click", closeReportPickerModal);
}
if (reportPickerDownload) {
  reportPickerDownload.addEventListener("click", ()=>{
    downloadDoctorReport(reportPickerSelectedIndex);
    closeReportPickerModal();
    toastT("toast.report_downloaded");
  });
}

const checkinViewBackdrop = document.getElementById("checkinViewBackdrop");
const checkinViewClose = document.getElementById("checkinViewClose");
const checkinViewDownload = document.getElementById("checkinViewDownload");

if (checkinViewClose) checkinViewClose.addEventListener("click", closeCheckinViewModal);
if (checkinViewBackdrop) checkinViewBackdrop.addEventListener("click", closeCheckinViewModal);
if (checkinViewDownload) {
  checkinViewDownload.addEventListener("click", ()=>{
    downloadDoctorReport(checkinViewSelectedIndex);
    toastT("toast.report_downloaded");
  });
}


/* Share button — readable summary for review (not raw JSON) */
document.getElementById("btnShare").addEventListener("click", async ()=>{
  const snapshot = buildClinicianSnapshotText();

  if (navigator.share) {
    try {
      await navigator.share({
        title: "GeneoRx review summary",
        text: snapshot,
      });
      toastT("toast.shared");
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  }

  await copyToClipboard(snapshot);
  promptDownloadDoctorReport();
  toastT("toast.summary_copied");
});

/* =========================================================
   ===== SNAPSHOT MODAL WIRES =====
   ========================================================= */
const backdrop = document.getElementById("backdrop");
const modal = document.getElementById("modal");
const snapText = document.getElementById("snapText");

function openSnapshotModal(){
  snapText.textContent = buildClinicianSnapshotText();
  backdrop.style.display="block";
  modal.style.display="block";
}
function closeSnapshotModal(){
  backdrop.style.display="none";
  modal.style.display="none";
}
document.getElementById("snapClose").addEventListener("click", closeSnapshotModal);
backdrop.addEventListener("click", closeSnapshotModal);
document.getElementById("snapCopy").addEventListener("click", async ()=>{
  await copyToClipboard(snapText.textContent);
  showToast(t("common.copied"));
});
document.getElementById("snapPrint").addEventListener("click", ()=>{
  const w = window.open("", "_blank");
  const pre = snapText.textContent.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  w.document.write(`<pre style="font-family: ui-monospace, Menlo, Consolas, monospace; white-space:pre-wrap; font-size:12px;">${pre}</pre>`);
  w.document.close();
  w.focus();
  w.print();
});

const insightBackdrop = document.getElementById("insightBackdrop");
const insightModal = document.getElementById("insightModal");
const insightSummary = document.getElementById("insightSummary");
const insightMeaning = document.getElementById("insightMeaning");
const insightDoctor = document.getElementById("insightDoctor");
const insightWhy = document.getElementById("insightWhy");


function showInsightModal(){
  const insight = computeInsightEngine();
  insightSummary.innerHTML = `<strong>${escapeHtml(insight.summary)}</strong>`;
  insightMeaning.textContent = insight.meaning;
  insightDoctor.textContent = insight.doctorPrompt;
  insightWhy.innerHTML = `${insight.patterns.length ? `${escapeHtml(t("summary.pattern"))}: <strong>${escapeHtml(insight.patterns[0].title)}</strong><br>` : ''}${insight.interactions.length ? `${escapeHtml(t("summary.interactions_field"))}: <strong>${insight.interactions.length}</strong><br>` : ''}${insight.contraindications.length ? `${escapeHtml(t("summary.contraindications_field"))}: <strong>${insight.contraindications.length}</strong><br>` : ''}${escapeHtml(t("summary.success_prediction"))}: <strong>${insight.prediction.score}%</strong> (${escapeHtml(successLabel(insight.prediction.level))})`;
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
  if(foot) foot.textContent = t('modal.insight.preparing');
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
    t('modal.reveal.progress1'),
    t('modal.reveal.progress2'),
    t('modal.reveal.progress3'),
    t('modal.reveal.progress4'),
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
      if(foot) foot.textContent = labels[i] || t('modal.insight.analyzing');
      if(bar) bar.style.width = `${Math.round(((i+1)/steps.length)*100)}%`;
      i += 1;
      revealTimer = setTimeout(advance, 420);
    } else {
      if(foot) foot.textContent = t('modal.insight.ready');
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
document.getElementById("insightClose").addEventListener("click", closeInsightModal);
insightBackdrop.addEventListener("click", closeInsightModal);
document.getElementById("insightCopy").addEventListener("click", async ()=>{
  const text = `${t("modal.insight.title")}\n\n${t("modal.insight.sees")}: ${insightSummary.textContent}\n\n${t("modal.insight.means")}: ${insightMeaning.textContent}\n\n${t("modal.insight.doctor")}: ${insightDoctor.textContent}\n\n${t("modal.insight.why")}: ${insightWhy.textContent}`;
  await copyToClipboard(text);
  showToast(t("common.copied"));
});

/* =========================================================
   ===== TABS =====
   ========================================================= */
const STEP_COUNT = 10;
const HIDDEN_STEPS = new Set([7, 9]);
const stepLabel = (i)=> t(`step.${i}`);

function visibleSteps(){
  const steps = [];
  for (let i = 0; i < STEP_COUNT; i++){
    if (HIDDEN_STEPS.has(i)) continue;
    if (i === 0 && !IS_GUEST) continue;
    steps.push(i);
  }
  return steps;
}
function normalizeStep(n){
  const v = visibleSteps();
  if (v.includes(n)) return n;
  return v.find(s => s >= n) ?? v[0] ?? 1;
}
function nextStep(n){
  const v = visibleSteps();
  const i = v.indexOf(n);
  return i >= 0 && i < v.length - 1 ? v[i + 1] : n;
}
function prevStep(n){
  const v = visibleSteps();
  const i = v.indexOf(n);
  return i > 0 ? v[i - 1] : n;
}
function profileNeedsCompletion(){
  return !state.account.consent || !String(state.profile.age || "").trim();
}

function setStep(n){
  state.step = normalizeStep(clamp(n, 0, STEP_COUNT - 1));
  save();
}

function renderSteps(){
  stepsEl.innerHTML = "";
  visibleSteps().forEach(i => {
    const s = document.createElement("div");
    s.className = `step ${i===state.step ? "on":""}`;
    s.textContent = stepLabel(i);
    s.addEventListener("click", ()=> setStep(i));
    stepsEl.appendChild(s);
  });
}

function renderPills(){
  if (pillUser) {
    pillUser.textContent = state.account.email ? state.account.email : (AUTHENTICATED_USER !== "Guest" ? AUTHENTICATED_USER : t("common.guest"));
  }
  pillPlan.textContent = state.plan.started ? `${t("pill.started")} ${fmtDate(state.plan.startDate)}` : t("pill.not_started");
  pillChecks.textContent = String(state.checkins.length);
}

function nextSuggestedStep(){
  const medsCount = state.meds.length;
  const symCount = state.symptoms.selected.length;
  if (!state.account.consent) {
    if (IS_GUEST) return { label: t("next.account"), step: 0 };
    return { label: t("profile.complete"), step: 1 };
  }
  if (medsCount === 0) return { label: t("next.meds"), step: 1 };
  if (symCount === 0) return { label: t("next.symptoms"), step: 2 };
  if (!state.plan.started) return { label: t("next.results"), step: 4 };
  return { label: t("next.checkin"), step: 5 };
}

function updateSummaryPanelMode(){
  const panel = document.getElementById("summaryPanel");
  if (!panel) return;
  panel.classList.toggle("summary-panel--hidden", state.step === 8);
}

function renderContactBox(){
  contactBox.innerHTML = "";
}

function renderSummaryTop(){
  const medsCount = state.meds.length;
  const symCount = state.symptoms.selected.length;
  const cov = evidenceCoverage();
  const flags = safetyFlags();
  const next = nextSuggestedStep();
  const noneLabel = t("summary.none");

  summaryTop.innerHTML = `
    <div class="tagline">
      <strong>${escapeHtml(t("summary.quick_status"))}</strong><br>
      ${escapeHtml(t("summary.age"))}: <strong>${escapeHtml(state.profile.age || "—")}</strong> • ${escapeHtml(t("summary.gender"))}: <strong>${escapeHtml(state.profile.gender || "—")}</strong><br>
      ${escapeHtml(t("sidebar.meds"))}: <strong>${medsCount}</strong> • ${escapeHtml(t("summary.symptoms"))}: <strong>${symCount}</strong> • ${escapeHtml(t("summary.evidence"))}: <strong>${cov.evidenceCount}/${cov.selectedCount}</strong><br>
      <div class="fineprint" style="margin-top:8px">${escapeHtml(t("summary.safety_flags_line"))}: <strong>${escapeHtml(flags.length ? flags.join(", ") : noneLabel)}</strong></div>
      <div class="fineprint" style="margin-top:8px">${escapeHtml(t("summary.next_step"))}: <strong>${escapeHtml(next.label)}</strong></div>
      <div class="quickActions">
        <button type="button" class="qaBtn ghost" data-go="0">${escapeHtml(t("step.0"))}</button>
        <button type="button" class="qaBtn ghost" data-go="1">${escapeHtml(t("step.1"))}</button>
        <button type="button" class="qaBtn ghost" data-go="2">${escapeHtml(t("step.2"))}</button>
        <button type="button" class="qaBtn ghost" data-go="4">${escapeHtml(t("step.4"))}</button>
        <button type="button" class="qaBtn ghost" data-go="5">${escapeHtml(t("step.5"))}</button>
        <button type="button" class="qaBtn ghost" data-go="6">${escapeHtml(t("step.6"))}</button>
      </div>
    </div>
  `;
  summaryTop.querySelectorAll("[data-go]").forEach(b=>{
    b.addEventListener("click", ()=> setStep(parseInt(b.getAttribute("data-go"),10)));
  });
}

function renderSide(){
  const meds = state.meds.map(m=>{
    const med = MED_DB.find(x=>x.id===m.medId);
    return med ? med.name : m.medId;
  });
  const last = latestCheckin();
  const lastLine = last
    ? `${t("sidebar.latest")}: ${fmtDate(last.dateISO)} • ${t("sidebar.adherence")} ${last.adherencePct}%`
    : t("sidebar.no_checkins");
  const flags = safetyFlags();
  const noneLabel = t("summary.none");
  const wb = state.wellbeingBaseline || {};

  const blocks = [
    {k: t("sidebar.account"), v: `${state.account.email || t("common.guest")} • Consent: ${state.account.consent ? t("sidebar.consent_yes") : t("sidebar.consent_no")}`},
    {k: t("sidebar.age_gender"), v: `${state.profile.age || "—"} / ${state.profile.gender || "—"}`},
    {k: t("sidebar.safety_flags"), v: flags.length ? flags.join(", ") : noneLabel},
    {k: t("sidebar.meds"), v: meds.length ? meds.join(", ") : t("sidebar.none_yet")},
    {k: t("sidebar.symptoms_selected"), v: state.symptoms.selected.length ? state.symptoms.selected.join(", ") : t("sidebar.none_yet")},
    {k: t("sidebar.baseline_wellbeing"), v: `${t("wellbeing.energy")} ${wb.energy ?? "—"}/10 • ${t("wellbeing.mood")} ${wb.mood ?? "—"}/10 • ${t("wellbeing.sleep")} ${wb.sleep ?? "—"}/10 • ${t("wellbeing.focus")} ${wb.focus ?? "—"}/10`},
    {k: t("sidebar.plan"), v: state.plan.started ? `${t("pill.started")} ${fmtDate(state.plan.startDate)}` : t("sidebar.not_started")},
    {k: t("sidebar.supplements"), v: state.plan.recommendedSupplements.length ? state.plan.recommendedSupplements.join(", ") : t("sidebar.no_plan_supplements")},
    {k: t("sidebar.checkins"), v: lastLine},
  ];

  sideEl.innerHTML = "";
  blocks.forEach(x=>{
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<div class="k">${escapeHtml(x.k)}</div><div class="v">${escapeHtml(x.v)}</div>`;
    sideEl.appendChild(div);
  });
}

function navButtons(prev=true,next=true,nextLabelKey="nav.continue"){
  const wrap = document.createElement("div");
  wrap.className = "btns";
  if(prev){
    const b = document.createElement("button");
    b.textContent = t("nav.back");
    b.className = "ghost";
    b.addEventListener("click", ()=> setStep(prevStep(state.step)));
    wrap.appendChild(b);
  }
  if(next){
    const b = document.createElement("button");
    b.textContent = t(nextLabelKey);
    b.className = "primary";
    b.addEventListener("click", ()=> setStep(nextStep(state.step)));
    wrap.appendChild(b);
  }
  return wrap;
}

/* =========================================================
   ===== TAB RENDERERS (DIVIDED BY TAB) =====
   ========================================================= */

/* ===== TAB 0: ACCOUNT / HEALTH PROFILE ===== */
function mountAccountForm(parent, options = {}){
  const { showWelcome = true, readOnlyEmail = false, inModal = false } = options;
  const flags = safetyFlags();
  const emailVal = readOnlyEmail && AUTH_EMAIL ? AUTH_EMAIL : (state.account.email || "");
  const s1 = document.createElement("div");
  s1.className = "section";
  s1.innerHTML = `
    ${showWelcome ? `
      <div class="tagline">
        <strong>${escapeHtml(t("account.welcome"))}</strong> ${escapeHtml(t("account.welcome_sub"))}
      </div>
      <div style="height:12px"></div>
    ` : ``}

    <div class="row">
      <div class="col">
        <label>${escapeHtml(t("account.email"))}</label>
        <input id="email" placeholder="${escapeHtml(t("account.email_placeholder"))}" value="${escapeHtml(emailVal)}" ${readOnlyEmail ? "readonly disabled" : ""} />
      </div>
      <div class="col">
        <label>${escapeHtml(t("account.consent"))}</label>
        <select id="consent">
          <option value="no" ${state.account.consent? "": "selected"}>${escapeHtml(t("common.not_yet"))}</option>
          <option value="yes" ${state.account.consent? "selected": ""}>${escapeHtml(t("common.agree"))}</option>
        </select>
      </div>
    </div>

    <div style="height:12px"></div>

    <div class="row">
      <div class="col">
        <label>${escapeHtml(t("account.age"))}</label>
        <input id="age" type="number" min="0" max="120" placeholder="${escapeHtml(t("account.age_placeholder"))}" value="${escapeHtml(state.profile.age || "")}" />
      </div>
      <div class="col">
        <label>${escapeHtml(t("account.gender"))}</label>
        <select id="gender">
          <option value="">${escapeHtml(t("common.select"))}</option>
          <option value="Female" ${state.profile.gender==="Female"?"selected":""}>${escapeHtml(t("gender.female"))}</option>
          <option value="Male" ${state.profile.gender==="Male"?"selected":""}>${escapeHtml(t("gender.male"))}</option>
          <option value="Non-binary" ${state.profile.gender==="Non-binary"?"selected":""}>${escapeHtml(t("gender.non_binary"))}</option>
          <option value="Prefer not to say" ${state.profile.gender==="Prefer not to say"?"selected":""}>${escapeHtml(t("gender.prefer_not"))}</option>
        </select>
      </div>
      <div class="col">
        <label>${escapeHtml(t("account.pregnant"))}</label>
        <select id="preg">
          <option value="no" ${!state.profile.pregnant?"selected":""}>${escapeHtml(t("common.no"))}</option>
          <option value="yes" ${state.profile.pregnant?"selected":""}>${escapeHtml(t("common.yes"))}</option>
        </select>
      </div>
    </div>

    <div style="height:12px"></div>

    <div class="row">
      <div class="col">
        <label>${escapeHtml(t("account.safety_flags"))}</label>
        <div class="fineprint">${escapeHtml(t("account.safety_flags_hint"))}</div>
        <div class="chips" style="margin-top:10px">
          <div class="chip" id="kidneyChip" aria-pressed="${state.profile.kidneyDisease?"true":"false"}">${escapeHtml(t("account.chip.kidney"))}</div>
          <div class="chip" id="antiChip" aria-pressed="${state.profile.anticoagulants?"true":"false"}">${escapeHtml(t("account.chip.anticoag"))}</div>
        </div>
      </div>
    </div>

    ${flags.length ? `
      <div class="banner">
        <strong>${escapeHtml(t("account.banner_title"))}</strong> ${escapeHtml(t("account.banner_body", { flags: flags.join(", ") }))}
      </div>
    ` : ``}

    <div class="fineprint" style="margin-top:10px">
      ${escapeHtml(t(readOnlyEmail ? "account.saved_note" : "account.prototype_note"))}
    </div>
  `;

  function commit(){
    if (!readOnlyEmail) {
      state.account.email = s1.querySelector("#email").value.trim();
    } else if (AUTH_EMAIL) {
      state.account.email = AUTH_EMAIL;
    }
    state.account.consent = s1.querySelector("#consent").value === "yes";
    const ageVal = parseInt(s1.querySelector("#age").value || "", 10);
    state.profile.age = Number.isFinite(ageVal) ? String(ageVal) : "";
    state.profile.gender = s1.querySelector("#gender").value || "";
    state.profile.pregnant = s1.querySelector("#preg").value === "yes";
  }

  function persistAccountChange(){
    commit();
    if (inModal) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      scheduleBackendSave();
      renderPills();
      renderSummaryTop();
      renderSide();
    } else {
      save();
    }
  }

  ["#consent","#age","#gender","#preg"].forEach(sel=>{
    const el = s1.querySelector(sel);
    const ev = sel === "#age" ? "input" : "change";
    el.addEventListener(ev, persistAccountChange);
    el.addEventListener("blur", persistAccountChange);
  });
  if (!readOnlyEmail) {
    const emailEl = s1.querySelector("#email");
    emailEl.addEventListener("input", persistAccountChange);
    emailEl.addEventListener("blur", persistAccountChange);
  }

  s1.querySelector("#kidneyChip").addEventListener("click", ()=>{
    state.profile.kidneyDisease = !state.profile.kidneyDisease;
    s1.querySelector("#kidneyChip").setAttribute("aria-pressed", state.profile.kidneyDisease ? "true" : "false");
    persistAccountChange();
    toastT("toast.saved");
  });
  s1.querySelector("#antiChip").addEventListener("click", ()=>{
    state.profile.anticoagulants = !state.profile.anticoagulants;
    s1.querySelector("#antiChip").setAttribute("aria-pressed", state.profile.anticoagulants ? "true" : "false");
    persistAccountChange();
    toastT("toast.saved");
  });

  parent.appendChild(s1);
  return commit;
}

function renderAccount(){
  mountAccountForm(mainEl, { showWelcome: true, readOnlyEmail: false });
  mainEl.appendChild(navButtons(false, true, "nav.continue"));
}

/* ===== TAB 1: MEDICATIONS ===== */
function renderMeds(){
  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>${escapeHtml(t("meds.title"))}</strong><br>
      ${escapeHtml(t("meds.sub"))}
    </div>

    <div id="covWrap"></div>

    <div style="height:12px"></div>

    <div class="medRow">
      <div class="col">
        <label>${escapeHtml(t("meds.search"))}</label>
        <input id="medSearch" placeholder="${escapeHtml(t("meds.search_placeholder"))}" />
      </div>

      <div class="col">
        <label>${escapeHtml(t("meds.list"))}</label>
        <select id="medPick">
          <option value="">${escapeHtml(t("common.select"))}</option>
        </select>
      </div>

      <div class="col">
        <label>${escapeHtml(t("meds.dose"))}</label>
        <select id="dosePick">
          <option value="low">${escapeHtml(t("dose.low"))}</option>
          <option value="medium" selected>${escapeHtml(t("dose.medium"))}</option>
          <option value="high">${escapeHtml(t("dose.high"))}</option>
        </select>
      </div>

      <div class="col">
        <label>${escapeHtml(t("meds.duration"))}</label>
        <input id="durPick" type="number" min="0" max="360" placeholder="${escapeHtml(t("meds.duration_placeholder"))}" value="12" />
      </div>
    </div>

    <div class="hint">
      ${escapeHtml(t("meds.custom_hint"))}
    </div>

    <div class="row" style="margin-top:10px">
      <div class="col">
        <label>${escapeHtml(t("meds.add_custom"))}</label>
        <input id="medCustom" placeholder="${escapeHtml(t("meds.custom_placeholder"))}" />
      </div>
      <div class="col" style="max-width:260px">
        <label>&nbsp;</label>
        <button class="ghost" id="btnAddCustom" style="width:100%">${escapeHtml(t("meds.add_custom_btn"))}</button>
      </div>
    </div>

    <div class="btns">
      <button class="primary" id="btnAddMed">${escapeHtml(t("meds.add_btn"))}</button>
      <button class="ghost" id="btnNoMeds">${escapeHtml(t("meds.no_meds_btn"))}</button>
    </div>

    <div class="fineprint" style="margin-top:10px">
      ${escapeHtml(t("meds.tip"))}
    </div>
  `;
  mainEl.appendChild(s1);

  const s2 = document.createElement("div");
  s2.className="section";
  s2.innerHTML = `<div class="list" id="medList"></div>`;
  mainEl.appendChild(s2);

  const covWrap = s1.querySelector("#covWrap");
  const medPick = s1.querySelector("#medPick");
  const medSearch = s1.querySelector("#medSearch");
  const medCustom = s1.querySelector("#medCustom");
  const medList = s2.querySelector("#medList");

  function sortedMedList(){ return MED_DB.slice().sort((a,b)=>a.name.localeCompare(b.name)); }
  function populateSelect(filterText=""){
    const f = (filterText||"").trim().toLowerCase();
    const list = sortedMedList().filter(m => !f || m.name.toLowerCase().includes(f) || m.id.toLowerCase().includes(f));
    const current = medPick.value;
    medPick.innerHTML = `<option value="">${escapeHtml(t("common.select"))}</option>` + list.map(m=>(
      `<option value="${m.id}">${escapeHtml(m.name)}</option>`
    )).join("");
    if(current && list.some(m=>m.id===current)) medPick.value = current;
  }

  function drawCoverage(){
    const cov = evidenceCoverage();
    covWrap.innerHTML = `
      <div class="covPill">
        ${escapeHtml(t("meds.coverage"))} <strong>${cov.evidenceCount}/${cov.selectedCount}</strong>
        <span style="opacity:.9">(${escapeHtml(cov.selectedCount ? t("meds.coverage_mapped") : t("meds.coverage_add"))})</span>
      </div>
    `;
  }

  function drawList(){
    medList.innerHTML = "";
    if(!state.meds.length){
      medList.innerHTML = `<div class="fineprint">${escapeHtml(t("meds.none_yet"))}</div>`;
      drawCoverage();
      return;
    }
    state.meds.forEach((m,idx)=>{
      const med = MED_DB.find(x=>x.id===m.medId);
      const div = document.createElement("div");
      div.className="item";
      div.innerHTML = `
        <div class="k">${escapeHtml(med?med.name:m.medId)}</div>
        <div class="v">${escapeHtml(t("meds.dose_label"))} <strong>${escapeHtml(doseLabel(m.dose))}</strong> • ${escapeHtml(t("meds.duration_label"))} <strong>${escapeHtml(String(m.durationMonths||0))} ${escapeHtml(t("meds.duration_months"))}</strong></div>
        <div class="btns"><button class="danger" data-del="${idx}">${escapeHtml(t("meds.remove"))}</button></div>
      `;
      div.querySelector("[data-del]").addEventListener("click", ()=>{
        state.meds.splice(idx,1);
        save(); toastT("toast.removed");
      });
      medList.appendChild(div);
    });
    drawCoverage();
  }

  function addMedicationToUserList(medId, dose, durationMonths){
    if(!medId) return false;
    if(state.meds.some(x => x.medId === medId)) return true;
    state.meds.push({medId, dose, durationMonths});
    return true;
  }

  function addFromPickerIfValid(){
    const medId = medPick.value;
    if(!medId) return false;
    const dose = s1.querySelector("#dosePick").value;
    const dur = parseInt(s1.querySelector("#durPick").value||"0",10);
    return addMedicationToUserList(medId, dose, clamp(isNaN(dur)?0:dur, 0, 360));
  }

  function slugifyMedicationName(name){
    return "custom_" + name.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,50);
  }

  s1.querySelector("#btnAddCustom").addEventListener("click", ()=>{
    const name = (medCustom.value||"").trim();
    if(!name) return alertT("meds.alert_name");
    const id = slugifyMedicationName(name);

    const existing = MED_DB.find(m =>
      m.id===id || m.name.toLowerCase()===name.toLowerCase() || m.name.toLowerCase()===`${name.toLowerCase()} (custom)`
    );
    const useId = existing ? existing.id : id;

    if(!existing){
      MED_DB.push({
        id: useId,
        name: `${name} (custom)`,
        symptomChips:["Fatigue","Dizziness","Brain fog","GI discomfort","Mood changes","Sleep changes"],
        claims: []
      });
    }

    const dose = s1.querySelector("#dosePick").value;
    const dur = parseInt(s1.querySelector("#durPick").value||"0",10);
    addMedicationToUserList(useId, dose, clamp(isNaN(dur)?0:dur, 0, 360));

    populateSelect(medSearch.value);
    medPick.value = useId;
    medCustom.value = "";
    save(); toastT("toast.custom_med_added");
  });

  s1.querySelector("#btnAddMed").addEventListener("click", ()=>{
    const ok = addFromPickerIfValid();
    if(!ok) return alertT("meds.alert_select");
    state.symptomOnlyMode = false;
    save(); toastT("toast.added");
  });

  s1.querySelector("#btnNoMeds").addEventListener("click", ()=>{
    state.meds = [];
    state.symptomOnlyMode = true;
    save();
    toastT("toast.symptom_only");
  });

  medSearch.addEventListener("input", ()=> populateSelect(medSearch.value));
  populateSelect(""); drawList(); drawCoverage();

  const nav = navButtons(true,true,"nav.continue");
  nav.querySelector(".primary").addEventListener("click", ()=>{
    save();
    setStep(2);
  });
  mainEl.appendChild(nav);
}

/* ===== TAB 2: SYMPTOMS ===== */
function renderSymptoms(){
  const universe = getSymptomUniverse();
  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="row">
      <div class="col" style="min-width:360px">
        <label>${escapeHtml(t("symptoms.select"))}</label>
        <div class="fineprint">${escapeHtml(t("symptoms.select_hint"))}</div>
        <div class="chips" id="chips"></div>
        <div class="btns"><button class="ghost" id="clear">${escapeHtml(t("symptoms.clear"))}</button></div>
        <div class="divider"></div>
        <label>${escapeHtml(t("symptoms.add_custom"))}</label>
        <div class="row">
          <div class="col"><input id="customSymptom" placeholder="${escapeHtml(t("symptoms.custom_placeholder"))}" /></div>
          <div class="col" style="max-width:220px"><button class="primary" id="addCustomSymptom" style="width:100%">${escapeHtml(t("symptoms.add_btn"))}</button></div>
        </div>
        <div class="fineprint" style="margin-top:8px">${escapeHtml(t("symptoms.custom_saved_hint"))}</div>
      </div>

      <div class="col" style="max-width:320px">
        <label>${escapeHtml(t("symptoms.severity"))}</label>
        <select id="sevSel">
          <option value="mild" ${state.symptoms.severity==="mild"?"selected":""}>${escapeHtml(t("symptoms.severity.mild"))}</option>
          <option value="moderate" ${state.symptoms.severity==="moderate"?"selected":""}>${escapeHtml(t("symptoms.severity.moderate"))}</option>
          <option value="severe" ${state.symptoms.severity==="severe"?"selected":""}>${escapeHtml(t("symptoms.severity.severe"))}</option>
        </select>
      </div>
    </div>
  `;
  mainEl.appendChild(s1);

  const chipsEl = s1.querySelector("#chips");
  function drawChips(){
    chipsEl.innerHTML = "";
    universe.forEach(sym=>{
      const c = document.createElement("div");
      c.className="chip";
      const on = state.symptoms.selected.includes(sym);
      c.setAttribute("aria-pressed", on ? "true":"false");
      c.textContent = sym;
      c.addEventListener("click", ()=>{
        const i = state.symptoms.selected.indexOf(sym);
        if(i>=0) state.symptoms.selected.splice(i,1);
        else state.symptoms.selected.push(sym);
        save(); toastT("toast.saved");
      });
      chipsEl.appendChild(c);
    });
  }
  drawChips();

  s1.querySelector("#clear").addEventListener("click", ()=>{
    state.symptoms.selected = [];
    save(); toastT("toast.cleared");
  });

  s1.querySelector("#addCustomSymptom").addEventListener("click", ()=>{
    const input = s1.querySelector("#customSymptom");
    if(!addCustomSymptom(input.value)) return alertT("symptoms.alert_type");
    input.value = "";
    save();
    toastT("toast.custom_added");
  });

  s1.querySelector("#customSymptom").addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      e.preventDefault();
      s1.querySelector("#addCustomSymptom").click();
    }
  });

  const nav = navButtons(true,true,"nav.continue");
  nav.querySelector(".primary").addEventListener("click", ()=>{
    state.symptoms.severity = s1.querySelector("#sevSel").value;
    save(); toastT("toast.saved");
    setStep(3);
  });
  mainEl.appendChild(nav);
}

/* ===== TAB 3: WELLBEING ===== */
function renderWellbeing(){
  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="fineprint">${escapeHtml(t("wellbeing.baseline_hint"))}</div>
    <div style="height:14px"></div>
    ${renderWellbeingScoreGrid(state.wellbeingBaseline, "")}
  `;
  wireWellbeingScorePickers(s1);
  mainEl.appendChild(s1);

  const nav = navButtons(true,true,"nav.continue");
  nav.querySelector(".primary").addEventListener("click", ()=>{
    Object.assign(state.wellbeingBaseline, readWellbeingScores({
      energy: "energy", mood: "mood", sleep: "sleep", focus: "focus",
    }));
    save(); toastT("toast.baseline_saved");
    setStep(4);
  });
  mainEl.appendChild(nav);
}

/* ===== TAB 4: RESULTS ===== */
function renderResults(){
  const scores = computeNutrientScores();
  const rec = recommendSupplements(scores);

  const claims = claimsForSelectedMeds();
  const evByNut = aggregateEvidenceByNutrient(claims);

  const cov = evidenceCoverage();
  const flags = safetyFlags();

  const coach = computeWeeklyCoachMessage();

  const s0 = document.createElement("div");
  s0.className="section";
  s0.innerHTML = `
    <div class="coachBox">
      <div class="coachTitle">
        <div class="spark">✦</div>
        <div>
          <div style="font-weight:950">${escapeHtml(t("results.coach_title"))}</div>
          <div class="fineprint">${escapeHtml(t("results.coach_sub"))}</div>
        </div>
      </div>
      <div style="height:10px"></div>
      <div class="v"><strong>${escapeHtml(coach.headline)}</strong></div>
      <div class="fineprint" style="margin-top:8px">${coach.bullets.map(x=>`• ${escapeHtml(x)}`).join("<br>")}</div>
      <div class="divider"></div>
      <div class="v"><strong>${escapeHtml(t("results.next_best_action"))}</strong> ${escapeHtml(coach.nextBestAction)}</div>
    </div>
  `;
  mainEl.appendChild(s0);

  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>${escapeHtml(t("results.title"))}</strong><br>
      ${escapeHtml(t("results.sub"))}
      <div class="fineprint" style="margin-top:8px">${escapeHtml(t("results.evidence_coverage"))} <strong>${cov.evidenceCount}/${cov.selectedCount}</strong></div>
    </div>

    ${flags.length ? `
      <div class="banner">
        <strong>${escapeHtml(t("results.banner_title"))}</strong> ${escapeHtml(t("results.banner_body", { flags: flags.join(", ") }))}
      </div>
    ` : ``}
  `;
  mainEl.appendChild(s1);

  const interactions = computeDrugInteractions();
  const contraindications = computeContraindications();
  const topSignal = scores.length ? { nutrient: scores[0][0], score: scores[0][1], tier: tierFromScore(scores[0][1]) } : null;
  const recentSymptoms = state.symptoms.selected.length ? state.symptoms.selected.slice(0,6) : [];
  const symptomText = recentSymptoms.length ? recentSymptoms.join(', ') : t("results.no_symptoms_yet");
  const whyReason = topSignal
    ? `Your current pattern may reflect ${topSignal.nutrient} support needs, especially with ${symptomText}.`
    : (state.symptomOnlyMode
        ? `You are in symptom-only mode, so GeneoRx is estimating support needs from ${symptomText}.`
        : `GeneoRx needs more medication or symptom detail before it can explain likely drivers with confidence.`);
  const doctorTopics = uniq([
    ...(topSignal ? [`Ask whether ${topSignal.nutrient} testing or monitoring would be appropriate.`] : []),
    ...interactions.map(x => `${x.title}: ${x.action}`),
    ...contraindications.map(x => `${x.title}: ${x.action}`)
  ]).slice(0,4);

  const sCore = document.createElement("div");
  sCore.className="section";
  sCore.innerHTML = `
    <div class="row">
      <div class="col">
        <div class="tagline"><strong>${escapeHtml(t("results.why_title"))}</strong><br>${escapeHtml(t("results.why_sub"))}</div>
        <div style="height:10px"></div>
        <div class="item">
          <div class="k">${escapeHtml(t("results.likely_explanation"))}</div>
          <div class="v">${escapeHtml(whyReason)}</div>
        </div>
        <div class="item">
          <div class="k">${escapeHtml(t("results.current_inputs"))}</div>
          <div class="v">${escapeHtml(t("results.symptoms_label"))} <strong>${escapeHtml(symptomText)}</strong>${topSignal ? `<br>${escapeHtml(t("results.top_signal"))} <strong>${escapeHtml(topSignal.nutrient)}</strong> (${topSignal.score}% • ${escapeHtml(tierLabel(topSignal.tier))})` : ''}</div>
        </div>
      </div>
      <div class="col">
        <div class="tagline"><strong>${escapeHtml(t("results.doctor_title"))}</strong><br>${escapeHtml(t("results.doctor_sub"))}</div>
        <div style="height:10px"></div>
        <div class="list">${doctorTopics.length ? doctorTopics.map((x,i) => `<div class="item"><div class="k">${escapeHtml(t("results.topic"))} ${i+1}</div><div class="v">${escapeHtml(x)}</div></div>`).join('') : `<div class="fineprint">${escapeHtml(t("results.doctor_empty"))}</div>`}</div>
      </div>
    </div>`;
  mainEl.appendChild(sCore);

  const sAction = document.createElement("div");
  sAction.className="section";
  sAction.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("results.action_title"))}</strong><br>${escapeHtml(t("results.action_sub"))}</div>
    <div style="height:10px"></div>
    <div class="list">
      <div class="item"><div class="k">${escapeHtml(t("results.action1_title"))}</div><div class="v">${topSignal ? `Focus on your <strong>${escapeHtml(topSignal.nutrient)}</strong> signal first instead of trying to change everything at once.` : `Log more symptoms or medications so GeneoRx can personalize your plan.`}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("results.action2_title"))}</div><div class="v">${escapeHtml(t("results.action2_body"))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("results.action3_title"))}</div><div class="v">${escapeHtml(t("results.action3_body"))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("results.action4_title"))}</div><div class="v">${escapeHtml(t("results.action4_body"))}</div></div>
    </div>`;
  mainEl.appendChild(sAction);

  const sInsightBtn = document.createElement("div");
  sInsightBtn.className = "section";
  sInsightBtn.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("results.insight_title"))}</strong><br>${escapeHtml(t("results.insight_sub"))}</div>
    <div class="btns"><button class="primary" id="openInsightBtn">${escapeHtml(t("results.insight_btn"))}</button></div>
  `;
  mainEl.appendChild(sInsightBtn);
  sInsightBtn.querySelector("#openInsightBtn").addEventListener("click", openInsightModal);

  const success = computeMedicationSuccessPrediction();
  const patterns = detectHealthPatterns();
  const population = computePopulationInsights();

  const sPatterns = document.createElement("div");
  sPatterns.className = "section";
  sPatterns.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("results.patterns_title"))}</strong><br>${escapeHtml(t("results.patterns_sub"))}</div>
    <div style="height:10px"></div>
    <div class="item">
      <div class="k">${escapeHtml(t("results.patterns_detected"))}</div>
      <div class="v">${patterns.length
        ? `<strong>${escapeHtml(patterns[0].title)}</strong><br>${escapeHtml(patterns[0].note)}`
        : escapeHtml(t("results.patterns_none"))}</div>
    </div>
  `;
  mainEl.appendChild(sPatterns);

  const improveText = success.score >= 75
    ? t("results.improve_high")
    : success.score >= 50
      ? t("results.improve_mid")
      : t("results.improve_low");
  const scoreCls = success.score >= 75 ? 'scoreHigh' : (success.score >= 50 ? 'scoreMod' : 'scoreLow');

  const sAdvanced = document.createElement("div");
  sAdvanced.className = "section";
  sAdvanced.innerHTML = `
    <div class="metricGrid">
      <div class="metricCard"><div class="k">${escapeHtml(t("results.success_prob"))}</div><div style="display:flex;align-items:center;gap:12px;margin-top:8px"><div class="scoreBadge ${scoreCls}">${success.score}%</div><div><strong>${escapeHtml(success.level)}</strong><br><span class="fineprint">${escapeHtml(success.reason)}</span></div></div></div>
      <div class="metricCard"><div class="k">${escapeHtml(t("results.population"))}</div><div class="v"><span class="fineprint">${escapeHtml(population.message)}</span><br>${population.trackedSymptoms.length ? `${escapeHtml(t("results.population_tracked"))} <strong>${escapeHtml(population.trackedSymptoms.join(', '))}</strong>` : `<span style="font-size:12px;opacity:.75">${escapeHtml(t("results.population_unlock"))}</span>`}</div></div>
      <div class="metricCard"><div class="k">${escapeHtml(t("results.improve_success"))}</div><div class="v"><span class="fineprint">${escapeHtml(improveText)}</span></div></div>
    </div>
  `;
  mainEl.appendChild(sAdvanced);

  const sSafety = document.createElement("div");
  sSafety.className = "section";
  sSafety.innerHTML = `
    <div class="row">
      <div class="col">
        <div class="tagline"><strong>${escapeHtml(t("results.interactions_title"))}</strong><br>${escapeHtml(t("results.interactions_sub"))}</div>
        <div style="height:10px"></div>
        ${interactions.length ? interactions.map(x=>`<div class="alertBox ${levelClass(x.level)}"><div class="k">${escapeHtml(x.level)} ${escapeHtml(t("results.priority"))}</div><div class="v"><strong>${escapeHtml(x.title)}</strong><br>${escapeHtml(x.note)}<br><span class="fineprint">${escapeHtml(x.action)}</span></div></div>`).join('<div style="height:10px"></div>') : `<div class="fineprint">${escapeHtml(t("results.interactions_none"))}</div>`}
      </div>
      <div class="col">
        <div class="tagline"><strong>${escapeHtml(t("results.contraindications_title"))}</strong><br>${escapeHtml(t("results.contraindications_sub"))}</div>
        <div style="height:10px"></div>
        ${contraindications.length ? contraindications.map(x=>`<div class="alertBox ${levelClass(x.level)}"><div class="k">${escapeHtml(x.level)} ${escapeHtml(t("results.priority"))}</div><div class="v"><strong>${escapeHtml(x.title)}</strong><br>${escapeHtml(x.note)}<br><span class="fineprint">${escapeHtml(x.action)}</span></div></div>`).join('<div style="height:10px"></div>') : `<div class="fineprint">${escapeHtml(t("results.contraindications_none"))}</div>`}
      </div>
    </div>
  `;
  mainEl.appendChild(sSafety);
  const planSupps = state.plan.recommendedSupplements?.length ? state.plan.recommendedSupplements : rec.map(x=>x.supplement);
  const routine = buildRoutineFromSupplements(planSupps);

  const sRoutine = document.createElement("div");
  sRoutine.className = "section";
  sRoutine.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("results.routine_title"))}</strong><br>${escapeHtml(t("results.routine_sub"))}</div>
    <div style="height:10px"></div>

    <div class="list">
      <div class="item"><div class="k">${escapeHtml(t("results.routine.morning"))}</div><div class="v">${routine.morning.length ? routine.morning.map(x=>`• ${escapeHtml(x)}`).join("<br>") : " "}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("results.routine.midday"))}</div><div class="v">${routine.midday.length ? routine.midday.map(x=>`• ${escapeHtml(x)}`).join("<br>") : " "}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("results.routine.night"))}</div><div class="v">${routine.night.length ? routine.night.map(x=>`• ${escapeHtml(x)}`).join("<br>") : " "}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("results.routine.notes"))}</div><div class="v">${routine.notes.length ? routine.notes.map(x=>`• ${escapeHtml(x)}`).join("<br>") : " "}</div></div>
    </div>
  `;
  mainEl.appendChild(sRoutine);

  const s2 = document.createElement("div");
  s2.className="section";

  function topInlineCites(nutrient){
    const claimsForNut = evByNut[nutrient] || [];
    const seen = new Set();
    const cites = [];
    for(const c of claimsForNut){
      for(const id of (c.citations||[])){
        const t = String(id||"").trim();
        if(!t || seen.has(t)) continue;
        if(!citationToLink(t)) continue;
        seen.add(t);
        cites.push(t);
      }
    }
    const top = cites.slice(0,2);
    if(!top.length) return `<div class="fineprint">${escapeHtml(t("results.citations_not_loaded"))}</div>`;
    return `<div class="fineprint">${escapeHtml(t("results.citations_label"))}</div><div class="inlineCites">${top.map(x=>renderCitationChip(x)).join("")}</div>`;
  }

  const tierClass = (tier) => tier==="High" ? "tierHigh" : (tier==="Moderate" ? "tierMod" : "tierLow");

  let nutrientHtml = "";
  if(!scores.length){
    nutrientHtml = `<div class="fineprint">${escapeHtml(t("results.nutrient_none"))}</div>`;
  } else {
    nutrientHtml = scores.slice(0,10).map(([n,score], idx)=>{
      const label = tierFromScore(score);
      const claimsForNut = evByNut[n] || [];
      const q = claimsForNut.length ? summarizeSourceQuality(claimsForNut) : "Pending";
      const evId = `ev_${idx}`;
      const sourceBadge =
        q==="Pending"
          ? `<div class="sourceBadge pending"><strong>${escapeHtml(t("results.source_quality"))}</strong> ${escapeHtml(tierLabel(q))}</div>`
          : `<div class="sourceBadge ${badgeClass(q)}"><strong>${escapeHtml(t("results.source_quality"))}</strong> ${escapeHtml(tierLabel(q))}</div>`;

      return `
        <div class="item">
          <div class="k">${escapeHtml(n)}</div>
          <div class="v"><strong>${escapeHtml(tierLabel(label))}</strong> ${escapeHtml(t("results.signal"))} (${score}%)</div>

          <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
            ${sourceBadge}
          </div>

          ${topInlineCites(n)}

          <div class="evrow">
            <div class="fineprint">${escapeHtml(t("results.transparent_evidence"))}</div>
            <div class="evbtn" data-evbtn="${evId}">${escapeHtml(t("results.evidence_toggle"))}</div>
          </div>
          <div class="evidence" id="${evId}" style="display:none">
            ${renderEvidencePanel(n, claimsForNut)}
          </div>
        </div>
      `;
    }).join("");
  }

  const supplementsHtml = rec.length
    ? `<div class="list">
        ${rec.map(r => `
          <div class="item">
            <div class="k">${escapeHtml(r.supplement)}</div>
            <div class="v">
              <span class="tierPill ${tierClass(r.tier)}">${escapeHtml(t("results.tier"))} <strong style="color:var(--txt)">${escapeHtml(tierLabel(r.tier))}</strong></span>
              <span style="color: var(--muted)"> • ${escapeHtml(t("results.driven_by"))} ${escapeHtml(r.nutrient)} (${r.score}%)</span>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="fineprint" style="margin-top:10px">${escapeHtml(t("results.supplements_disclaimer"))}</div>`
    : `<div class="fineprint">${escapeHtml(t("results.supplements_none"))}</div>`;

  s2.innerHTML = `
    <div class="row">
      <div class="col">
        <div class="tagline"><strong>${escapeHtml(t("results.nutrient_title"))}</strong><br>${escapeHtml(t("results.nutrient_sub"))}</div>
        <div style="height:10px"></div>
        <div class="list">${nutrientHtml}</div>
      </div>

      <div class="col">
        <div class="tagline"><strong>${escapeHtml(t("results.supplements_title"))}</strong><br>${escapeHtml(t("results.supplements_sub"))}</div>
        <div style="height:10px"></div>
        <div class="item">${supplementsHtml}</div>

        <div class="divider"></div>

        <div class="item">
          <div class="k">${escapeHtml(t("results.start_plan"))}</div>
          <div class="fineprint">${escapeHtml(t("results.start_plan_hint"))}</div>
          <div style="height:10px"></div>
          <input id="startDate" type="date" />
          <div class="btns">
            <button class="primary" id="startPlanBtn">${escapeHtml(state.plan.started ? t("results.update_plan_btn") : t("results.start_plan_btn"))}</button>
          </div>
        </div>
      </div>
    </div>
  `;
  mainEl.appendChild(s2);

  /* evidence toggles */
  s2.querySelectorAll("[data-evbtn]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-evbtn");
      const panel = document.getElementById(id);
      panel.style.display = (panel.style.display==="none") ? "block" : "none";
    });
  });

  const sd = s2.querySelector("#startDate");
  const today = new Date().toISOString().slice(0,10);
  sd.value = state.plan.startDate ? state.plan.startDate.slice(0,10) : today;

  s2.querySelector("#startPlanBtn").addEventListener("click", ()=>{
    const scoresNow = computeNutrientScores();
    const recNow = recommendSupplements(scoresNow);
    state.plan.started = true;
    state.plan.startDate = new Date((sd.value || today) + "T00:00:00").toISOString();
    state.plan.recommendedSupplements = recNow.map(x => x.supplement);
    state.plan.routine = buildRoutineFromSupplements(state.plan.recommendedSupplements);
    save();
    toastT("toast.plan_saved");
  });

  mainEl.appendChild(navButtons(true,true,"nav.continue"));
}

/* ===== TAB 5: CHECK-IN ===== */
function renderCheckin(){
  const planSupps = state.plan.recommendedSupplements || [];
  const symptomUniverse = getSymptomUniverse();
  const baseSymptoms = state.symptoms.selected.length ? state.symptoms.selected : symptomUniverse.slice(0,12);

  const last = latestCheckin();
  const defaultAdh = last ? last.adherencePct : 70;
  const defaultWell = last ? last.wellbeing : { energy: state.wellbeingBaseline.energy, mood: state.wellbeingBaseline.mood, sleep: state.wellbeingBaseline.sleep, focus: state.wellbeingBaseline.focus };

  if (last) {
    mainEl.appendChild(renderLastCheckinCard(last, { showProgressLink: true, showDownloadReport: true }));
    const divider = document.createElement("div");
    divider.style.height = "14px";
    mainEl.appendChild(divider);
  }

  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>${escapeHtml(last ? t("checkin.log_new") : t("checkin.weekly_title"))}</strong><br>
      ${escapeHtml(t("checkin.sub"))}
    </div>

    <div style="height:12px"></div>

    <div class="row">
      <div class="col">
        <label>${escapeHtml(t("checkin.date"))}</label>
        <input id="ciDate" type="date" />
      </div>
      <div class="col">
        <label>${escapeHtml(t("checkin.adherence"))}</label>
        <input id="ciAdh" type="number" min="0" max="100" value="${escapeHtml(String(defaultAdh))}" />
      </div>
    </div>
  `;
  mainEl.appendChild(s1);

  const today = new Date().toISOString().slice(0,10);
  s1.querySelector("#ciDate").value = today;

  /* supplements taken */
  const sSupp = document.createElement("div");
  sSupp.className="section";
  sSupp.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("checkin.supplements_title"))}</strong><br>${escapeHtml(t("checkin.supplements_sub"))}</div>
    <div class="chips" id="suppChips"></div>
    <div class="btns">
      <button class="ghost" id="suppAll">${escapeHtml(t("checkin.select_all"))}</button>
      <button class="ghost" id="suppNone">${escapeHtml(t("checkin.clear"))}</button>
    </div>
  `;
  mainEl.appendChild(sSupp);

  const suppChips = sSupp.querySelector("#suppChips");
  let taken = last?.supplementsTaken?.length ? [...last.supplementsTaken] : [];

  function drawSuppChips(){
    suppChips.innerHTML = "";
    if(!planSupps.length){
      suppChips.innerHTML = `<div class="fineprint">${escapeHtml(t("checkin.supplements_none"))}</div>`;
      return;
    }
    planSupps.forEach(name=>{
      const c = document.createElement("div");
      c.className="chip";
      const on = taken.includes(name);
      c.setAttribute("aria-pressed", on ? "true":"false");
      c.textContent = name;
      c.addEventListener("click", ()=>{
        const i = taken.indexOf(name);
        if(i>=0) taken.splice(i,1); else taken.push(name);
        drawSuppChips();
      });
      suppChips.appendChild(c);
    });
  }
  drawSuppChips();
  sSupp.querySelector("#suppAll").addEventListener("click", ()=>{ taken = [...planSupps]; drawSuppChips(); });
  sSupp.querySelector("#suppNone").addEventListener("click", ()=>{ taken = []; drawSuppChips(); });

  /* symptom improvement list */
  const sSym = document.createElement("div");
  sSym.className="section";
  sSym.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("checkin.symptom_improvement"))}</strong><br>${escapeHtml(t("checkin.symptom_improvement_sub"))}</div>
    <div class="list" id="symList"></div>
  `;
  mainEl.appendChild(sSym);

  const symList = sSym.querySelector("#symList");
  const impactValue = { "Worse":-2, "No change":0, "Slightly better":1, "Much better":2, "Not present":0 };
  const lastSymMap = {};
  if (last?.symptoms?.items?.length) {
    last.symptoms.items.forEach(it => { if (it?.symptom) lastSymMap[it.symptom] = it; });
  }

  function symRow(sym, idx, prev){
    const defaultChange = prev?.change && CHECKIN_IMPACT_OPTIONS.includes(prev.change) ? prev.change : "No change";
    const defaultSev = clamp(parseInt(prev?.severityNow ?? 5, 10), 0, 10);
    const row = document.createElement("div");
    row.className = "item sym-checkin-item";
    row.innerHTML = `
      <div class="sym-checkin-name">${escapeHtml(sym)}</div>
      ${renderImpactPicker(`symChange_${idx}`, defaultChange)}
      ${renderWellbeingScoreRow("severity", "checkin.severity_now", `symSev_${idx}`, defaultSev)}
    `;
    wireImpactPickers(row);
    wireWellbeingScorePickers(row);
    return row;
  }

  const symBase = baseSymptoms.slice(0,10);
  symBase.forEach((sym, idx)=> symList.appendChild(symRow(sym, idx, lastSymMap[sym])));

  /* wellbeing */
  const sWell = document.createElement("div");
  sWell.className="section";
  sWell.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("checkin.wellbeing_title"))}</strong><br>${escapeHtml(t("checkin.wellbeing_sub"))}</div>
    <div style="height:14px"></div>
    ${renderWellbeingScoreGrid(defaultWell, "ci")}
    <div style="height:14px"></div>
    <div class="row">
      <div class="col"><label>${escapeHtml(t("checkin.side_effects"))}</label><input id="ciSide" placeholder="${escapeHtml(t("checkin.side_effects_placeholder"))}" /></div>
      <div class="col"><label>${escapeHtml(t("checkin.notes"))}</label><input id="ciNotes" placeholder="${escapeHtml(t("checkin.notes_placeholder"))}" /></div>
    </div>
  `;
  wireWellbeingScorePickers(sWell);
  mainEl.appendChild(sWell);

  /* save */
  const sSave = document.createElement("div");
  sSave.className="section";
  sSave.innerHTML = `
    <div class="btns">
      <button class="primary" id="ciSave">${escapeHtml(t("checkin.save"))}</button>
      <button class="danger" id="ciDeleteLast">${escapeHtml(t("checkin.delete_last"))}</button>
    </div>
  `;
  mainEl.appendChild(sSave);

  sSave.querySelector("#ciSave").addEventListener("click", ()=>{
    const dateISO = new Date((s1.querySelector("#ciDate").value || today) + "T00:00:00").toISOString();
    const adherencePct = clamp(parseInt(s1.querySelector("#ciAdh").value || "0", 10), 0, 100);

    const items = [];
    symBase.forEach((sym, idx)=>{
      const change = document.getElementById(`symChange_${idx}`).value;
      const sevNow = clamp(parseInt(document.getElementById(`symSev_${idx}`).value || "0", 10), 0, 10);
      items.push({ symptom: sym, change, changeScore: impactValue[change] ?? 0, severityNow: sevNow });
    });

    const wellbeing = readWellbeingScores({
      energy: "ciEnergy", mood: "ciMood", sleep: "ciSleep", focus: "ciFocus",
    });

    const sideEffects = (document.getElementById("ciSide").value || "").split(",").map(s=>s.trim()).filter(Boolean);
    const notes = (document.getElementById("ciNotes").value || "").trim();
    const improvementScore = items.reduce((acc,x)=>acc + (x.changeScore||0), 0);

    state.checkins.push({ dateISO, adherencePct, supplementsTaken:[...taken], wellbeing, symptoms:{items, improvementScore}, sideEffects, notes });
    state.checkins = dedupeCheckins(state.checkins);
    save();
    toastT(IS_GUEST ? "toast.checkin_guest" : "toast.checkin_saved");
    setStep(6);
    if (IS_GUEST) pendingSaveAccountAfterFeedback = true;
    openFeedbackModal();
  });

  sSave.querySelector("#ciDeleteLast").addEventListener("click", ()=>{
    if(!state.checkins.length) return alertT("checkin.no_delete_alert");
    state.checkins.pop();
    save(); toastT("toast.deleted");
  });

  mainEl.appendChild(navButtons(true,true,"nav.continue"));
}

/* ===== TAB 6: PROGRESS (SNAPSHOT BUTTON LIVES HERE ✅) ===== */
function renderProgress(){
  const last = latestCheckin();
  const base = state.wellbeingBaseline;

  const s1 = document.createElement("div");
  s1.className="section";

  if(!last){
    s1.innerHTML = `
      <div class="tagline"><strong>${escapeHtml(t("progress.title"))}</strong><br>${escapeHtml(t("progress.no_checkins"))}</div>
      <div class="btns"><button class="primary" onclick="setStep(5)">${escapeHtml(t("progress.go_checkin"))}</button></div>
    `;
    mainEl.appendChild(s1);
    mainEl.appendChild(navButtons(true,true,"nav.continue"));
    return;
  }

  const dEnergy = last.wellbeing.energy - base.energy;
  const dMood = last.wellbeing.mood - base.mood;
  const dSleep = last.wellbeing.sleep - base.sleep;
  const dFocus = last.wellbeing.focus - base.focus;

  const items = last.symptoms?.items || [];
  const best = items.reduce((acc,x)=> (acc===null || (x.changeScore||0)>(acc.changeScore||0)) ? x : acc, null);
  const worst = items.reduce((acc,x)=> (acc===null || (x.changeScore||0)<(acc.changeScore||0)) ? x : acc, null);

  const scores = computeNutrientScores();
  const topDriver = scores.length ? `${scores[0][0]} (${scores[0][1]}%)` : " ";
  const symScore = last.symptoms?.improvementScore ?? 0;

  const coach = computeWeeklyCoachMessage();

  s1.innerHTML = `
    <div class="coachBox">
      <div class="coachTitle">
        <div class="spark">✦</div>
        <div>
          <div style="font-weight:950">${escapeHtml(t("progress.weekly_signal"))}</div>
          <div class="fineprint">${escapeHtml(t("progress.weekly_sub"))}</div>
        </div>
      </div>

      <div style="height:10px"></div>
      <div class="v"><strong>${escapeHtml(coach.headline)}</strong></div>
      <div class="fineprint" style="margin-top:8px">
        ${coach.bullets.map(x=>`• ${escapeHtml(x)}`).join("<br>")}
      </div>

      <div class="divider"></div>

      <div class="btns">
        <button class="ghost" id="btnAnother">${escapeHtml(t("progress.add_another"))}</button>
      </div>
    </div>

    <div style="height:14px"></div>

    <div class="list">
      <div class="item">
        <div class="k">${escapeHtml(t("progress.what_changed"))}</div>
        <div class="v">
          ${escapeHtml(t("progress.most_improved"))} <strong>${escapeHtml(best?.symptom || " ")}</strong> (${escapeHtml(impactLabel(best?.change || ""))})<br>
          ${escapeHtml(t("progress.least_improved"))} <strong>${escapeHtml(worst?.symptom || " ")}</strong> (${escapeHtml(impactLabel(worst?.change || ""))})<br>
          ${escapeHtml(t("progress.top_driver"))} <strong>${escapeHtml(topDriver)}</strong>
        </div>
      </div>

      <div class="item">
        <div class="k">${escapeHtml(t("progress.wellbeing_change"))}</div>
        <div class="v">
          ${escapeHtml(compactMetricLabel("wellbeing.energy"))}: <strong>${dEnergy>=0?"+":""}${dEnergy}</strong> •
          ${escapeHtml(compactMetricLabel("wellbeing.mood"))}: <strong>${dMood>=0?"+":""}${dMood}</strong> •
          ${escapeHtml(compactMetricLabel("wellbeing.sleep"))}: <strong>${dSleep>=0?"+":""}${dSleep}</strong> •
          ${escapeHtml(compactMetricLabel("wellbeing.focus"))}: <strong>${dFocus>=0?"+":""}${dFocus}</strong>
        </div>
      </div>

      <div class="item">
        <div class="k">${escapeHtml(t("progress.symptom_score"))}</div>
        <div class="v"><strong>${symScore}</strong> ${escapeHtml(t("progress.symptom_score_sub"))}</div>
      </div>

      <div class="item">
        <div class="k">${escapeHtml(t("progress.adherence"))}</div>
        <div class="v"><strong>${last.adherencePct}%</strong> ${escapeHtml(t("progress.adherence_sub"))}</div>
      </div>
    </div>
  `;
  mainEl.appendChild(s1);

  document.getElementById("btnAnother").addEventListener("click", ()=> setStep(5));

  const timeline = document.createElement("div");
  timeline.className = "section";
  const checkinTimeline = state.checkins.map((c,idx)=>`<div class="item"><div class="k">${escapeHtml(t("checkin.label_n"))} ${idx+1} • ${escapeHtml(fmtDate(c.dateISO))}</div><div class="v">${escapeHtml(t("common.adherence"))} <strong>${c.adherencePct}%</strong>${c.symptoms?.items?.length ? `<br>${escapeHtml(t("progress.symptoms_tracked"))} ${escapeHtml(c.symptoms.items.map(x=>x.symptom).join(', '))}` : ''}</div></div>`).join('');
  timeline.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("progress.timeline_title"))}</strong><br>${escapeHtml(t("progress.timeline_sub"))}</div>
    <div style="height:10px"></div>
    <div class="list">${checkinTimeline || `<div class="fineprint">${escapeHtml(t("progress.timeline_none"))}</div>`}</div>
  `;
  mainEl.appendChild(timeline);

  mainEl.appendChild(navButtons(true,true,"nav.continue"));
}

/* ===== TAB 7: CITATIONS ===== */
function buildCitationsRegistry(){
  const claims = claimsForSelectedMeds();
  const seen = new Set();
  const all = [];
  for(const cl of claims){
    for(const id of (cl.citations||[])){
      const tok = String(id||"").trim();
      if(!tok || seen.has(tok)) continue;
      seen.add(tok);
      all.push(tok);
    }
  }
  const pmid=[], pmcid=[], other=[];
  all.forEach(tok=>{
    if(/^PMID:\d+$/i.test(tok)) pmid.push(tok.toUpperCase());
    else if(/^PMCID:PMC\d+$/i.test(tok)) pmcid.push(tok.toUpperCase());
    else other.push(tok);
  });
  pmid.sort(); pmcid.sort(); other.sort();
  return { all, pmid, pmcid, other };
}
function renderCitations(){
  const reg = buildCitationsRegistry();
  const cov = evidenceCoverage();

  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>${escapeHtml(t("citations.title"))}</strong><br>
      ${escapeHtml(t("citations.sub"))}
      <div class="fineprint" style="margin-top:8px">${escapeHtml(t("citations.coverage"))} <strong>${cov.evidenceCount}/${cov.selectedCount}</strong></div>
    </div>

    <div class="divider"></div>

    <div class="k">${escapeHtml(t("citations.pmid"))} (${reg.pmid.length})</div>
    <div class="inlineCites">${reg.pmid.map(renderCitationChip).join("") || `<div class="fineprint">${escapeHtml(t("citations.none"))}</div>`}</div>

    <div class="divider"></div>

    <div class="k">${escapeHtml(t("citations.pmcid"))} (${reg.pmcid.length})</div>
    <div class="inlineCites">${reg.pmcid.map(renderCitationChip).join("") || `<div class="fineprint">${escapeHtml(t("citations.none"))}</div>`}</div>

    <div class="divider"></div>

    <div class="k">${escapeHtml(t("citations.links"))} (${reg.other.length})</div>
    <div class="inlineCites">${reg.other.map(renderCitationChip).join("") || `<div class="fineprint">${escapeHtml(t("citations.none"))}</div>`}</div>
  `;
  mainEl.appendChild(s1);
  mainEl.appendChild(navButtons(true,true,"nav.continue"));
}


/* ===== TAB 8: SUMMARY ===== */
function renderSummaryTab(){
  const meds = state.meds.map(m=>{
    const med = MED_DB.find(x=>x.id===m.medId);
    return med ? med.name : m.medId;
  });
  const last = latestCheckin();
  const flags = safetyFlags();
  const insight = computeInsightEngine();
  const success = computeMedicationSuccessPrediction();
  const patterns = detectHealthPatterns();
  const interactions = computeDrugInteractions();
  const contraindications = computeContraindications();
  const story = generateDynamicHealthStory();
  const noneLabel = t("summary.none");

  const sStory = document.createElement("div");
  sStory.className = "section";
  sStory.innerHTML = `
    <div class="tagline">
      <strong>${escapeHtml(t("summary.health_story_title"))}</strong><br>
      ${escapeHtml(t("summary.health_story_sub"))}
      <div class="fineprint" style="margin-top:8px">${escapeHtml(t("summary.health_story_lead"))}</div>
    </div>
    <div style="height:12px"></div>
    <div class="v" style="line-height:1.6">${escapeHtml(story)}</div>
    <div class="btns">
      <button type="button" class="primary" id="summarySnapshotBtn">${escapeHtml(t("progress.snapshot_btn"))}</button>
      <button type="button" class="primary" id="summaryInsightBtn">${escapeHtml(t("results.insight_btn"))}</button>
    </div>
  `;
  mainEl.appendChild(sStory);
  sStory.querySelector("#summarySnapshotBtn").addEventListener("click", openSnapshotModal);
  sStory.querySelector("#summaryInsightBtn").addEventListener("click", openInsightModal);

  const s1 = document.createElement("div");
  s1.className = "section";
  s1.innerHTML = `
    <div class="tagline"><strong>${escapeHtml(t("summary.dashboard_title"))}</strong><br>${escapeHtml(t("summary.dashboard_sub"))}</div>
    <div style="height:10px"></div>
    <div class="list">
      <div class="item"><div class="k">${escapeHtml(t("summary.account_label"))}</div><div class="v">${escapeHtml(state.account.email || t("common.guest"))} • Consent: ${state.account.consent ? t("sidebar.consent_yes") : t("sidebar.consent_no")}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("summary.medications"))}</div><div class="v">${meds.length ? escapeHtml(meds.join(", ")) : escapeHtml(t("summary.no_meds_added"))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("summary.symptoms_field"))}</div><div class="v">${state.symptoms.selected.length ? escapeHtml(state.symptoms.selected.join(", ")) : escapeHtml(t("summary.no_symptoms_selected"))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("sidebar.safety_flags"))}</div><div class="v">${flags.length ? escapeHtml(flags.join(", ")) : escapeHtml(noneLabel)}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("summary.success_prediction_full"))}</div><div class="v"><strong>${success.score}%</strong> • ${escapeHtml(success.level)}<br>${escapeHtml(success.reason)}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("summary.detected_pattern"))}</div><div class="v">${patterns.length ? `<strong>${escapeHtml(patterns[0].title)}</strong><br>${escapeHtml(patterns[0].note)}` : escapeHtml(t("summary.no_pattern_detected"))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("summary.drug_interactions"))}</div><div class="v">${interactions.length ? escapeHtml(interactions.map(x=>x.title).join(", ")) : escapeHtml(t("summary.no_interactions"))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("summary.contraindications"))}</div><div class="v">${contraindications.length ? escapeHtml(contraindications.map(x=>x.title).join(", ")) : escapeHtml(t("summary.no_contraindications"))}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("summary.insight_summary"))}</div><div class="v"><strong>${escapeHtml(insight.summary)}</strong><br>${escapeHtml(insight.meaning)}</div></div>
      <div class="item"><div class="k">${escapeHtml(t("summary.latest_checkin"))}</div><div class="v">${last ? `${fmtDate(last.dateISO)} • ${t("sidebar.adherence")} ${last.adherencePct}%` : escapeHtml(t("sidebar.no_checkins"))}</div></div>
    </div>
  `;

  if (IS_GUEST && localHasMeaningfulData(state)) {
    const cta = document.createElement("div");
    cta.className = "save-account-cta";
    cta.style.marginTop = "14px";
    cta.innerHTML = `
      <div class="save-account-cta-title">${escapeHtml(t("save_account.summary_title"))}</div>
      <div class="fineprint">${escapeHtml(t("save_account.summary_sub"))}</div>
      <div class="btns" style="margin-top:12px">
        <button class="primary" type="button" id="summarySaveAccountBtn">${escapeHtml(t("save_account.summary_btn"))}</button>
      </div>
    `;
    cta.querySelector("#summarySaveAccountBtn").addEventListener("click", ()=> openSaveAccountModal(1));
    s1.appendChild(cta);
  }

  mainEl.appendChild(s1);
  mainEl.appendChild(navButtons(true,true,"nav.continue"));
}

/* ===== FEEDBACK (modal) ===== */
function mountFeedbackForm(parent){
  const s1 = document.createElement("div");
  s1.className = "section";
  s1.innerHTML = `
    <div class="row">
      <div class="col">
        <label>${escapeHtml(t("feedback.type"))}</label>
        <select id="fbType">
          <option value="Bug">${escapeHtml(t("feedback.type.bug"))}</option>
          <option value="Suggestion">${escapeHtml(t("feedback.type.suggestion"))}</option>
          <option value="Question">${escapeHtml(t("feedback.type.question"))}</option>
          <option value="Other">${escapeHtml(t("feedback.type.other"))}</option>
        </select>
      </div>
      <div class="col">
        <label>${escapeHtml(t("feedback.contact"))}</label>
        <select id="fbContact">
          <option value="yes">${escapeHtml(t("common.yes"))}</option>
          <option value="no">${escapeHtml(t("common.no"))}</option>
        </select>
      </div>
    </div>

    <div style="height:12px"></div>
    <label>${escapeHtml(t("feedback.message"))}</label>
    <textarea id="fbMsg" placeholder="${escapeHtml(t("feedback.message_placeholder"))}"></textarea>

    <div class="btns">
      <button class="primary" id="fbSend">${escapeHtml(t("feedback.send"))}</button>
    </div>
  `;
  parent.appendChild(s1);

  s1.querySelector("#fbSend").addEventListener("click", ()=>{
    const type = s1.querySelector("#fbType").value;
    const canContact = s1.querySelector("#fbContact").value === "yes";
    const message = (s1.querySelector("#fbMsg").value || "").trim();
    if (!message) {
      closeFeedbackModal();
      return;
    }
    const email = state.account.email || AUTH_EMAIL || "anonymous";
    state.feedback.push({ dateISO: new Date().toISOString(), type, message, canContact, email });
    save();
    closeFeedbackModal();
    toastT("toast.saved");

    const subj = encodeURIComponent(`GeneoRx Portal Feedback (${type})`);
    const body = encodeURIComponent(
      `Type: ${type}\nFrom: ${email}\nCan we contact you?: ${canContact ? "Yes" : "No"}\n\nMessage:\n${message}\n`
    );
    window.location.href = `mailto:info@geneorx.com?subject=${subj}&body=${body}`;
  });
}

const profileBackdrop = document.getElementById("profileBackdrop");
const profileModal = document.getElementById("profileModal");
const profileModalBody = document.getElementById("profileModalBody");
const feedbackBackdrop = document.getElementById("feedbackBackdrop");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackModalBody = document.getElementById("feedbackModalBody");
const saveAccountBackdrop = document.getElementById("saveAccountBackdrop");
const saveAccountModal = document.getElementById("saveAccountModal");
const saveAccountStepAsk = document.getElementById("saveAccountStepAsk");
const saveAccountStepForm = document.getElementById("saveAccountStepForm");
const saveAccountTitle = document.getElementById("saveAccountTitle");
const saveAccountSub = document.getElementById("saveAccountSub");
const SAVE_ACCOUNT_PROMPT_KEY = "geneorx_save_account_prompted";
let pendingSaveAccountAfterFeedback = false;

function shouldOfferSaveAccount(){
  if (!IS_GUEST) return false;
  if (!localHasMeaningfulData(state)) return false;
  try {
    if (sessionStorage.getItem(SAVE_ACCOUNT_PROMPT_KEY) === "1") return false;
  } catch (e) {}
  return true;
}
function markSaveAccountPrompted(){
  try { sessionStorage.setItem(SAVE_ACCOUNT_PROMPT_KEY, "1"); } catch (e) {}
}
function prefillSaveAccountForm(){
  const emailEl = document.getElementById("saveAccountEmail");
  const phoneEl = document.getElementById("saveAccountPhone");
  if (emailEl) {
    const email = (state.account.email || "").trim();
    if (email && !email.includes("guest@")) emailEl.value = email;
  }
  if (phoneEl && state.profile.phone) phoneEl.value = state.profile.phone;
}
function showSaveAccountStep(step){
  if (saveAccountStepAsk) saveAccountStepAsk.style.display = step === 1 ? "block" : "none";
  if (saveAccountStepForm) saveAccountStepForm.style.display = step === 2 ? "block" : "none";
  if (saveAccountTitle) {
    saveAccountTitle.textContent = step === 2 ? t("save_account.form_title") : t("save_account.title");
  }
  if (saveAccountSub) {
    saveAccountSub.textContent = step === 2 ? t("save_account.device_note") : t("save_account.sub");
    saveAccountSub.style.display = step === 2 ? "none" : "block";
  }
}
function openSaveAccountModal(step){
  if (!saveAccountModal || !IS_GUEST) return;
  showSaveAccountStep(step || 1);
  if ((step || 1) === 2) prefillSaveAccountForm();
  if (saveAccountBackdrop) saveAccountBackdrop.style.display = "block";
  saveAccountModal.style.display = "block";
}
function closeSaveAccountModal(){
  if (saveAccountBackdrop) saveAccountBackdrop.style.display = "none";
  if (saveAccountModal) saveAccountModal.style.display = "none";
  showSaveAccountStep(1);
}
function maybePromptSaveAccount(){
  if (!shouldOfferSaveAccount()) return;
  markSaveAccountPrompted();
  openSaveAccountModal(1);
}

function openProfileModal(){
  if (!profileModalBody) return;
  profileModalBody.innerHTML = "";
  profileModalCommit = mountAccountForm(profileModalBody, { showWelcome: false, readOnlyEmail: !IS_GUEST, inModal: true });
  profileModalOpen = true;
  if (profileBackdrop) profileBackdrop.style.display = "block";
  if (profileModal) profileModal.style.display = "block";
}
function closeProfileModal(){
  profileModalOpen = false;
  profileModalCommit = null;
  if (profileBackdrop) profileBackdrop.style.display = "none";
  if (profileModal) profileModal.style.display = "none";
}
function openFeedbackModal(){
  if (!feedbackModalBody) return;
  feedbackModalBody.innerHTML = "";
  mountFeedbackForm(feedbackModalBody);
  if (feedbackBackdrop) feedbackBackdrop.style.display = "block";
  if (feedbackModal) feedbackModal.style.display = "block";
}
function closeFeedbackModal(){
  if (feedbackBackdrop) feedbackBackdrop.style.display = "none";
  if (feedbackModal) feedbackModal.style.display = "none";
  if (pendingSaveAccountAfterFeedback) {
    pendingSaveAccountAfterFeedback = false;
    window.setTimeout(maybePromptSaveAccount, 350);
  }
}

document.getElementById("profileModalClose")?.addEventListener("click", closeProfileModal);
profileBackdrop?.addEventListener("click", closeProfileModal);
document.getElementById("profileModalSave")?.addEventListener("click", ()=>{
  if (profileModalCommit) profileModalCommit();
  if (AUTH_EMAIL) state.account.email = AUTH_EMAIL;
  closeProfileModal();
  save();
  toastT("profile.saved");
});
document.getElementById("feedbackModalSkip")?.addEventListener("click", closeFeedbackModal);
feedbackBackdrop?.addEventListener("click", closeFeedbackModal);

document.getElementById("saveAccountClose")?.addEventListener("click", closeSaveAccountModal);
document.getElementById("saveAccountNotNow")?.addEventListener("click", closeSaveAccountModal);
saveAccountBackdrop?.addEventListener("click", closeSaveAccountModal);
document.getElementById("saveAccountYes")?.addEventListener("click", ()=>{
  showSaveAccountStep(2);
  prefillSaveAccountForm();
});
document.getElementById("saveAccountBack")?.addEventListener("click", ()=> showSaveAccountStep(1));
document.getElementById("saveAccountForm")?.addEventListener("submit", (e)=>{
  const pw = document.getElementById("saveAccountPassword")?.value || "";
  const pw2 = document.getElementById("saveAccountPasswordConfirm")?.value || "";
  if (pw !== pw2) {
    e.preventDefault();
    showToast(t("save_account.password_mismatch"));
    return;
  }
  save({ skipRender: true });
});
document.getElementById("guestBarSaveAccount")?.addEventListener("click", ()=> openSaveAccountModal(1));

const portalProfileTrigger = document.getElementById("portalProfileTrigger");
const portalProfilePanel = document.getElementById("portalProfilePanel");
if (portalProfileTrigger && portalProfilePanel) {
  portalProfileTrigger.addEventListener("click", (e)=>{
    e.stopPropagation();
    const open = portalProfilePanel.hidden;
    portalProfilePanel.hidden = !open;
    portalProfileTrigger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", ()=>{
    portalProfilePanel.hidden = true;
    portalProfileTrigger.setAttribute("aria-expanded", "false");
  });
  portalProfilePanel.addEventListener("click", (e)=> e.stopPropagation());
}
document.getElementById("btnHealthProfile")?.addEventListener("click", ()=>{
  if (portalProfilePanel) portalProfilePanel.hidden = true;
  openProfileModal();
});

function prepareLoggedInSession(){
  if (IS_GUEST) return;
  if (AUTH_EMAIL) state.account.email = AUTH_EMAIL;
  if (state.step === 0 || HIDDEN_STEPS.has(state.step)) {
    state.step = normalizeStep(state.step === 0 ? 1 : state.step);
  }
}

function maybePromptProfile(){
  if (IS_GUEST || !profileNeedsCompletion()) return;
  try {
    if (sessionStorage.getItem("geneorx_profile_prompted") === "1") return;
    sessionStorage.setItem("geneorx_profile_prompted", "1");
  } catch (e) {}
  openProfileModal();
}

/* =========================================================
   ===== MAIN RENDER SWITCH =====
   ========================================================= */
function renderMain(){
  state.step = normalizeStep(state.step);
  mainEl.innerHTML = "";
  mainTitle.textContent = stepLabel(state.step);
  mainSub.textContent = t(`step.${state.step}.sub`);

  if(state.step===0) return renderAccount();
  if(state.step===1) return renderMeds();
  if(state.step===2) return renderSymptoms();
  if(state.step===3) return renderWellbeing();
  if(state.step===4) return renderResults();
  if(state.step===5) return renderCheckin();
  if(state.step===6) return renderProgress();
  if(state.step===8) return renderSummaryTab();
}

function renderAll(){
  if (profileModalOpen) return;
  updateSummaryPanelMode();
  updateMyCheckinsAvailability();
  renderSteps();
  renderPills();
  renderSummaryTop();
  renderSide();
  renderContactBox();
  renderMain();
  const checkinModal = document.getElementById("checkinViewModal");
  if (checkinModal && checkinModal.style.display === "block") {
    renderCheckinViewModalContent();
  }
}
function bootPortal(){
  prepareLoggedInSession();
  renderAll();
  maybePromptProfile();
  if (IS_GUEST && state.step === 8 && shouldOfferSaveAccount()) {
    window.setTimeout(maybePromptSaveAccount, 500);
  }
}
if (IS_GUEST) {
  bootPortal();
} else {
  loadFromBackend().then(() => bootPortal()).catch(() => bootPortal());
}
</script>
