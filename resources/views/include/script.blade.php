
   <script>
/* =========================================================
   ===== AUTH USER =====
   ========================================================= */
const AUTHENTICATED_USER = "{{ Auth::check() ? Auth::user()->name : 'Guest' }}";
const IS_GUEST = @json(session('is_web_guest') ?? false);
const LOGIN_URL = "{{ route('login') }}";

/* =========================================================
   ===== DATA =====
   ========================================================= */
@php
  // DB-managed catalog injected by HomeController::treatment().
  // Run: php artisan db:seed --class=MedicationSeeder  to populate.
  $medDbJson = (isset($medDb) && count($medDb))
      ? json_encode($medDb, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG)
      : null;
@endphp
@if($medDbJson)
const MED_DB = {!! $medDbJson !!};
@else
{{-- Static fallback used when the medications table is empty --}}
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
  "CoQ10":      ["CoQ10 (ubiquinol)"],
  "Vitamin D":  ["Vitamin D3 (consider K2)"],
  "Vitamin B12":["Methyl B12"],
  "Magnesium":  ["Magnesium glycinate"],
  "Potassium":  ["Electrolytes / potassium foods"],
  "Calcium":    ["Calcium + bone support"],
  "B vitamins": ["B-complex (methylated)"],
  "Iron":       ["Iron bisglycinate (gentler form)"],
  "Zinc":       ["Zinc picolinate or bisglycinate"],
  "Omega-3":    ["Omega-3 fish oil (EPA + DHA)"],
  "Selenium":   ["Selenium (selenomethionine)"],
  "Melatonin":  ["Melatonin (low-dose, 0.5–1 mg)"],
  "Vitamin K":  ["Vitamin K2 (MK-7)  discuss with clinician if on warfarin"],
};

const LAB_SUGGESTIONS = {
  "Vitamin B12": ["Vitamin B12", "MMA (methylmalonic acid)", "Homocysteine (optional)"],
  "Vitamin D":   ["25(OH) Vitamin D"],
  "Magnesium":   ["Magnesium (serum)", "RBC magnesium (if available)"],
  "Potassium":   ["BMP/CMP (electrolytes)"],
  "Calcium":     ["Calcium", "Albumin", "PTH (if abnormal)"],
  "CoQ10":       ["No standard routine lab; consider symptom tracking + clinician guidance"],
  "B vitamins":  ["CBC", "Homocysteine (optional)", "B12 + Folate"],
  "Iron":        ["Ferritin", "Serum iron", "TIBC", "CBC (for anemia)"],
  "Zinc":        ["Serum zinc (fasting preferred)", "Alkaline phosphatase (indirect marker)"],
  "Omega-3":     ["Omega-3 index (specialty test)", "Lipid panel (triglycerides as proxy)"],
  "Selenium":    ["Serum selenium", "Thyroid panel (TSH, Free T3, Free T4)"],
  "Melatonin":   ["No standard lab; sleep diary + clinician discussion recommended"],
  "Vitamin K":   ["INR/PT (if on warfarin)", "Serum Vitamin K2 (specialty test)"],
};

/* =========================================================
   ===== SYMPTOM → NUTRIENT MAP =====
   Each symptom maps to [nutrient, baseScore] pairs, ordered by relevance.
   Scores are additive across multiple symptoms for the same nutrient.
   ========================================================= */
const SYMPTOM_NUTRIENT_MAP = {
  "Fatigue":             [["Vitamin B12", 11], ["CoQ10", 10], ["Vitamin D", 9], ["Iron", 8]],
  "Low energy":          [["CoQ10", 12], ["Vitamin B12", 10], ["Vitamin D", 9], ["Iron", 8]],
  "Brain fog":           [["Vitamin B12", 12], ["Omega-3", 9], ["Vitamin D", 8], ["Magnesium", 7]],
  "Poor focus":          [["Vitamin B12", 10], ["Magnesium", 9], ["Omega-3", 8], ["Iron", 7]],
  "Mood changes":        [["Vitamin D", 12], ["Vitamin B12", 10], ["Omega-3", 9], ["Magnesium", 8]],
  "Sleep changes":       [["Magnesium", 13], ["Melatonin", 11], ["Vitamin D", 7], ["B vitamins", 6]],
  "Anxiety":             [["Magnesium", 14], ["B vitamins", 10], ["Vitamin D", 8], ["Omega-3", 7]],
  "GI discomfort":       [["Magnesium", 8],  ["Vitamin B12", 7], ["B vitamins", 6]],
  "Constipation":        [["Magnesium", 15], ["Vitamin D", 8],  ["B vitamins", 5]],
  "Nausea":              [["B vitamins", 10], ["Magnesium", 8],  ["Vitamin B12", 6]],
  "Dizziness":           [["Vitamin B12", 13], ["Iron", 11],    ["Vitamin D", 6]],
  "Headache":            [["Magnesium", 14], ["CoQ10", 10],     ["Vitamin D", 7]],
  "Muscle cramps":       [["Magnesium", 16], ["Potassium", 14], ["Calcium", 7]],
  "Muscle aches":        [["CoQ10", 14],    ["Magnesium", 12], ["Vitamin D", 9]],
  "Heart palpitations":  [["Magnesium", 16], ["CoQ10", 13],    ["Potassium", 11]],
  "Tingling hands/feet": [["Vitamin B12", 18], ["Vitamin D", 9], ["Iron", 6]],
  "Swelling":            [["Potassium", 11], ["Magnesium", 8],  ["B vitamins", 6]],
  "Hair loss":           [["Iron", 13], ["Zinc", 12], ["Selenium", 10], ["Vitamin D", 8]],
};

/* =========================================================
   ===== STATE =====
   ========================================================= */
const STORAGE_KEY = "geneomx_consumer_portal_v1_split";
const defaultState = () => ({
  step: 0,
  account: { email:"", consent:false },
  profile: { age:"", gender:"", pregnant:false, kidneyDisease:false, anticoagulants:false },
  meds: [], // {medId, dose, durationMonths}
  symptoms: { selected:[], custom:[], severity:"mild" },
  symptomOnlyMode: false,
  wellbeingBaseline: { energy:5, mood:5, sleep:5, focus:5 },
  plan: { started:false, startDate:null, recommendedSupplements:[], routine:{} },
  checkins: [],
  feedback: [],
  reminderPreferences: { enabled:false, day:"Sunday", time:"09:00", timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" }
});
let state = load();
let backendSaveTimer = null;
let saveStatusTimer = null;

function save(options = {}){
  const { render = true } = options;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleBackendSave();
  if(render) renderAll();
}

function scheduleBackendSave(){
  clearTimeout(backendSaveTimer);
  setSaveStatus("saving", "Saving...");
  backendSaveTimer = setTimeout(saveToBackend, 450);
}

function load(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : defaultState(); }
  catch(e){ return defaultState(); }
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
    if(data.medications?.length) {
      state.meds = data.medications;
    }
    if(data.symptoms?.length) {
      state.symptoms.selected = data.symptoms.map(s => s.name);
    }
    if(data.checkins?.length) {
      const sorted = data.checkins.slice().sort((a,b)=> new Date(a.dateISO||0)-new Date(b.dateISO||0));
      state.checkins = sorted;
    }
    if(data.portal_state && typeof data.portal_state==='object') {
      const ps = data.portal_state;
      if(ps.plan) {
        state.plan = { ...defaultState().plan, ...ps.plan, routine: { ...defaultState().plan.routine, ...((ps.plan && ps.plan.routine) || {}) } };
      }
      if(ps.wellbeingBaseline) state.wellbeingBaseline = { ...defaultState().wellbeingBaseline, ...ps.wellbeingBaseline };
      if(typeof ps.symptomOnlyMode==='boolean') state.symptomOnlyMode = ps.symptomOnlyMode;
      if(Array.isArray(ps.customMedCatalog)) {
        for(const m of ps.customMedCatalog) {
          if(m && m.id && !MED_DB.find(x=>x.id===m.id)) {
            MED_DB.push(m);
          }
        }
      }
      if(Array.isArray(ps.feedback)) {
        state.feedback = ps.feedback;
      }
      if(ps.reminderPreferences && typeof ps.reminderPreferences==='object') {
        state.reminderPreferences = { ...defaultState().reminderPreferences, ...ps.reminderPreferences };
      }
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
      state.reminderPreferences = { ...defaultState().reminderPreferences, ...(localSnapshot.reminderPreferences || {}) };
      if(typeof localSnapshot.account?.consent === 'boolean') {
        state.account.consent = localSnapshot.account.consent;
      }
      if(data.user?.email) {
        state.account.email = data.user.email;
      } else if(localSnapshot.account?.email && !String(localSnapshot.account.email).includes('guest@')) {
        state.account.email = localSnapshot.account.email;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      await saveToBackend();
      showToast('Your progress has been saved to your account ✓');
    }
  } catch(e) {
    console.log('Backend profile load (optional):', e.message);
  }
}

async function saveToBackend() {
  if (IS_GUEST) {
    setSaveStatus("saved", "Saved on device");
    return;
  }

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
          reminderPreferences: state.reminderPreferences,
        },
        };
      })())
    });
    if(!response.ok) {
      let message = "GeneoRx could not save your latest change.";
      try {
        const data = await response.json();
        message = data.message || message;
      } catch(e) {}
      setSaveStatus("error", "Save issue");
      showToast(message);
      return;
    }
    setSaveStatus("saved", "Saved");
  } catch(e) {
    console.log('Backend save error (optional):', e.message);
    setSaveStatus("error", "Offline");
  }
}

function resetDemo(){
  if(!confirm("Reset your dashboard entries on this device? This will clear your current local GeneoRx flow.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  renderAll();
  showToast("Reset ✓");
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

function setSaveStatus(type="saved", text="Saved"){
  const el = document.getElementById("saveStatus");
  if(!el) return;
  el.classList.remove("saving", "saved", "error");
  el.classList.add(type);
  el.textContent = text;
  if(type === "saved"){
    clearTimeout(saveStatusTimer);
    saveStatusTimer = setTimeout(()=>{ el.textContent = "Saved"; }, 1200);
  }
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

  // ── 1. Medication-driven scores (evidence-linked) ───────────────────────
  for(const mi of state.meds){
    const med = MED_DB.find(x => x.id===mi.medId);
    if(!med) continue;
    const f = doseFactor(mi.dose) * durationFactor(mi.durationMonths) * sevF;
    for(const cl of (med.claims||[])){
      const w = qualityWeight(cl.source_quality) * 10 * f;
      scores[cl.nutrient] = (scores[cl.nutrient]||0) + w;
    }
  }

  // ── 2. Symptom-driven scores (always active, additive with med scores) ──
  // Each selected symptom contributes nutrient-specific signals so that
  // the Results step always shows a meaningful "Top signal" when any
  // symptom is ticked  even before medications are added.
  const allSymptoms = [...state.symptoms.selected, ...(state.symptoms.custom||[])];
  for(const sym of allSymptoms){
    const mappings = SYMPTOM_NUTRIENT_MAP[sym] || [["Magnesium", 7], ["B vitamins", 6]];
    for(const [nutrient, baseWeight] of mappings){
      scores[nutrient] = (scores[nutrient]||0) + baseWeight * sevF;
    }
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
    ? `<div class="note"><strong>Optional labs to confirm:</strong> ${escapeHtml(labs.join(", "))}</div>`
    : `<div class="note"><strong>Optional labs to confirm:</strong> Ask your clinician based on context.</div>`;

  if(!claims || !claims.length){
    return `<div class="fineprint">Evidence not loaded yet for this nutrient from your selected meds.</div>${labHtml}`;
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
    <div class="fineprint">Sources (click to open):</div>
    <div class="citeList">${citeHtml || `<div class="fineprint">No sources attached yet.</div>`}</div>
    ${noteText ? `<div class="note"><strong>Notes:</strong> ${escapeHtml(noteText)}</div>` : ``}
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
  if(p.pregnant) flags.push("Pregnant/breastfeeding");
  if(p.kidneyDisease) flags.push("Kidney disease");
  if(p.anticoagulants) flags.push("Anticoagulants/blood thinners");
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
      title:'Metformin + Omeprazole',
      level:'Moderate',
      note:'This combination may increase the chance that B12-related symptoms or magnesium-related symptoms are overlooked over time.',
      action:'Discuss B12 / magnesium monitoring and symptom tracking with your clinician.'
    });
  }
  if(ids.includes('lisinopril') && ids.includes('losartan')){
    interactions.push({
      title:'Lisinopril + Losartan',
      level:'High',
      note:'Using an ACE inhibitor and ARB together can increase monitoring needs for kidney function and potassium.',
      action:'Review this combination with your clinician unless it was specifically prescribed and monitored.'
    });
  }
  if(ids.includes('amlodipine') && ids.includes('metoprolol')){
    interactions.push({
      title:'Amlodipine + Metoprolol',
      level:'Moderate',
      note:'This combination may increase dizziness, low energy, or exercise intolerance in some users.',
      action:'Track dizziness and blood pressure symptoms, especially after dose changes.'
    });
  }
  return interactions;
}

function computeContraindications(){
  const ids = state.meds.map(m=>m.medId);
  const flags = [];
  if(state.profile.pregnant && (ids.includes('lisinopril') || ids.includes('losartan'))){
    flags.push({
      title:'Pregnancy caution with ACE inhibitor / ARB therapy',
      level:'High',
      note:'Lisinopril and losartan need clinician review if pregnancy is present or possible.',
      action:'Contact your clinician promptly for medication review.'
    });
  }
  if(state.profile.kidneyDisease && (ids.includes('metformin') || ids.includes('lisinopril') || ids.includes('losartan'))){
    flags.push({
      title:'Kidney disease monitoring needed',
      level:'High',
      note:'This medication profile increases the importance of kidney function and electrolyte monitoring.',
      action:'Do not add new supplements casually until renal status and labs are reviewed.'
    });
  }
  if(state.profile.anticoagulants && state.plan.recommendedSupplements.some(x=>String(x).toLowerCase().includes('coq10'))){
    flags.push({
      title:'Supplement review recommended with blood thinners',
      level:'Moderate',
      note:'Some supplements should be reviewed more carefully when anticoagulants are part of the profile.',
      action:'Ask your clinician or pharmacist to review supplement safety and timing.'
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
  // Base: 60  reflects an engaged user who has entered at least some data.
  let score = 60;

  // ── Evidence quality bonus ───────────────────────────────────────────────
  // Having medications with published evidence is a positive signal: the user
  // has a well-documented regimen that clinicians can verify.
  const hasHighEvidence = state.meds.some(mi => {
    const med = MED_DB.find(x => x.id === mi.medId);
    return med && (med.claims||[]).some(cl => cl.source_quality === "High");
  });
  const hasModEvidence = state.meds.some(mi => {
    const med = MED_DB.find(x => x.id === mi.medId);
    return med && (med.claims||[]).some(cl => cl.source_quality === "Moderate");
  });
  if(hasHighEvidence)      score += 15; // High-quality evidence → clear monitoring pathway
  else if(hasModEvidence)  score += 10; // Moderate evidence → still actionable

  // ── Regimen simplicity bonus ─────────────────────────────────────────────
  // Fewer medications = simpler regimen = higher adherence potential.
  if(state.meds.length >= 1 && state.meds.length <= 2) score += 5;

  // ── Progress bonuses ────────────────────────────────────────────────────
  if(state.plan.started)         score += 10;
  if(state.checkins.length >= 2) score += 10;

  // ── Complexity / risk penalties ─────────────────────────────────────────
  if(state.symptoms.severity === "severe")     score -= 15;
  if(state.symptoms.selected.length >= 4)      score -= 10;
  score -= computeDrugInteractions().length    * 8;
  score -= computeContraindications().length   * 10;

  // ── Adherence signal from latest check-in ───────────────────────────────
  const last = latestCheckin();
  if(last){
    if(last.adherencePct >= 80)      score += 15;
    else if(last.adherencePct < 60)  score -= 15;
  }

  score = clamp(score, 0, 100);
  const level = score >= 75 ? "Strong" : score >= 50 ? "Moderate" : "At risk";
  const reason = score >= 75
    ? "Your current inputs suggest a good chance of staying consistent with this plan."
    : score >= 50
      ? "Your plan may work, but symptoms, complexity, or follow-through could reduce success."
      : "Your current symptom burden or safety complexity may make long-term success harder without closer support.";
  return { score, level, reason };
}

function detectHealthPatterns(){
  const ids   = state.meds.map(m => m.medId);
  const syms  = state.symptoms.selected || [];
  const hasSym = (...s) => s.some(x => syms.includes(x));
  const patterns = [];

  // ── Key insight: patterns fire from the MEDICATION alone ─────────────────
  // Symptoms upgrade the confidence level and personalise the note,
  // but having the drug itself is already a clinically meaningful signal.

  // STATINS ─────────────────────────────────────────────────────────────────
  if(ids.some(id => ['atorvastatin','rosuvastatin','simvastatin'].includes(id))){
    const symptomatic = hasSym('Muscle aches','Fatigue','Low energy','Brain fog','Sleep changes');
    patterns.push({
      title: 'Statin + CoQ10 pattern',
      confidence: symptomatic ? 'High' : 'Moderate',
      note: symptomatic
        ? 'Your muscle or fatigue symptoms on a statin align with known CoQ10 depletion. Discuss CoQ10 monitoring or supplementation with your clinician.'
        : 'Statins reduce CoQ10 synthesis via the mevalonate pathway. Monitoring for muscle aches, fatigue, and energy changes is a reasonable ongoing precaution.'
    });
  }

  // METFORMIN ───────────────────────────────────────────────────────────────
  if(ids.includes('metformin')){
    const symptomatic = hasSym('Fatigue','Brain fog','Tingling hands/feet','Low energy','Dizziness');
    patterns.push({
      title: 'Metformin + B12 monitoring pattern',
      confidence: symptomatic ? 'High' : 'Moderate',
      note: symptomatic
        ? 'Your reported symptoms  fatigue, brain fog, or tingling  may align with B12 depletion from long-term metformin. Consider requesting a B12 level.'
        : 'Long-term metformin is associated with B12 depletion risk. Periodic B12 monitoring is recommended even without symptoms.'
    });
  }

  // PPIs ────────────────────────────────────────────────────────────────────
  if(ids.some(id => ['omeprazole','pantoprazole'].includes(id))){
    const symptomatic = hasSym('Muscle cramps','Dizziness','Fatigue','Heart palpitations','GI discomfort');
    patterns.push({
      title: 'PPI + magnesium pattern',
      confidence: symptomatic ? 'High' : 'Moderate',
      note: symptomatic
        ? 'Your symptoms may reflect magnesium depletion from long-term PPI use. Consider requesting a serum magnesium level.'
        : 'Long-term PPI use reduces gastric-acid-dependent magnesium absorption. Monitoring is recommended for extended use.'
    });
  }

  // GLP-1 AGONISTS ──────────────────────────────────────────────────────────
  if(ids.some(id => ['semaglutide','tirzepatide','liraglutide','dulaglutide'].includes(id))){
    const symptomatic = hasSym('Fatigue','Hair loss','Brain fog','Low energy','Dizziness');
    patterns.push({
      title: 'GLP-1 + nutrient monitoring pattern',
      confidence: symptomatic ? 'High' : 'Moderate',
      note: symptomatic
        ? 'Fatigue or hair changes on GLP-1 therapy may indicate nutrient gaps  Vitamin D, Zinc, or B12  from reduced food intake. Labs are worthwhile.'
        : 'Rapid weight loss on GLP-1 therapy can affect Vitamin D, Zinc, and B12 status. Periodic monitoring is a reasonable precaution.'
    });
  }

  // LEVOTHYROXINE ───────────────────────────────────────────────────────────
  if(ids.includes('levothyroxine')){
    const symptomatic = hasSym('Fatigue','Brain fog','Hair loss','Low energy','Muscle aches','Dizziness');
    patterns.push({
      title: 'Thyroid + cofactor pattern',
      confidence: symptomatic ? 'High' : 'Moderate',
      note: symptomatic
        ? 'Persistent fatigue or hair loss on levothyroxine may signal suboptimal Selenium, Iron, or Zinc  cofactors needed for effective T4 → T3 conversion.'
        : 'Levothyroxine response depends on adequate Selenium, Iron, and Zinc. Checking these cofactors may explain suboptimal symptom control.'
    });
  }

  // LOOP/THIAZIDE DIURETICS ─────────────────────────────────────────────────
  if(ids.some(id => ['furosemide','hydrochlorothiazide'].includes(id))){
    const symptomatic = hasSym('Muscle cramps','Heart palpitations','Fatigue','Dizziness');
    patterns.push({
      title: 'Diuretic + electrolyte pattern',
      confidence: 'High', // always High  very well established
      note: symptomatic
        ? 'Muscle cramps, heart palpitations, or dizziness on a diuretic are classic electrolyte depletion signs. Potassium and magnesium labs should be reviewed promptly.'
        : 'Loop and thiazide diuretics cause potassium and magnesium wasting. Electrolyte monitoring is standard of care with these medications.'
    });
  }

  // BETA-BLOCKERS ───────────────────────────────────────────────────────────
  if(ids.includes('metoprolol')){
    patterns.push({
      title: 'Beta-blocker + CoQ10 pattern',
      confidence: 'Low',
      note: hasSym('Sleep changes')
        ? 'Metoprolol may suppress melatonin synthesis  this can contribute to sleep disturbances. Some patients also see CoQ10 reduction with beta-blocker use.'
        : 'Beta-blockers have been observed to reduce CoQ10 levels in some patients. Monitoring energy and exercise tolerance is a reasonable ongoing check.'
    });
  }

  // ACE INHIBITORS / ARBs ───────────────────────────────────────────────────
  if(ids.some(id => ['lisinopril','enalapril','losartan'].includes(id))){
    const symptomatic = hasSym('Fatigue','Muscle cramps','Dizziness');
    patterns.push({
      title: 'ACE/ARB + zinc monitoring',
      confidence: 'Moderate',
      note: symptomatic
        ? 'ACE inhibitors have zinc-chelating properties. Your fatigue or cramp symptoms may partially overlap with mild zinc depletion from extended use.'
        : 'Long-term ACE inhibitor or ARB use may modestly reduce serum zinc. Monitoring is reasonable in extended use, especially if taste changes occur.'
    });
  }

  // WARFARIN ────────────────────────────────────────────────────────────────
  if(ids.includes('warfarin')){
    patterns.push({
      title: 'Warfarin + Vitamin K stability pattern',
      confidence: 'High',
      note: 'Warfarin works by interfering with Vitamin K. Consistent (not avoided) Vitamin K intake is key  abrupt dietary changes shift INR. Discuss stable Vitamin K management with your clinician.'
    });
  }

  // ── Symptom-only patterns (no medications OR explicit symptom-only mode) ──
  if(state.meds.length === 0 || state.symptomOnlyMode){
    if(hasSym('Fatigue','Brain fog','Poor focus','Tingling hands/feet','Low energy')){
      patterns.push({ title:'B-vitamin support pattern', confidence:'Moderate', note:'This symptom cluster  fatigue, brain fog, poor focus, or tingling  may reflect B12 or B-vitamin support needs even without medications.' });
    }
    if(hasSym('Muscle cramps','Sleep changes','Anxiety','Heart palpitations','Headache')){
      patterns.push({ title:'Magnesium support pattern', confidence:'Moderate', note:'Muscle cramps, anxiety, palpitations, sleep changes, and headaches together are a classic magnesium deficiency symptom cluster.' });
    }
    if(hasSym('Fatigue','Dizziness','Low energy') && hasSym('Hair loss','Poor focus','Mood changes')){
      patterns.push({ title:'Iron deficiency symptom pattern', confidence:'Moderate', note:'This combination of fatigue, dizziness, and hair or mood changes is a recognised presentation of iron deficiency. Ferritin is the most sensitive lab.' });
    }
  }

  // ── Cross-cutting pattern (always, any inputs) ────────────────────────────
  if(hasSym('Hair loss') && hasSym('Fatigue','Dizziness')){
    patterns.push({ title:'Iron + hair loss pattern', confidence:'Moderate', note:'Hair loss combined with fatigue or dizziness is a recognised presentation of iron deficiency. Ferritin is the most sensitive lab to check first.' });
  }

  return patterns;
}

function computeInsightEngine(){
  const patterns = detectHealthPatterns();
  const interactions = computeDrugInteractions();
  const contraindications = computeContraindications();
  const prediction = computeMedicationSuccessPrediction();
  const topScore = computeNutrientScores()[0];
  const symptomText = (state.symptoms.selected || []).slice(0,4).join(", ") || "no major symptoms logged";
  const medNames = state.meds.map(m => {
    const med = MED_DB.find(x=>x.id===m.medId);
    return med ? med.name : m.medId;
  }).join(", ") || "no medications selected";

  let summary = "GeneoRx needs a little more information before it can generate a strong insight.";
  let meaning = "Add symptoms, medications, or check-ins to improve the quality of your insights.";
  let doctorPrompt = "Ask which labs, timing changes, or medication follow-up steps make the most sense for your situation.";

  if(patterns.length){
    const top = patterns[0];
    summary = `Your current symptom pattern with ${medNames} may fit a ${top.title.toLowerCase()}.`;
    meaning = top.note || "This pattern may help explain why symptoms are appearing or why your plan feels harder to follow.";
    doctorPrompt = interactions.length || contraindications.length
      ? `Discuss ${top.title}, plus the interaction/caution alerts GeneoRx found, with your clinician.`
      : `Discuss whether ${top.title} suggests labs, medication timing changes, or targeted support.`;
  } else if(topScore){
    summary = `Your symptoms (${symptomText}) may reflect a ${topScore[0]} support need based on your current entries.`;
    meaning = `GeneoRx currently sees ${topScore[0]} as the strongest signal in your profile.`;
    doctorPrompt = `Ask whether ${topScore[0]} testing, monitoring, or treatment adjustments would be appropriate.`;
  }

  if(prediction.score < 50){
    meaning += " Your medication success prediction suggests this plan may be harder to sustain without support.";
  }
  if(interactions.length){
    meaning += ` GeneoRx also detected ${interactions.length} interaction alert${interactions.length>1?'s':''}.`;
  }
  if(contraindications.length){
    meaning += ` There ${contraindications.length===1?'is':'are'} ${contraindications.length} caution flag${contraindications.length>1?'s':''} that should be reviewed.`;
  }

  return { summary, meaning, doctorPrompt, patterns, interactions, contraindications, prediction };
}


function generateDynamicHealthStory(){
  const medNames = state.meds.map(m=>{
    const med = MED_DB.find(x=>x.id===m.medId);
    return med ? med.name : m.medId;
  });

  const symptoms = state.symptoms?.selected || [];
  const severity = state.symptoms?.severity || "mild";
  const patterns = detectHealthPatterns();
  const success = computeMedicationSuccessPrediction();
  const interactions = computeDrugInteractions();
  const contraindications = computeContraindications();
  const last = latestCheckin();
  const nutrientScores = computeNutrientScores();
  const topNutrient = nutrientScores.length ? nutrientScores[0] : null;

  let parts = [];

  if(medNames.length){
    const medsText = medNames.slice(0,2).join(", ") + (medNames.length > 2 ? " and other medications" : "");
    const maxMonths = Math.max(...state.meds.map(x => Number(x.durationMonths || 0)), 0);
    if(maxMonths > 0){
      parts.push(`You reported taking ${medsText}, with the longest duration currently around ${maxMonths} month${maxMonths===1?"":"s"}.`);
    } else {
      parts.push(`You reported taking ${medsText}.`);
    }
  } else if(state.symptomOnlyMode){
    parts.push(`You are using GeneoRx in symptom-only mode without medications selected.`);
  } else {
    parts.push(`You have not added medications yet, so GeneoRx is interpreting your symptoms with limited context.`);
  }

  if(symptoms.length){
    const symText = symptoms.slice(0,3).join(", ") + (symptoms.length > 3 ? ", and other symptoms" : "");
    parts.push(`Your main reported symptoms are ${symText}, and you rated the overall severity as ${severity}.`);
  } else {
    parts.push(`You have not selected current symptoms yet, so GeneoRx is still building your story.`);
  }

  if(patterns.length){
    const p = patterns[0];
    parts.push(`GeneoRx detected a possible pattern: ${p.title.toLowerCase()}. ${p.note}`);
  } else if(topNutrient){
    parts.push(`Based on your current inputs, ${topNutrient[0]} is the strongest support signal GeneoRx sees right now (${topNutrient[1]}%).`);
  } else {
    parts.push(`GeneoRx has not detected a strong medication or nutrient pattern yet.`);
  }

  if(last){
    const better = (last.symptoms?.items || []).filter(x => x.change === "Much better" || x.change === "Slightly better").map(x=>x.symptom);
    const worse = (last.symptoms?.items || []).filter(x => x.change === "Worse").map(x=>x.symptom);
    if(better.length && !worse.length){
      parts.push(`Your most recent check-in suggests some improvement, especially in ${better.slice(0,2).join(" and ")}.`);
    } else if(worse.length){
      parts.push(`Your most recent check-in suggests ongoing friction, with worsening noted in ${worse.slice(0,2).join(" and ")}.`);
    } else {
      parts.push(`Your most recent check-in shows a mixed picture without a strong improvement or worsening trend yet.`);
    }
    parts.push(`GeneoRx currently estimates your medication success probability at ${success.score}% (${success.level}).`);
  } else {
    parts.push(`You have not logged a weekly check-in yet, so this story is still an early estimate. GeneoRx currently estimates success probability at ${success.score}% (${success.level}).`);
  }

  if(interactions.length || contraindications.length){
    const bits = [];
    if(interactions.length) bits.push(`${interactions.length} interaction alert${interactions.length>1?"s":""}`);
    if(contraindications.length) bits.push(`${contraindications.length} caution flag${contraindications.length>1?"s":""}`);
    parts.push(`GeneoRx also found ${bits.join(" and ")}, which should be part of your next clinician conversation.`);
  }

  if(topNutrient){
    parts.push(`This may be worth discussing with your physician, especially around ${topNutrient[0]} support, lab monitoring, and how your symptom timeline relates to your medication history.`);
  } else {
    parts.push(`This may still be worth discussing with your physician, especially if symptoms persist or worsen.`);
  }

  return parts.join(" ");
}

function computePopulationInsights(){
  const syms  = state.symptoms.selected || [];
  const ids   = state.meds.map(m => m.medId);
  const items = (state.checkins || []).flatMap(c => (c.symptoms?.items || []));
  const counts = {};
  items.forEach(i => { counts[i.symptom] = (counts[i.symptom]||0) + 1; });
  const topTracked = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);

  // ── Build a medication-specific or symptom-specific population message ────
  // This fires even before any check-ins so the card is never empty.
  let baseMessage = '';

  if(ids.some(id => ['atorvastatin','rosuvastatin','simvastatin'].includes(id))){
    baseMessage = 'Statin users most commonly track fatigue and muscle aches. CoQ10 is the top nutrient reviewed in this medication group.';
  } else if(ids.includes('metformin')){
    baseMessage = 'Long-term metformin users frequently benefit from B12 monitoring. Fatigue, brain fog, and tingling are the most commonly reported related symptoms in this group.';
  } else if(ids.some(id => ['omeprazole','pantoprazole'].includes(id))){
    baseMessage = 'Long-term PPI users commonly track GI discomfort, fatigue, and muscle cramps. Magnesium is the most frequently flagged nutrient in this group.';
  } else if(ids.some(id => ['semaglutide','tirzepatide','liraglutide','dulaglutide'].includes(id))){
    baseMessage = 'GLP-1 users commonly experience fatigue and hair changes during active weight loss. Vitamin D and Zinc are the top nutrients to monitor in this group.';
  } else if(ids.includes('levothyroxine')){
    baseMessage = 'Levothyroxine users frequently report fatigue or hair loss as thyroid function stabilises. Selenium and Iron are key cofactors commonly reviewed in this group.';
  } else if(ids.some(id => ['furosemide','hydrochlorothiazide'].includes(id))){
    baseMessage = 'Diuretic users most commonly track muscle cramps and energy dips. Potassium and magnesium are the most critical nutrients to monitor in this group.';
  } else if(ids.includes('warfarin')){
    baseMessage = 'Warfarin users most commonly track energy, bruising, and dietary Vitamin K consistency. INR stability is the primary goal in this group.';
  } else if(ids.includes('metoprolol') || ids.some(id=>['lisinopril','enalapril','losartan','amlodipine'].includes(id))){
    baseMessage = 'Cardiovascular medication users most commonly track fatigue, dizziness, and energy levels. CoQ10 and zinc are frequently reviewed in this group.';
  } else if(syms.length >= 2){
    const topTwo = syms.slice(0, 2).join(' and ');
    baseMessage = `Users reporting ${topTwo} most commonly benefit from targeted nutrient monitoring. Log check-ins to track your personal trend over time.`;
  } else if(syms.length === 1){
    baseMessage = `Users reporting ${syms[0]} often see this improve with targeted nutrient support. Add medications or more symptoms to sharpen your personalised signal.`;
  } else {
    baseMessage = 'Add a medication or symptom to unlock population-level context for your profile.';
  }

  // If check-ins exist, prepend a check-in-driven note
  const checkinsMessage = state.checkins.length >= 2
    ? 'Based on your check-ins, GeneoRx is identifying repeat symptom patterns over time. '
    : state.checkins.length === 1
      ? 'You have logged 1 check-in. Log one more to start tracking your symptom trend. '
      : '';

  return {
    topSymptoms:     syms.slice(0, 3),
    trackedSymptoms: topTracked,
    checkinCount:    state.checkins.length,
    message:         checkinsMessage + baseMessage,
  };
}

function downloadDoctorReport(){
  const snapshot = buildClinicianSnapshotText();
  const html = printableSnapshotHtml(snapshot);
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'geneorx_doctor_report.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
function computeWeeklyCoachMessage(){
  const last = latestCheckin();
  const base = state.wellbeingBaseline || {energy:5,mood:5,sleep:5,focus:5};
  const scores = computeNutrientScores();
  const topDriver = scores.length ? `${scores[0][0]} (${scores[0][1]}%)` : " ";

  if(!last){
    return {
      headline: "Your coach is ready.",
      bullets: [
        "Add medications + symptoms to personalize results.",
        "Start your routine to track real improvement over time.",
        "Log a weekly check-in to generate your Health Signal."
      ],
      nextBestAction: "Go to Insights → Start routine."
    };
  }

  const dE = last.wellbeing.energy - base.energy;
  const dM = last.wellbeing.mood - base.mood;
  const dS = last.wellbeing.sleep - base.sleep;
  const dF = last.wellbeing.focus - base.focus;

  const items = last.symptoms?.items || [];
  const best = items.reduce((acc,x)=> (acc===null || (x.changeScore||0)>(acc.changeScore||0)) ? x : acc, null);
  const worst = items.reduce((acc,x)=> (acc===null || (x.changeScore||0)<(acc.changeScore||0)) ? x : acc, null);

  let next = "Keep the routine consistent for 7 days and log another check-in.";
  if(last.adherencePct < 60) next = "Try one reminder and aim for 70–80% adherence this week.";
  else if((worst?.change||"") === "Worse") next = `Adjust timing/with-food strategy and reassess ${worst.symptom} next week.`;
  else if(dE <= 0 && dS <= 0) next = "Try hydration + protein at breakfast for 7 days, then reassess energy/sleep.";
  else if(dE > 0 || dS > 0) next = "Nice trend keep the same plan for one more week to confirm the signal.";

  const bullets = [
    `Wellbeing deltas: Energy ${dE>=0?"+":""}${dE}, Mood ${dM>=0?"+":""}${dM}, Sleep ${dS>=0?"+":""}${dS}, Focus ${dF>=0?"+":""}${dF}.`,
    `Most improved symptom: ${best?.symptom ? `${best.symptom} (${best.change})` : " "}.`,
    `Least improved symptom: ${worst?.symptom ? `${worst.symptom} (${worst.change})` : " "}.`,
    `Top driver nutrient: ${topDriver}.`
  ];

  const headline =
    (dE + dS + dM + dF) > 0 ? "You’re trending in the right direction." :
    (dE + dS + dM + dF) < 0 ? "Let’s stabilize this week." :
    "Let’s get a clearer signal.";

  return { headline, bullets, nextBestAction: next };
}

/* =========================================================
   ===== 30-SECOND VISIT SNAPSHOT (LOGIC) =====
   ========================================================= */
function buildClinicianSnapshotText(){
  const flags = safetyFlags();
  const meds = state.meds.map(m=>{
    const med = MED_DB.find(x=>x.id===m.medId);
    const nm = med ? med.name : m.medId;
    return `- ${nm} • dose: ${m.dose} • duration: ${m.durationMonths||0} months`;
  });

  const last = latestCheckin();
  const scores = computeNutrientScores();
  const top = scores.slice(0,6).map(([n,sc]) => `- ${n}: ${tierFromScore(sc)} signal (${sc}%)`);
  const interactions = computeDrugInteractions().map(x=>`- ${x.title} (${x.level})`);
  const contraindications = computeContraindications().map(x=>`- ${x.title} (${x.level})`);
  const success = computeMedicationSuccessPrediction();
  const patterns = detectHealthPatterns().map(x=>`- ${x.title} (${x.confidence})`);

  const supp = (state.plan.recommendedSupplements||[]);
  const adh = last ? `${last.adherencePct}%` : " ";
  const labs = uniq(scores.slice(0,5).flatMap(([n]) => LAB_SUGGESTIONS[n] || [])).slice(0,8);
  const symptoms = state.symptoms.selected.length ? state.symptoms.selected.join(", ") : "None selected";
  const lastDate = last ? fmtDate(last.dateISO) : " ";

  return [
    "GENEORX   DOCTOR VISIT SUMMARY",
    "===============================",
    "",
    `Patient: ${state.account.email || "Anonymous"}   Age: ${state.profile.age || " "}   Gender: ${state.profile.gender || " "}`,
    `Safety flags: ${flags.length ? flags.join(", ") : "None reported"}`,
    `Medication success prediction: ${success.score}% (${success.level})`,
    "",
    "Medications:",
    meds.length ? meds.join("\n") : "- None reported",
    "",
    `Symptoms (recent): ${symptoms}`,
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
    "Pattern detection:",
    patterns.length ? patterns.join("\n") : "- No strong pattern detected yet",
    "",
    "Current protocol (supplement support):",
    supp.length ? supp.map(x=>`- ${x}`).join("\n") : "- Not started / none saved",
    `Adherence (latest check-in): ${adh}`,
    "",
    "Optional labs to consider (clinical context needed):",
    labs.length ? labs.map(x=>`- ${x}`).join("\n") : "-  ",
    "",
    `Latest check-in date: ${lastDate}`,
    "",
    "Note: Educational guidance with evidence transparency; confirm labs, dosing, and interactions with your clinician."
  ].join("\n");
}

function formatSnapshotHtml(text){
  const lines = String(text || "").split("\n");
  const title = escapeHtml(lines[0] || "GeneoRx Doctor Visit Summary");
  const sections = [];
  let current = { title: "Patient overview", lines: [] };

  lines.slice(3).forEach(line=>{
    const clean = line.trim();
    if(!clean) return;
    if(clean.endsWith(":")){
      if(current.lines.length) sections.push(current);
      current = { title: clean.replace(/:$/, ""), lines: [] };
      return;
    }
    current.lines.push(clean);
  });
  if(current.lines.length) sections.push(current);

  return `
    <article class="snapshotReport">
      <div class="snapshotReportHd">
        <h2>${title}</h2>
        <p>Prepared from the current GeneoRx dashboard entries. Review with a licensed clinician before making care decisions.</p>
      </div>
      ${sections.map(section => `
        <section class="snapshotSection">
          <div class="snapshotSectionTitle">${escapeHtml(section.title)}</div>
          ${section.lines.map(line => line.startsWith("- ")
            ? `<div class="snapshotBullet">${escapeHtml(line.slice(2))}</div>`
            : `<div class="snapshotLine">${escapeHtml(line)}</div>`
          ).join("")}
        </section>
      `).join("")}
    </article>
  `;
}

function printableSnapshotHtml(text){
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>GeneoRx Doctor Visit Summary</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:28px;color:#10201b;background:#f7faf9;line-height:1.5}
    .snapshotReport{max-width:820px;margin:0 auto;border:1px solid #dde6e3;border-radius:14px;background:#fff;overflow:hidden}
    .snapshotReportHd{padding:22px 24px;background:#ecf6f3;border-bottom:1px solid #d7ede7}
    h2{margin:0;font-size:24px;letter-spacing:-.3px}
    p{margin:8px 0 0;color:#3c4f4a;font-size:14px}
    .snapshotSection{padding:17px 24px;border-bottom:1px solid #e8edec}
    .snapshotSection:last-child{border-bottom:none}
    .snapshotSectionTitle{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#6b7b77;margin-bottom:8px}
    .snapshotLine{font-size:14px;white-space:pre-wrap}
    .snapshotBullet{padding:8px 10px;border:1px solid #e8edec;border-radius:8px;background:#f7faf9;font-size:14px;margin-top:6px}
    @media print{body{background:#fff;padding:0}.snapshotReport{border:none;border-radius:0}}
  </style>
</head>
<body>${formatSnapshotHtml(text)}</body>
</html>`;
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
function downloadJson(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

document.getElementById("btnReset").addEventListener("click", resetDemo);

/* Share button */
document.getElementById("btnShare").addEventListener("click", async ()=>{
  const url = window.location.href;
  await copyToClipboard(url);
  downloadJson("geneorx_doctor_summary.json", { meta:{createdISO:new Date().toISOString()}, state });
  showToast("Doctor summary exported ✓");
});

/* =========================================================
   ===== SNAPSHOT MODAL WIRES =====
   ========================================================= */
const backdrop = document.getElementById("backdrop");
const modal = document.getElementById("modal");
const snapText = document.getElementById("snapText");
let currentSnapshotText = "";

function openSnapshotModal(){
  currentSnapshotText = buildClinicianSnapshotText();
  snapText.innerHTML = formatSnapshotHtml(currentSnapshotText);
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
  await copyToClipboard(currentSnapshotText || buildClinicianSnapshotText());
  showToast("Copied ✓");
});
document.getElementById("snapPrint").addEventListener("click", ()=>{
  const w = window.open("", "_blank");
  const text = currentSnapshotText || buildClinicianSnapshotText();
  w.document.write(printableSnapshotHtml(text));
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
  closePatternReveal();
  showInsightModal();
}
function closeInsightModal(){
  insightBackdrop.style.display = "none";
  insightModal.style.display = "none";
}
document.getElementById("insightClose").addEventListener("click", closeInsightModal);
insightBackdrop.addEventListener("click", closeInsightModal);
document.getElementById("insightCopy").addEventListener("click", async ()=>{
  const text = `GeneoRx Insight\n\nWhat GeneoRx sees: ${insightSummary.textContent}\n\nWhat this may mean: ${insightMeaning.textContent}\n\nWhat to discuss with your doctor: ${insightDoctor.textContent}\n\nWhy GeneoRx generated this insight: ${insightWhy.textContent}`;
  await copyToClipboard(text);
  showToast("Copied ✓");
});

/* =========================================================
   ===== TABS =====
   ========================================================= */
const STEP_LABELS = ["Account","Medications","Symptoms","Wellbeing","Insights","Check-in","Progress","Sources","Doctor summary","Feedback"];
const NEXT_STEP_LABELS = [
  "Continue to Medications",
  "Continue to Symptoms",
  "Set Wellbeing Baseline",
  "Review Insights",
  "Log Check-in",
  "View Progress",
  "Review Sources",
  "Prepare Doctor Summary",
  "Send Feedback",
  "Finish"
];
const JOURNEY_GROUPS = [
  { title:"Setup", subtitle:"Tell GeneoRx what to review", steps:[0,1,2,3] },
  { title:"Insights", subtitle:"Understand possible patterns", steps:[4] },
  { title:"Routine", subtitle:"Start and track weekly actions", steps:[5,6] },
  { title:"Share", subtitle:"Evidence and doctor notes", steps:[7,8] },
  { title:"Account", subtitle:"Settings and support", steps:[9] },
];

function scrollDashboardToTop(){
  const target = document.querySelector(".page-head") || document.getElementById("main");
  if(!target) return;
  requestAnimationFrame(()=>{
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setStep(n, options = {}){
  const { scroll = true } = options;

  state.step = clamp(n, 0, STEP_LABELS.length-1);
  save();
  if(scroll) scrollDashboardToTop();
}

function renderSteps(){
  const colors = ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10"];
  stepsEl.innerHTML = `<div class="stepRail" aria-label="Dashboard steps"></div>`;
  const rail = stepsEl.querySelector(".stepRail");
  const primarySteps = [0, 1, 2, 3, 4];
  const secondarySteps = [5, 6, 7, 8, 9];

  primarySteps.forEach(i=>{
    const s = document.createElement("button");
    s.type = "button";
    s.className = `step ${colors[i]} ${i===state.step ? "on":""}`;
    s.textContent = STEP_LABELS[i];
    s.setAttribute("aria-current", i===state.step ? "step" : "false");
    s.addEventListener("click", ()=> setStep(i));
    rail.appendChild(s);
  });

  const more = document.createElement("select");
  more.className = `stepMoreSelect ${secondarySteps.includes(state.step) ? "on" : ""}`;
  more.setAttribute("aria-label", "More dashboard sections");
  more.innerHTML = `<option value="">More</option>` + secondarySteps.map(i => (
    `<option value="${i}" ${state.step===i ? "selected" : ""}>${escapeHtml(STEP_LABELS[i])}</option>`
  )).join("");
  more.addEventListener("change", ()=>{
    if(more.value !== "") setStep(parseInt(more.value, 10));
  });
  rail.appendChild(more);
}

function renderPills(){
  if (pillUser) pillUser.textContent = AUTHENTICATED_USER || state.account.email || "Guest";
  pillPlan.textContent = state.plan.started ? `Started ${fmtDate(state.plan.startDate)}` : "Not started";
  pillChecks.textContent = String(state.checkins.length);
}

function setupSummaryToggle(){
  const panel = document.getElementById("summaryPanel");
  const btn = document.getElementById("btnToggleSummary");
  if(!panel || !btn || btn.dataset.bound === "true") return;
  btn.dataset.bound = "true";
  btn.addEventListener("click", ()=>{
    panel.classList.toggle("summary-open");
    btn.textContent = panel.classList.contains("summary-open") ? "Hide progress summary" : "View progress summary";
  });
}

function renderContactBox(){
  contactBox.innerHTML = `
    <div class="k">Your feedback is valuable</div>
    <div class="v">
      Found something confusing? Want to suggest an improvement?
      Email us at <a class="mailto" href="mailto:info@geneorx.com">info@geneorx.com</a>.
    </div>
    <div class="fineprint" style="margin-top:10px">
      Pro tip: use “Doctor summary” when you want a clinician-ready overview.
    </div>
  `;
}

function renderSummaryTop(){
  const medsCount = state.meds.length;
  const symCount = state.symptoms.selected.length;
  const cov = evidenceCoverage();
  const flags = safetyFlags();

  const next =
    !state.account.consent ? "Complete Account"
    : medsCount===0 ? "Add Medications"
    : symCount===0 ? "Select Symptoms"
    : !state.plan.started ? "Review Insights"
    : "Log a Check-in";

  summaryTop.innerHTML = `
    <div class="tagline">
      <strong>Quick status</strong><br>
      Age: <strong>${escapeHtml(state.profile.age||" ")}</strong> • Gender: <strong>${escapeHtml(state.profile.gender||" ")}</strong><br>
      Medications: <strong>${medsCount}</strong> • Symptoms: <strong>${symCount}</strong> • Evidence: <strong>${cov.evidenceCount}/${cov.selectedCount}</strong><br>
      <div class="fineprint" style="margin-top:8px">Routine: <strong>${state.plan.started ? "Started" : "Not started"}</strong> • Reminders: <strong>${state.reminderPreferences?.enabled ? "On" : "Off"}</strong> • Check-ins: <strong>${state.checkins.length}</strong></div>
      <div class="fineprint" style="margin-top:8px">Safety flags: <strong>${escapeHtml(flags.length?flags.join(", "):"None")}</strong></div>
      <div class="fineprint" style="margin-top:8px">Next suggested step: <strong>${escapeHtml(next)}</strong></div>
      <div class="quickActions">
        <button class="qaBtn ghost" data-go="0">Account</button>
        <button class="qaBtn ghost" data-go="1">Medications</button>
        <button class="qaBtn ghost" data-go="2">Symptoms</button>
        <button class="qaBtn ghost" data-go="4">Insights</button>
        <button class="qaBtn ghost" data-go="5">Check-in</button>
        <button class="qaBtn ghost" data-go="6">Progress</button>
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
  const lastLine = last ? `Latest: ${fmtDate(last.dateISO)} • Adherence ${last.adherencePct}%` : "No check-ins yet. Log your first weekly check-in to unlock your Health Signal.";
  const flags = safetyFlags();

  const blocks = [
    {k:"Account", v: `${state.account.email || AUTHENTICATED_USER} • Consent: ${state.account.consent ? "Yes" : "No"}`},
    {k:"Age / Gender", v: `${state.profile.age || " "} / ${state.profile.gender || " "}`},
    {k:"Safety flags", v: flags.length ? flags.join(", ") : "None"},
    {k:"Medications", v: meds.length ? meds.join(", ") : "None yet."},
    {k:"Symptoms selected", v: state.symptoms.selected.length ? state.symptoms.selected.join(", ") : "None yet."},
    {k:"Baseline wellbeing", v: `Energy ${state.wellbeingBaseline.energy}/10 • Mood ${state.wellbeingBaseline.mood}/10 • Sleep ${state.wellbeingBaseline.sleep}/10 • Focus ${state.wellbeingBaseline.focus}/10`},
    {k:"Routine", v: state.plan.started ? `Started ${fmtDate(state.plan.startDate)}` : "Not started yet."},
    {k:"Supplements", v: state.plan.recommendedSupplements.length ? state.plan.recommendedSupplements.join(", ") : "No routine supplements yet."},
    {k:"Check-ins", v: lastLine},
  ];

  sideEl.innerHTML = "";
  blocks.forEach(x=>{
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<div class="k">${escapeHtml(x.k)}</div><div class="v">${escapeHtml(x.v)}</div>`;
    sideEl.appendChild(div);
  });
}

function navButtons(prev=true,next=true,nextLabel=""){
  const wrap = document.createElement("div");
  wrap.className = "btns stickyNav";
  if(prev){
    const b = document.createElement("button");
    b.textContent = "Back";
    b.className = "ghost";
    b.addEventListener("click", ()=> setStep(state.step-1));
    wrap.appendChild(b);
  }
  const meta = document.createElement("div");
  meta.className = "navStepMeta";
  meta.textContent = `Step ${state.step + 1} of ${STEP_LABELS.length}`;
  wrap.appendChild(meta);
  if(next){
    const b = document.createElement("button");
    b.textContent = nextLabel || NEXT_STEP_LABELS[state.step] || "Continue";
    b.className = "primary";
    b.addEventListener("click", ()=> setStep(state.step+1));
    wrap.appendChild(b);
  }
  return wrap;
}

/* =========================================================
   ===== TAB RENDERERS (DIVIDED BY TAB) =====
   ========================================================= */

/* ===== TAB 0: ACCOUNT ===== */
function renderAccount(){
  const flags = safetyFlags();
  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>Start with your basics</strong><br>
      Confirm a few details so GeneoRx can personalize safety notes and keep your dashboard synced.
    </div>

    <div style="height:12px"></div>

    <div class="row">
      <div class="col">
        <label>Email</label>
        <input id="email" placeholder="name@email.com" value="${escapeHtml(state.account.email||"")}" />
      </div>
      <div class="col">
        <label>Consent</label>
        <select id="consent">
          <option value="no" ${state.account.consent? "": "selected"}>Not yet</option>
          <option value="yes" ${state.account.consent? "selected": ""}>I agree</option>
        </select>
      </div>
    </div>

    <div style="height:12px"></div>

    <div class="row">
      <div class="col">
        <label>Age</label>
        <input id="age" type="number" min="0" max="120" placeholder="e.g., 42" value="${escapeHtml(state.profile.age || "")}" />
      </div>
      <div class="col">
        <label>Gender</label>
        <select id="gender">
          <option value="">Select…</option>
          <option value="Female" ${state.profile.gender==="Female"?"selected":""}>Female</option>
          <option value="Male" ${state.profile.gender==="Male"?"selected":""}>Male</option>
          <option value="Non-binary" ${state.profile.gender==="Non-binary"?"selected":""}>Non-binary</option>
          <option value="Prefer not to say" ${state.profile.gender==="Prefer not to say"?"selected":""}>Prefer not to say</option>
        </select>
      </div>
      <div class="col">
        <label>Pregnant / breastfeeding</label>
        <select id="preg">
          <option value="no" ${!state.profile.pregnant?"selected":""}>No</option>
          <option value="yes" ${state.profile.pregnant?"selected":""}>Yes</option>
        </select>
      </div>
    </div>

    <div style="height:12px"></div>

    <div class="row">
      <div class="col">
        <label>Safety flags (optional)</label>
        <div class="fineprint">These trigger extra safety notes in Insights.</div>
        <div class="chips" style="margin-top:10px">
          <div class="chip" id="kidneyChip" aria-pressed="${state.profile.kidneyDisease?"true":"false"}">Kidney disease</div>
          <div class="chip" id="antiChip" aria-pressed="${state.profile.anticoagulants?"true":"false"}">Anticoagulants / blood thinners</div>
        </div>
      </div>
    </div>

    ${flags.length ? `
      <div class="banner">
        <strong>Safety note:</strong> You selected ${escapeHtml(flags.join(", "))}.
        Recommendations are educational and should be confirmed with a clinician.
      </div>
    ` : ``}

    <div class="fineprint" style="margin-top:10px">
      Your health profile is private and used only to personalize your GeneoRx insight.
    </div>
  `;

  function commit(options = {}){
    const { render = true } = options;
    state.account.email = s1.querySelector("#email").value.trim();
    state.account.consent = s1.querySelector("#consent").value==="yes";
    const ageVal = parseInt(s1.querySelector("#age").value || "", 10);
    state.profile.age = Number.isFinite(ageVal) ? String(ageVal) : "";
    state.profile.gender = s1.querySelector("#gender").value || "";
    state.profile.pregnant = s1.querySelector("#preg").value==="yes";
    state.profile.kidneyDisease = s1.querySelector("#kidneyChip").getAttribute("aria-pressed") === "true";
    state.profile.anticoagulants = s1.querySelector("#antiChip").getAttribute("aria-pressed") === "true";
    save({ render });
    console.log("Account saved:", {
      email: state.account.email,
      age: state.profile.age,
      gender: state.profile.gender,
      pregnant: state.profile.pregnant,
      kidneyDisease: state.profile.kidneyDisease,
      anticoagulants: state.profile.anticoagulants
    });
  }
  ["#email","#consent","#age","#gender","#preg"].forEach(sel=>{
    const el = s1.querySelector(sel);
    const ev = (sel==="#email" || sel==="#age") ? "input" : "change";
    el.addEventListener(ev, ()=> commit({ render: ev !== "input" }));
    el.addEventListener("blur", ()=> commit({ render: true }));
  });

  s1.querySelector("#kidneyChip").addEventListener("click", ()=>{
    state.profile.kidneyDisease = !state.profile.kidneyDisease; save(); showToast("Saved ✓");
  });
  s1.querySelector("#antiChip").addEventListener("click", ()=>{
    state.profile.anticoagulants = !state.profile.anticoagulants; save(); showToast("Saved ✓");
  });

  mainEl.appendChild(s1);
  mainEl.appendChild(navButtons(false,true));
}

/* ===== TAB 1: MEDICATIONS ===== */
function renderMeds(){
  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>Medications</strong><br>
      Pick from common medications, or search + add your own if it’s not listed.
    </div>

    <div id="covWrap"></div>

    <div style="height:12px"></div>

    <div class="medRow">
      <div class="col">
        <label>Search medications</label>
        <input id="medSearch" placeholder="Type to filter (e.g., metformin, semaglutide…)" />
      </div>

      <div class="col">
        <label>Medication list</label>
        <select id="medPick">
          <option value="">Select…</option>
        </select>
      </div>

      <div class="col">
        <label>Dose</label>
        <select id="dosePick">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div class="col">
        <label>Duration (months)</label>
        <input id="durPick" type="number" min="0" max="360" placeholder="e.g., 18" value="12" />
      </div>
    </div>

    <div class="hint">
      Not seeing your medication? Type it below and add it as a custom medication (evidence will be “Pending” until mapped).
    </div>

    <div class="row" style="margin-top:10px">
      <div class="col">
        <label>Add custom medication</label>
        <input id="medCustom" placeholder="Type medication name (e.g., 'Spironolactone')" />
      </div>
      <div class="col" style="max-width:260px">
        <label>&nbsp;</label>
        <button class="ghost" id="btnAddCustom" style="width:100%">Add custom + add to my list</button>
      </div>
    </div>

    <div class="btns">
      <button class="primary" id="btnAddMed">Add medication</button>
      <button class="ghost" id="btnNoMeds">I do not take any medications right now</button>
    </div>

    <div class="fineprint" style="margin-top:10px">
      Tip: If you do not take medications, use the symptom-only button above. GeneoRx can still suggest nutrient support from symptoms alone.
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
    medPick.innerHTML = `<option value="">Select…</option>` + list.map(m=>(
      `<option value="${m.id}">${escapeHtml(m.name)}</option>`
    )).join("");
    if(current && list.some(m=>m.id===current)) medPick.value = current;
  }

  function drawCoverage(){
    const cov = evidenceCoverage();
    covWrap.innerHTML = `
      <div class="covPill">
        Evidence coverage: <strong>${cov.evidenceCount}/${cov.selectedCount}</strong>
        <span style="opacity:.9">(${cov.selectedCount ? "mapped meds show citations" : "add meds to see coverage"})</span>
      </div>
    `;
  }

  function drawList(){
    medList.innerHTML = "";
    if(!state.meds.length){
      medList.innerHTML = `
        <div class="emptyState">
          <div class="emptyStateTitle">No medications added yet</div>
          <div class="emptyStateText">Add one medication to unlock nutrient signals, interaction checks, and evidence coverage. If you do not take medications, use symptom-only mode.</div>
        </div>
      `;
      drawCoverage();
      return;
    }
    state.meds.forEach((m,idx)=>{
      const med = MED_DB.find(x=>x.id===m.medId);
      const div = document.createElement("div");
      div.className="item";
      div.innerHTML = `
        <div class="k">${escapeHtml(med?med.name:m.medId)}</div>
        <div class="v">Dose: <strong>${escapeHtml(m.dose)}</strong> • Duration: <strong>${escapeHtml(String(m.durationMonths||0))} months</strong></div>
        <div class="btns"><button class="danger" data-del="${idx}">Remove</button></div>
      `;
      div.querySelector("[data-del]").addEventListener("click", ()=>{
        state.meds.splice(idx,1);
        save(); showToast("Removed ✓");
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
    if(!name) return alert("Please type a medication name first.");
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
    save(); showToast("Added custom ✓");
  });

  s1.querySelector("#btnAddMed").addEventListener("click", ()=>{
    const ok = addFromPickerIfValid();
    if(!ok) return alert("Please select a medication (or add a custom one) first.");
    state.symptomOnlyMode = false;
    save(); showToast("Added ✓");
  });

  s1.querySelector("#btnNoMeds").addEventListener("click", ()=>{
    state.meds = [];
    state.symptomOnlyMode = true;
    save();
    showToast("Symptom-only mode enabled ✓");
  });

  medSearch.addEventListener("input", ()=> populateSelect(medSearch.value));
  populateSelect(""); drawList(); drawCoverage();

  const nav = navButtons(true,true);
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
        <label>Select symptoms</label>
        <div class="fineprint">Choose what you’ve noticed recently. If you do not see your symptom, type your own below.</div>
        <div class="chips" id="chips"></div>
        <div class="btns"><button class="ghost" id="clear">Clear</button></div>
        <div class="divider"></div>
        <label>Add your own symptom</label>
        <div class="row">
          <div class="col"><input id="customSymptom" placeholder="Type your symptom here" /></div>
          <div class="col" style="max-width:220px"><button class="primary" id="addCustomSymptom" style="width:100%">Add symptom</button></div>
        </div>
        <div class="fineprint" style="margin-top:8px">Custom symptoms are saved and included in your results.</div>
      </div>

      <div class="col" style="max-width:320px">
        <label>Severity</label>
        <select id="sevSel">
          <option value="mild" ${state.symptoms.severity==="mild"?"selected":""}>Mild</option>
          <option value="moderate" ${state.symptoms.severity==="moderate"?"selected":""}>Moderate</option>
          <option value="severe" ${state.symptoms.severity==="severe"?"selected":""}>Severe</option>
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
        save(); showToast("Saved ✓");
      });
      chipsEl.appendChild(c);
    });
  }
  drawChips();

  s1.querySelector("#clear").addEventListener("click", ()=>{
    state.symptoms.selected = [];
    save(); showToast("Cleared ✓");
  });

  s1.querySelector("#addCustomSymptom").addEventListener("click", ()=>{
    const input = s1.querySelector("#customSymptom");
    if(!addCustomSymptom(input.value)) return alert("Please type a symptom first.");
    input.value = "";
    save();
    showToast("Custom symptom added ✓");
  });

  s1.querySelector("#customSymptom").addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      e.preventDefault();
      s1.querySelector("#addCustomSymptom").click();
    }
  });

  const nav = navButtons(true,true);
  nav.querySelector(".primary").addEventListener("click", ()=>{
    state.symptoms.severity = s1.querySelector("#sevSel").value;
    save(); showToast("Saved ✓");
    setStep(3);
  });
  mainEl.appendChild(nav);
}

/* ===== TAB 3: WELLBEING ===== */
function renderWellbeing(){
  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="fineprint">Set a baseline so GeneoRx can clearly show improvement over time.</div>
    <div style="height:10px"></div>

    <div class="row">
      <div class="col"><label>Energy (0–10)</label><input id="energy" type="number" min="0" max="10" value="${state.wellbeingBaseline.energy}" /></div>
      <div class="col"><label>Mood (0–10)</label><input id="mood" type="number" min="0" max="10" value="${state.wellbeingBaseline.mood}" /></div>
      <div class="col"><label>Sleep (0–10)</label><input id="sleep" type="number" min="0" max="10" value="${state.wellbeingBaseline.sleep}" /></div>
      <div class="col"><label>Focus (0–10)</label><input id="focus" type="number" min="0" max="10" value="${state.wellbeingBaseline.focus}" /></div>
    </div>
  `;
  mainEl.appendChild(s1);

  const nav = navButtons(true,true);
  nav.querySelector(".primary").addEventListener("click", ()=>{
    state.wellbeingBaseline.energy = clamp(parseInt(s1.querySelector("#energy").value||"0",10),0,10);
    state.wellbeingBaseline.mood = clamp(parseInt(s1.querySelector("#mood").value||"0",10),0,10);
    state.wellbeingBaseline.sleep = clamp(parseInt(s1.querySelector("#sleep").value||"0",10),0,10);
    state.wellbeingBaseline.focus = clamp(parseInt(s1.querySelector("#focus").value||"0",10),0,10);
    save(); showToast("Baseline saved ✓");
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
          <div style="font-weight:950">Personal guidance</div>
          <div class="fineprint">Personalized guidance based on your inputs + check-ins.</div>
        </div>
      </div>
      <div style="height:10px"></div>
      <div class="v"><strong>${escapeHtml(coach.headline)}</strong></div>
      <div class="fineprint" style="margin-top:8px">${coach.bullets.map(x=>`• ${escapeHtml(x)}`).join("<br>")}</div>
      <div class="divider"></div>
      <div class="v"><strong>Next best action:</strong> ${escapeHtml(coach.nextBestAction)}</div>
    </div>
  `;
  mainEl.appendChild(s0);

  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>Your Insights</strong><br>
      Nutrient signals are estimated from medications (evidence-linked) + symptoms.
      <div class="fineprint" style="margin-top:8px">Evidence coverage: <strong>${cov.evidenceCount}/${cov.selectedCount}</strong></div>
    </div>

    ${flags.length ? `
      <div class="banner">
        <strong>Safety note:</strong> You selected ${escapeHtml(flags.join(", "))}.
        Confirm supplement choices with your clinician.
      </div>
    ` : ``}
  `;
  mainEl.appendChild(s1);

  const interactions = computeDrugInteractions();
  const contraindications = computeContraindications();

  // ── Top signal ──────────────────────────────────────────────────────────
  // Expose topSignal as soon as there is any non-trivial score (≥5).
  // This ensures even a single symptom selection produces a visible signal.
  const topSignal = (scores.length && scores[0][1] >= 5)
    ? { nutrient: scores[0][0], score: scores[0][1], tier: tierFromScore(scores[0][1]) }
    : null;

  // ── Inputs summary ──────────────────────────────────────────────────────
  const allSelectedSymptoms = [
    ...state.symptoms.selected,
    ...(state.symptoms.custom || [])
  ];
  const recentSymptoms = allSelectedSymptoms.slice(0, 6);
  const symptomText = recentSymptoms.length
    ? recentSymptoms.join(', ')
    : 'no symptoms selected yet';

  const medNames = state.meds
    .map(mi => { const m = MED_DB.find(x => x.id === mi.medId); return m ? m.name : null; })
    .filter(Boolean)
    .slice(0, 4);
  const medText = medNames.length ? medNames.join(', ') : 'no medications added yet';

  const hasMedSignal = state.meds.some(mi => {
    const m = MED_DB.find(x => x.id === mi.medId);
    return m && (m.claims || []).length > 0;
  });

  const whyReason = topSignal
    ? (hasMedSignal
        ? `Your current medications are associated with ${topSignal.nutrient} depletion risk${recentSymptoms.length ? `, and your reported symptoms (${symptomText}) align with this pattern` : ''}.`
        : `Your reported symptoms  especially ${symptomText}  suggest a ${topSignal.nutrient} support need worth reviewing with your clinician.`)
    : (state.meds.length === 0 && allSelectedSymptoms.length === 0
        ? `Add at least one medication or symptom in the earlier steps so GeneoRx can generate a personalized nutrient signal.`
        : `GeneoRx needs a few more details before it can explain likely drivers with confidence.`);

  const doctorTopics = uniq([
    ...(topSignal
        ? [`Ask whether ${topSignal.nutrient} testing or monitoring would be appropriate given your ${hasMedSignal ? 'current medications' : 'reported symptoms'}.`]
        : []),
    ...interactions.map(x => `${x.title}: ${x.action}`),
    ...contraindications.map(x => `${x.title}: ${x.action}`)
  ]).slice(0, 4);

  // ── Empty-state prompt when no inputs at all ───────────────────────────
  const noInputs = state.meds.length === 0 && allSelectedSymptoms.length === 0;

  const sCore = document.createElement("div");
  sCore.className="section";
  sCore.innerHTML = noInputs ? `
    <div class="tagline" style="text-align:center; padding:28px 16px;">
      <div style="font-size:32px; margin-bottom:12px;">🔬</div>
      <strong>No data yet  let's build your signal.</strong><br>
      <span style="font-weight:400">Go back to <strong>Medications</strong> or <strong>Symptoms</strong> to enter your details.
      GeneoRx will compute your personal nutrient signal instantly.</span>
      <div style="height:16px"></div>
      <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="setStep(1)">Add medications</button>
        <button class="btn btn-outline btn-sm" onclick="setStep(2)">Add symptoms</button>
      </div>
    </div>
  ` : `
    <div class="row">
      <div class="col">
        <div class="tagline"><strong>Why might I feel this way?</strong><br>GeneoRx explains likely drivers from your medications, symptoms, and nutrient signals.</div>
        <div style="height:10px"></div>
        <div class="item">
          <div class="k">Likely explanation</div>
          <div class="v">${escapeHtml(whyReason)}</div>
        </div>
        <div class="item">
          <div class="k">Current inputs</div>
          <div class="v">
            Symptoms: <strong>${escapeHtml(symptomText)}</strong><br>
            Medications: <strong>${escapeHtml(medText)}</strong>${topSignal
              ? `<br>Top signal: <strong>${escapeHtml(topSignal.nutrient)}</strong> (${topSignal.score}% • ${escapeHtml(topSignal.tier)})`
              : ''}
          </div>
        </div>
      </div>
      <div class="col">
        <div class="tagline"><strong>What should I discuss with my doctor?</strong><br>Bring these points to your next visit so the conversation is focused and useful.</div>
        <div style="height:10px"></div>
        <div class="list">${doctorTopics.length
          ? doctorTopics.map((x,i) => `<div class="item"><div class="k">Topic ${i+1}</div><div class="v">${escapeHtml(x)}</div></div>`).join('')
          : `<div class="fineprint">Add medications or symptoms to generate personalised clinician discussion prompts.</div>`}
        </div>
      </div>
    </div>`;
  mainEl.appendChild(sCore);

  const sAction = document.createElement("div");
  sAction.className="section";
  sAction.innerHTML = `
    <div class="tagline"><strong>What should I do today?</strong><br>GeneoRx turns your inputs into a simple daily action plan.</div>
    <div style="height:10px"></div>
    <div class="list">
      <div class="item"><div class="k">1. Start with one action</div><div class="v">${topSignal
        ? `Focus on your <strong>${escapeHtml(topSignal.nutrient)}</strong> signal first  addressing one nutrient gap is more effective than trying to change everything at once.`
        : `Add at least one medication or symptom so GeneoRx can prioritise your first action.`}</div></div>
      <div class="item"><div class="k">2. Follow your routine</div><div class="v">Use the Morning / Midday / Night routine below and keep it simple enough to repeat daily.</div></div>
      <div class="item"><div class="k">3. Track what changes</div><div class="v">Use weekly check-ins to watch energy, mood, sleep, focus, and your main symptoms over time.</div></div>
      <div class="item"><div class="k">4. Prepare for your clinician</div><div class="v">Use the Doctor Visit Summary to bring a clean summary of symptoms, risks, and possible labs.</div></div>
    </div>`;
  mainEl.appendChild(sAction);

  const sInsightBtn = document.createElement("div");
  sInsightBtn.className = "section";
  sInsightBtn.innerHTML = `
    <div class="tagline"><strong>GeneoRx Insight</strong><br>Your focused summary explains what GeneoRx sees, what it may mean, and what to discuss with your clinician.</div>
    <div class="btns"><button class="primary" id="openInsightBtn">Open GeneoRx Insight</button></div>
  `;
  mainEl.appendChild(sInsightBtn);
  sInsightBtn.querySelector("#openInsightBtn").addEventListener("click", openInsightModal);

  const success = computeMedicationSuccessPrediction();
  const patterns = detectHealthPatterns();
  const population = computePopulationInsights();

  const sAdvanced = document.createElement("div");
  sAdvanced.className = "section";
  sAdvanced.innerHTML = `
    <details class="dashboardDetails">
      <summary>Advanced trends and prediction</summary>
      <div class="detailsBody">
        <div class="metricGrid">
          <div class="metricCard"><div class="k">Medication success prediction</div><div class="v"><strong>${success.score}%</strong> • ${escapeHtml(success.level)}<br><span style="font-size:12.5px">${escapeHtml(success.reason)}</span></div></div>
          <div class="metricCard"><div class="k">Pattern detection</div><div class="v">${
            patterns.length
              ? patterns.slice(0,2).map(p =>
                  `<strong>${escapeHtml(p.title)}</strong> <span style="font-size:11px;opacity:.75">(${escapeHtml(p.confidence)})</span><br><span style="font-size:12.5px">${escapeHtml(p.note)}</span>`
                ).join('<div style="height:10px"></div>')
              : 'No strong pattern detected yet. Add a medication or symptom to generate pattern insights.'
          }</div></div>
          <div class="metricCard"><div class="k">Population insights</div><div class="v"><span style="font-size:12.5px">${escapeHtml(population.message)}</span><br>${population.trackedSymptoms.length ? `Frequently tracked: <strong>${escapeHtml(population.trackedSymptoms.join(', '))}</strong>` : '<span style="font-size:12px;opacity:.75">Track more check-ins to unlock trends.</span>'}</div></div>
        </div>
      </div>
    </details>
  `;
  mainEl.appendChild(sAdvanced);

  const sSafety = document.createElement("div");
  sSafety.className = "section";
  sSafety.innerHTML = `
    <details class="dashboardDetails">
      <summary>Safety checks and interaction details</summary>
      <div class="detailsBody">
        <div class="row">
          <div class="col">
            <div class="tagline"><strong>Stronger drug interaction intelligence</strong><br>These combinations deserve closer review because they can increase side effects, lab needs, or adherence burden.</div>
            <div style="height:10px"></div>
            ${interactions.length ? interactions.map(x=>`<div class="alertBox ${levelClass(x.level)}"><div class="k">${escapeHtml(x.level)} priority</div><div class="v"><strong>${escapeHtml(x.title)}</strong><br>${escapeHtml(x.note)}<br><span class="fineprint">${escapeHtml(x.action)}</span></div></div>`).join('<div style="height:10px"></div>') : '<div class="fineprint">No interaction alerts triggered from your current entries.</div>'}
          </div>
          <div class="col">
            <div class="tagline"><strong>Contraindications & cautions</strong><br>GeneoRx flags safety questions that are worth discussing with your clinician.</div>
            <div style="height:10px"></div>
            ${contraindications.length ? contraindications.map(x=>`<div class="alertBox ${levelClass(x.level)}"><div class="k">${escapeHtml(x.level)} priority</div><div class="v"><strong>${escapeHtml(x.title)}</strong><br>${escapeHtml(x.note)}<br><span class="fineprint">${escapeHtml(x.action)}</span></div></div>`).join('<div style="height:10px"></div>') : '<div class="fineprint">No contraindication alerts triggered from your current entries.</div>'}
          </div>
        </div>
      </div>
    </details>
  `;
  mainEl.appendChild(sSafety);
  const planSupps = state.plan.recommendedSupplements?.length ? state.plan.recommendedSupplements : rec.map(x=>x.supplement);
  const routine = buildRoutineFromSupplements(planSupps);

  const sRoutine = document.createElement("div");
  sRoutine.className = "section";
  sRoutine.innerHTML = `
    <details class="dashboardDetails">
      <summary>My Routine schedule</summary>
      <div class="detailsBody">
        <div class="tagline"><strong>My Routine</strong><br>Simple schedule to keep adherence easy.</div>
        <div style="height:10px"></div>
        <div class="list">
          <div class="item"><div class="k">Morning</div><div class="v">${routine.morning.length ? routine.morning.map(x=>`• ${escapeHtml(x)}`).join("<br>") : " "}</div></div>
          <div class="item"><div class="k">Midday</div><div class="v">${routine.midday.length ? routine.midday.map(x=>`• ${escapeHtml(x)}`).join("<br>") : " "}</div></div>
          <div class="item"><div class="k">Night</div><div class="v">${routine.night.length ? routine.night.map(x=>`• ${escapeHtml(x)}`).join("<br>") : " "}</div></div>
          <div class="item"><div class="k">Notes</div><div class="v">${routine.notes.length ? routine.notes.map(x=>`• ${escapeHtml(x)}`).join("<br>") : " "}</div></div>
        </div>
      </div>
    </details>
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
        if(!/^PMID:|^PMCID:/i.test(t)) continue;
        seen.add(t);
        cites.push(t);
      }
    }
    const top = cites.slice(0,2);
    if(!top.length) return `<div class="fineprint">Sources: Not loaded yet for this nutrient.</div>`;
    return `<div class="fineprint">Sources:</div><div class="inlineCites">${top.map(x=>renderCitationChip(x)).join("")}</div>`;
  }

  const tierClass = (tier) => tier==="High" ? "tierHigh" : (tier==="Moderate" ? "tierMod" : "tierLow");

  let nutrientHtml = "";
  if(!scores.length){
    nutrientHtml = `
      <div class="emptyState">
        <div class="emptyStateTitle">No nutrient signals yet</div>
        <div class="emptyStateText">Add a medication and symptom to help GeneoRx explain what may be connected.</div>
      </div>
    `;
  } else {
    nutrientHtml = scores.slice(0,10).map(([n,score], idx)=>{
      const label = tierFromScore(score);
      const claimsForNut = evByNut[n] || [];
      const q = claimsForNut.length ? summarizeSourceQuality(claimsForNut) : "Pending";
      const evId = `ev_${idx}`;
      const sourceBadge =
        q==="Pending"
          ? `<div class="sourceBadge pending"><strong>Source quality:</strong> Pending</div>`
          : `<div class="sourceBadge ${badgeClass(q)}"><strong>Source quality:</strong> ${escapeHtml(q)}</div>`;

      return `
        <div class="item">
          <div class="k">${escapeHtml(n)}</div>
          <div class="v"><strong>${escapeHtml(label)}</strong> signal (${score}%)</div>

          <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
            ${sourceBadge}
          </div>

          ${topInlineCites(n)}

          <div class="evrow">
            <div class="fineprint">Transparent evidence details</div>
            <div class="evbtn" data-evbtn="${evId}">Evidence ▾</div>
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
              <span class="tierPill ${tierClass(r.tier)}">Tier: <strong>${escapeHtml(r.tier)}</strong></span>
              <span style="color: var(--text-muted)"> • driven by ${escapeHtml(r.nutrient)} (${r.score}%)</span>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="fineprint" style="margin-top:10px">Educational guidance only. Confirm dosing and labs with clinician.</div>`
    : `
      <div class="emptyState">
        <div class="emptyStateTitle">No routine suggestions yet</div>
        <div class="emptyStateText">GeneoRx will suggest a simple routine after you add enough medication or symptom detail.</div>
      </div>
    `;

  s2.innerHTML = `
    <details class="dashboardDetails" open>
      <summary>Nutrient signals and routine setup</summary>
      <div class="detailsBody">
        <div class="row">
          <div class="col">
            <div class="tagline"><strong>Nutrient signals</strong><br>Text-only nutrient signals with evidence transparency.</div>
            <div style="height:10px"></div>
            <div class="list">${nutrientHtml}</div>
          </div>

          <div class="col">
            <div class="tagline"><strong>Recommended supplements</strong><br>Supplements appear for High, Moderate, and Low tiers.</div>
            <div style="height:10px"></div>
            <div class="item">${supplementsHtml}</div>

            <div class="divider"></div>

            <div class="item">
              <div class="k">Start your routine</div>
              <div class="fineprint">Starting saves the current supplement set so GeneoRx can track outcomes.</div>
              <div style="height:10px"></div>
              <input id="startDate" type="date" />
              <div class="btns">
                <button class="primary" id="startPlanBtn">${state.plan.started ? "Update routine" : "Start routine"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
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
    showToast("Routine saved ✓");
  });

  mainEl.appendChild(navButtons(true,true));
}

/* ===== TAB 5: CHECK-IN ===== */
function renderCheckin(){
  const planSupps = state.plan.recommendedSupplements || [];
  const symptomUniverse = getSymptomUniverse();
  const baseSymptoms = state.symptoms.selected.length ? state.symptoms.selected : symptomUniverse.slice(0,12);

  const last = latestCheckin();
  const defaultAdh = last ? last.adherencePct : 70;
  const defaultWell = last ? last.wellbeing : { energy: state.wellbeingBaseline.energy, mood: state.wellbeingBaseline.mood, sleep: state.wellbeingBaseline.sleep, focus: state.wellbeingBaseline.focus };

  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>Weekly Check-in</strong><br>
      Track symptom improvement + adherence + wellbeing so GeneoRx can show clear progress.
    </div>

    <div style="height:12px"></div>

    <div class="row">
      <div class="col">
        <label>Check-in date</label>
        <input id="ciDate" type="date" />
      </div>
      <div class="col">
        <label>Adherence (approx %)</label>
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
    <details class="dashboardDetails">
      <summary>Supplements taken this week</summary>
      <div class="detailsBody">
        <div class="tagline"><strong>Supplements taken</strong><br>Select what you actually took this week.</div>
        <div class="chips" id="suppChips"></div>
        <div class="btns">
          <button class="ghost" id="suppAll">Select all</button>
          <button class="ghost" id="suppNone">Clear</button>
        </div>
      </div>
    </details>
  `;
  mainEl.appendChild(sSupp);

  const suppChips = sSupp.querySelector("#suppChips");
  let taken = last?.supplementsTaken?.length ? [...last.supplementsTaken] : [];

  function drawSuppChips(){
    suppChips.innerHTML = "";
    if(!planSupps.length){
      suppChips.innerHTML = `<div class="fineprint">No routine supplements saved yet. Start your routine in Insights first.</div>`;
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
    <details class="dashboardDetails">
      <summary>Symptom improvement ratings</summary>
      <div class="detailsBody">
        <div class="tagline"><strong>Symptom improvement</strong><br>Rate each symptom change this week.</div>
        <div class="list" id="symList"></div>
      </div>
    </details>
  `;
  mainEl.appendChild(sSym);

  const symList = sSym.querySelector("#symList");
  const IMPACT = ["Worse","No change","Slightly better","Much better","Not present"];
  const impactValue = { "Worse":-2, "No change":0, "Slightly better":1, "Much better":2, "Not present":0 };

  function symRow(sym, idx){
    const row = document.createElement("div");
    row.className="item";
    row.innerHTML = `
      <div class="k">${escapeHtml(sym)}</div>
      <div class="row">
        <div class="col">
          <label>Change</label>
          <select id="symChange_${idx}">
            ${IMPACT.map(x=>`<option value="${x}">${x}</option>`).join("")}
          </select>
        </div>
        <div class="col">
          <label>Severity now (0–10)</label>
          <input type="number" min="0" max="10" value="5" id="symSev_${idx}" />
        </div>
      </div>
    `;
    return row;
  }

  const symBase = baseSymptoms.slice(0,10);
  symBase.forEach((sym, idx)=> symList.appendChild(symRow(sym, idx)));

  /* wellbeing */
  const sWell = document.createElement("div");
  sWell.className="section";
  sWell.innerHTML = `
    <div class="tagline"><strong>Wellbeing this week</strong><br>These values power the “Health Signal”.</div>
    <div style="height:10px"></div>

    <div class="row">
      <div class="col"><label>Energy (0–10)</label><input id="ciEnergy" type="number" min="0" max="10" value="${escapeHtml(String(defaultWell.energy ?? 5))}" /></div>
      <div class="col"><label>Mood (0–10)</label><input id="ciMood" type="number" min="0" max="10" value="${escapeHtml(String(defaultWell.mood ?? 5))}" /></div>
      <div class="col"><label>Sleep (0–10)</label><input id="ciSleep" type="number" min="0" max="10" value="${escapeHtml(String(defaultWell.sleep ?? 5))}" /></div>
      <div class="col"><label>Focus (0–10)</label><input id="ciFocus" type="number" min="0" max="10" value="${escapeHtml(String(defaultWell.focus ?? 5))}" /></div>
    </div>

    <div style="height:10px"></div>
    <div class="row">
      <div class="col"><label>Side effects (optional)</label><input id="ciSide" placeholder="e.g., nausea, headache, constipation" /></div>
      <div class="col"><label>Notes (optional)</label><input id="ciNotes" placeholder="Stress, travel, diet changes, illness..." /></div>
    </div>
  `;
  mainEl.appendChild(sWell);

  /* save */
  const sSave = document.createElement("div");
  sSave.className="section";
  sSave.innerHTML = `
    <div class="btns">
      <button class="primary" id="ciSave">Save check-in</button>
      <button class="danger" id="ciDeleteLast">Delete last check-in</button>
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

    const wellbeing = {
      energy: clamp(parseInt(document.getElementById("ciEnergy").value || "0", 10), 0, 10),
      mood: clamp(parseInt(document.getElementById("ciMood").value || "0", 10), 0, 10),
      sleep: clamp(parseInt(document.getElementById("ciSleep").value || "0", 10), 0, 10),
      focus: clamp(parseInt(document.getElementById("ciFocus").value || "0", 10), 0, 10),
    };

    const sideEffects = (document.getElementById("ciSide").value || "").split(",").map(s=>s.trim()).filter(Boolean);
    const notes = (document.getElementById("ciNotes").value || "").trim();
    const improvementScore = items.reduce((acc,x)=>acc + (x.changeScore||0), 0);

    state.checkins.push({ dateISO, adherencePct, supplementsTaken:[...taken], wellbeing, symptoms:{items, improvementScore}, sideEffects, notes });
    save();
    showToast("Check-in saved ✓");
    setStep(6);
  });

  sSave.querySelector("#ciDeleteLast").addEventListener("click", ()=>{
    if(!state.checkins.length) return alert("No check-ins to delete.");
    if(!confirm("Delete your most recent check-in? This cannot be undone.")) return;
    state.checkins.pop();
    save(); showToast("Deleted ✓");
  });

  mainEl.appendChild(navButtons(true,true));
}

/* ===== TAB 6: PROGRESS (SNAPSHOT BUTTON LIVES HERE ✅) ===== */
function renderProgress(){
  const last = latestCheckin();
  const base = state.wellbeingBaseline;

  const s1 = document.createElement("div");
  s1.className="section";

  if(!last){
    s1.innerHTML = `
      <div class="emptyState">
        <div class="emptyStateTitle">No progress trend yet</div>
        <div class="emptyStateText">Log your first weekly check-in to see what changed, how your wellbeing moved, and whether your routine is helping.</div>
        <div class="btns"><button class="primary" onclick="setStep(5)">Go to Check-in</button></div>
      </div>
    `;
    mainEl.appendChild(s1);
    mainEl.appendChild(navButtons(true,true));
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
          <div style="font-weight:950">Weekly Health Signal</div>
          <div class="fineprint">This answers: “Is what I’m doing actually helping?”</div>
        </div>
      </div>

      <div style="height:10px"></div>
      <div class="v"><strong>${escapeHtml(coach.headline)}</strong></div>
      <div class="fineprint" style="margin-top:8px">
        ${coach.bullets.map(x=>`• ${escapeHtml(x)}`).join("<br>")}
      </div>

      <div class="divider"></div>

      <div class="btns">
        <!-- ✅ HERE IT IS -->
        <button class="primary" id="btnSnapshot">Preview Doctor Visit Summary</button>
        <button class="ghost" id="btnAnother">Add another check-in</button>
      </div>
    </div>

    <div style="height:14px"></div>

    <div class="list">
      <div class="item">
        <div class="k">What changed (latest check-in)</div>
        <div class="v">
          Most improved: <strong>${escapeHtml(best?.symptom || " ")}</strong> (${escapeHtml(best?.change || " ")})<br>
          Least improved: <strong>${escapeHtml(worst?.symptom || " ")}</strong> (${escapeHtml(worst?.change || " ")})<br>
          Top driver nutrient: <strong>${escapeHtml(topDriver)}</strong>
        </div>
      </div>

      <div class="item">
        <div class="k">Wellbeing change (latest - baseline)</div>
        <div class="v">
          Energy: <strong>${dEnergy>=0?"+":""}${dEnergy}</strong> •
          Mood: <strong>${dMood>=0?"+":""}${dMood}</strong> •
          Sleep: <strong>${dSleep>=0?"+":""}${dSleep}</strong> •
          Focus: <strong>${dFocus>=0?"+":""}${dFocus}</strong>
        </div>
      </div>

      <div class="item">
        <div class="k">Symptom improvement score</div>
        <div class="v"><strong>${symScore}</strong> (sum of symptom change ratings)</div>
      </div>

      <div class="item">
        <div class="k">Adherence</div>
        <div class="v"><strong>${last.adherencePct}%</strong> of recommended supplements taken</div>
      </div>
    </div>
  `;
  mainEl.appendChild(s1);

  document.getElementById("btnSnapshot").addEventListener("click", openSnapshotModal);
  document.getElementById("btnAnother").addEventListener("click", ()=> setStep(5));

  const timeline = document.createElement("div");
  timeline.className = "section";
  const checkinTimeline = state.checkins.map((c,idx)=>`<div class="item"><div class="k">Check-in ${idx+1} • ${escapeHtml(fmtDate(c.dateISO))}</div><div class="v">Adherence <strong>${c.adherencePct}%</strong>${c.symptoms?.items?.length ? `<br>Symptoms tracked: ${escapeHtml(c.symptoms.items.map(x=>x.symptom).join(', '))}` : ''}</div></div>`).join('');
  timeline.innerHTML = `
    <div class="tagline"><strong>Symptom timeline</strong><br>See how your check-ins build a story over time.</div>
    <div style="height:10px"></div>
    <div class="list">${checkinTimeline || '<div class="fineprint">No timeline yet.</div>'}</div>
    <div class="btns"><button class="primary" id="btnExportReport">Download doctor report</button></div>
  `;
  mainEl.appendChild(timeline);
  document.getElementById("btnExportReport").addEventListener("click", ()=>{ downloadDoctorReport(); showToast("Doctor report downloaded"); });

  mainEl.appendChild(navButtons(true,true));
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
  const cov = evidenceCoverage();

  // ── Build per-medication evidence groups ─────────────────────────────────
  const medGroups = state.meds.map(mi => {
    const med = MED_DB.find(x => x.id === mi.medId);
    if(!med) return null;
    const claims = med.claims || [];
    return { med, claims };
  }).filter(Boolean);

  // Meds with evidence first, then meds without (pending)
  medGroups.sort((a, b) => b.claims.length - a.claims.length);

  let medsHtml = "";
  for(const { med, claims } of medGroups){
    const claimsHtml = claims.length
      ? claims.map(cl => {
          const cites = (cl.citations||[])
            .map(id => renderCitationChip(String(id||"").trim()))
            .join("");
          return `
            <div style="display:flex; align-items:center; gap:12px; padding:6px 0; flex-wrap:wrap; border-top:1px solid var(--border-soft);">
              <div style="min-width:130px; font-size:13px; color:var(--text-muted); font-weight:500;">${escapeHtml(cl.nutrient)}</div>
              <div class="inlineCites" style="margin:0;">${cites || '<span class="fineprint">No citations attached.</span>'}</div>
            </div>
          `;
        }).join("")
      : `<div style="padding:6px 0; border-top:1px solid var(--border-soft);"><span class="fineprint">Pending  no published evidence mapped yet for this medication.</span></div>`;

    medsHtml += `
      <div style="margin-bottom:18px;">
        <div style="font-weight:700; font-size:13.5px; color:var(--accent); margin-bottom:2px;">${escapeHtml(med.name)}</div>
        ${claimsHtml}
      </div>
    `;
  }

  const s1 = document.createElement("div");
  s1.className = "section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>Evidence</strong><br>
      Citations for all medications in the database. Click any link to open the source.
      <div class="fineprint" style="margin-top:8px">Coverage for your selection: <strong>${cov.evidenceCount}/${cov.selectedCount}</strong> medications with cited evidence</div>
    </div>
    <div class="divider"></div>
    ${medsHtml || '<div class="fineprint">Add medications to see their evidence citations here.</div>'}
  `;
  mainEl.appendChild(s1);
  mainEl.appendChild(navButtons(true, true));
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
  const healthStory = generateDynamicHealthStory();

  const sStory = document.createElement("div");
  sStory.className = "section";
  sStory.innerHTML = `
    <div class="tagline"><strong>Your GeneoRx Health Story</strong><br>GeneoRx reviews your medications, symptoms, and timeline to identify patterns that may help explain how your body is responding.</div>
    <div style="height:10px"></div>
    <div class="item">
      <div class="k">A clear explanation of what GeneoRx thinks may be happening in your body</div>
      <div class="v" style="line-height:1.7">${escapeHtml(healthStory)}</div>
    </div>
    <div class="btns">
      <button class="primary" id="summarySnapshotBtn">Preview Doctor Visit Summary</button>
      <button class="ghost" id="summaryInsightBtn">Open GeneoRx Insight</button>
    </div>
  `;
  mainEl.appendChild(sStory);
  sStory.querySelector("#summarySnapshotBtn").addEventListener("click", openSnapshotModal);
  sStory.querySelector("#summaryInsightBtn").addEventListener("click", openInsightModal);

  const s1 = document.createElement("div");
  s1.className = "section";
  s1.innerHTML = `
    <details class="dashboardDetails">
      <summary>Full doctor summary details</summary>
      <div class="detailsBody">
        <div class="tagline"><strong>Doctor summary</strong><br>Your overall dashboard view before you share with a clinician.</div>
        <div style="height:10px"></div>
        <div class="list">
          <div class="item"><div class="k">Account</div><div class="v">${escapeHtml(state.account.email || AUTHENTICATED_USER)} • Consent: ${state.account.consent ? "Yes" : "No"}</div></div>
          <div class="item"><div class="k">Medications</div><div class="v">${meds.length ? escapeHtml(meds.join(", ")) : "Add your first medication so GeneoRx can look for nutrient signals."}</div></div>
          <div class="item"><div class="k">Symptoms</div><div class="v">${state.symptoms.selected.length ? escapeHtml(state.symptoms.selected.join(", ")) : "No symptoms selected."}</div></div>
          <div class="item"><div class="k">Safety flags</div><div class="v">${flags.length ? escapeHtml(flags.join(", ")) : "None"}</div></div>
          <div class="item"><div class="k">Medication success prediction</div><div class="v"><strong>${success.score}%</strong> • ${escapeHtml(success.level)}<br>${escapeHtml(success.reason)}</div></div>
          <div class="item"><div class="k">Detected pattern</div><div class="v">${patterns.length ? `<strong>${escapeHtml(patterns[0].title)}</strong><br>${escapeHtml(patterns[0].note)}` : "No strong pattern detected yet."}</div></div>
          <div class="item"><div class="k">Drug interactions</div><div class="v">${interactions.length ? escapeHtml(interactions.map(x=>x.title).join(", ")) : "No interaction alerts triggered."}</div></div>
          <div class="item"><div class="k">Contraindications & cautions</div><div class="v">${contraindications.length ? escapeHtml(contraindications.map(x=>x.title).join(", ")) : "No contraindication alerts triggered."}</div></div>
          <div class="item"><div class="k">GeneoRx Insight summary</div><div class="v"><strong>${escapeHtml(insight.summary)}</strong><br>${escapeHtml(insight.meaning)}</div></div>
          <div class="item"><div class="k">Latest check-in</div><div class="v">${last ? `${fmtDate(last.dateISO)} • Adherence ${last.adherencePct}%` : "No check-ins yet. Log your first weekly check-in to unlock your Health Signal."}</div></div>
        </div>
      </div>
    </details>
  `;
  mainEl.appendChild(s1);
  mainEl.appendChild(navButtons(true,true));
}

/* ===== TAB 9: FEEDBACK ===== */
function renderFeedback(){
  const s1 = document.createElement("div");
  s1.className="section";
  s1.innerHTML = `
    <div class="tagline">
      <strong>Your feedback is valuable</strong><br>
      Send questions or improvement ideas to GeneoRx.
    </div>

    <div style="height:12px"></div>

    <div class="row">
      <div class="col">
        <label>Feedback type</label>
        <select id="fbType">
          <option value="Bug">Bug / something not working</option>
          <option value="Suggestion">Suggestion / improvement</option>
          <option value="Question">Question</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="col">
        <label>Can we contact you?</label>
        <select id="fbContact">
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
    </div>

    <div style="height:12px"></div>
    <label>Message</label>
    <textarea id="fbMsg" placeholder="Tell us what you liked, what was confusing, and what you want next..."></textarea>

    <div class="btns">
      <button class="primary" id="fbSend">Send email to info@geneorx.com</button>
    </div>
  `;
  mainEl.appendChild(s1);

  s1.querySelector("#fbSend").addEventListener("click", ()=>{
    const type = s1.querySelector("#fbType").value;
    const canContact = s1.querySelector("#fbContact").value === "yes";
    const message = (s1.querySelector("#fbMsg").value || "").trim();
    const email = state.account.email || "anonymous";
    state.feedback.push({ dateISO: new Date().toISOString(), type, message, canContact, email });
    save(); showToast("Saved ✓");

    const subj = encodeURIComponent(`GeneoRx Portal Feedback (${type})`);
    const body = encodeURIComponent(
      `Type: ${type}\nFrom: ${email}\nCan we contact you?: ${canContact ? "Yes" : "No"}\n\nMessage:\n${message}\n`
    );
    window.location.href = `mailto:info@geneorx.com?subject=${subj}&body=${body}`;
  });

  mainEl.appendChild(navButtons(true,false,""));
}

/* =========================================================
   ===== MAIN RENDER SWITCH =====
   ========================================================= */
function renderMain(){
  mainEl.innerHTML = "";
  mainTitle.textContent = STEP_LABELS[state.step];

  const subMap = {
    "Account":"Confirm your profile basics and safety flags.",
    "Medications":"Add the medications you want GeneoRx to review.",
    "Symptoms":"Select what you are feeling now.",
    "Wellbeing":"Set a simple baseline for progress tracking.",
    "Insights":"Review possible medication, symptom, and nutrient links.",
    "Check-in":"Log weekly changes so GeneoRx can spot trends.",
    "Progress":"See your Health Signal over time.",
    "Sources":"Review the evidence referenced in this session.",
    "Doctor summary":"Prepare a clear summary for your clinician.",
    "Feedback":"Send questions and feedback to GeneoRx."
  };
  const guidedNext =
    state.meds.length===0 && !state.symptomOnlyMode ? "Add medications"
    : state.symptoms.selected.length===0 ? "Select symptoms"
    : !state.plan.started ? "Start your routine"
    : state.checkins.length===0 ? "Log first check-in"
    : "Review progress";
  mainSub.textContent = `Step ${state.step + 1} of ${STEP_LABELS.length} • Next best action: ${guidedNext} • ${subMap[STEP_LABELS[state.step]] || ""}`;

  if(state.step===0) return renderAccount();
  if(state.step===1) return renderMeds();
  if(state.step===2) return renderSymptoms();
  if(state.step===3) return renderWellbeing();
  if(state.step===4) return renderResults();
  if(state.step===5) return renderCheckin();
  if(state.step===6) return renderProgress();
  if(state.step===7) return renderCitations();
  if(state.step===8) return renderSummaryTab();
  if(state.step===9) return renderFeedback();
}

function renderAll(){
  setupSummaryToggle();
  renderSteps();
  renderPills();
  renderSummaryTop();
  renderSide();
  renderContactBox();
  renderMain();
}

// Load user profile from backend first, then render
if (IS_GUEST) {
  renderAll();
} else {
  loadFromBackend().then(() => renderAll()).catch(() => renderAll());
}
</script>