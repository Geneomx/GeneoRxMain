
   <script>
/* =========================================================
   ===== AUTH USER =====
   ========================================================= */
const AUTHENTICATED_USER = "{{ Auth::check() ? Auth::user()->name : 'Guest' }}";

/* =========================================================
   ===== DATA =====
   ========================================================= */
const MED_DB = [
  { id:"metformin", name:"Metformin", symptomChips:["Fatigue","Tingling hands/feet","Brain fog","Low mood","GI discomfort"],
    claims:[{ nutrient:"Vitamin B12", source_quality:"High", citations:["PMID:26900641"],
      notes:["Long-term metformin is associated with B12 deficiency risk; consider monitoring if symptoms present."]}]},

  { id:"atorvastatin", name:"Atorvastatin (statin)", symptomChips:["Muscle aches","Fatigue","Brain fog","Sleep changes"],
    claims:[{ nutrient:"CoQ10", source_quality:"Moderate", citations:["PMID:26192349"],
      notes:["Statins are associated with lower CoQ10 levels; symptom benefit from supplementation varies."]}]},

  { id:"omeprazole", name:"Omeprazole (PPI)", symptomChips:["GI discomfort","Fatigue","Dizziness","Muscle cramps","Brain fog"],
    claims:[
      { nutrient:"Magnesium", source_quality:"High", citations:["PMID:22392879"],
        notes:["Long-term PPI use has a hypomagnesemia safety signal; consider Mg evaluation if symptomatic."]},
      { nutrient:"Vitamin B12", source_quality:"Moderate", citations:["PMCID:PMC4110863"],
        notes:["Association depends on duration and population; labs help clarify."]},
    ]},

  /* GLP-1s */
  { id:"semaglutide", name:"Semaglutide (GLP-1)", symptomChips:["GI discomfort","Nausea","Constipation","Fatigue"], claims:[] },
  { id:"tirzepatide", name:"Tirzepatide (GIP/GLP-1)", symptomChips:["GI discomfort","Nausea","Constipation","Fatigue"], claims:[] },
  { id:"liraglutide", name:"Liraglutide (GLP-1)", symptomChips:["GI discomfort","Nausea","Constipation","Fatigue"], claims:[] },
  { id:"dulaglutide", name:"Dulaglutide (GLP-1)", symptomChips:["GI discomfort","Nausea","Constipation","Fatigue"], claims:[] },

  /* Common meds (you can expand this list to 25+ easily) */
  { id:"lisinopril", name:"Lisinopril (ACE inhibitor)", symptomChips:["Dizziness","Fatigue"], claims:[] },
  { id:"losartan", name:"Losartan (ARB)", symptomChips:["Dizziness","Fatigue"], claims:[] },
  { id:"amlodipine", name:"Amlodipine (CCB)", symptomChips:["Swelling","Dizziness","Fatigue"], claims:[] },
  { id:"metoprolol", name:"Metoprolol (beta blocker)", symptomChips:["Fatigue","Dizziness","Low energy"], claims:[] },
];

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
  feedback: []
});
let state = load();

function save(){ 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); 
  saveToBackend(); 
  renderAll(); 
}

function load(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : defaultState(); }
  catch(e){ return defaultState(); }
}

async function loadFromBackend() {
  try {
    const response = await fetch('/api/profile');
    if(!response.ok) return;
    
    const data = await response.json();
    if(data.profile) {
      state.profile = { 
        age: data.profile.age || "", 
        gender: data.profile.gender || "",
        pregnant: data.profile.pregnant || false,
        kidneyDisease: data.profile.kidneyDisease || false,
        anticoagulants: data.profile.anticoagulants || false
      };
    }
    if(data.account) {
      state.account.email = data.account.email || "";
      state.account.consent = data.account.consent || false;
    }
    if(data.medications && Array.isArray(data.medications)) {
      state.meds = data.medications;
    }
    if(data.symptoms && Array.isArray(data.symptoms)) {
      state.symptoms.selected = data.symptoms.map(s => s.name);
    }
    if(data.checkins && Array.isArray(data.checkins)) {
      state.checkins = data.checkins;
    }
    renderAll();
  } catch(e) {
    console.log('Backend profile load (optional):', e.message);
  }
}

async function saveToBackend() {
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
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
      })
    });
    if(!response.ok) {
      console.log('Backend save response:', response.status);
    }
  } catch(e) {
    console.log('Backend save error (optional):', e.message);
  }
}

function resetDemo(){
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
    <div class="fineprint">Citations (click to open):</div>
    <div class="citeList">${citeHtml || `<div class="fineprint">No citations attached yet.</div>`}</div>
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
    ? "Your current inputs suggest a better chance of staying consistent with this plan."
    : score >= 50
      ? "Your plan may work, but symptoms, complexity, or follow-through could reduce success."
      : "Your current symptom burden or safety complexity may make long-term success harder without closer support.";
  return { score, level, reason };
}

function detectHealthPatterns(){
  const ids = state.meds.map(m=>m.medId);
  const syms = state.symptoms.selected || [];
  const patterns = [];
  if(ids.includes('metformin') && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Tingling hands/feet'))){
    patterns.push({ title:'Metformin + B12 pattern', confidence:'High', note:'This combination of medication and symptoms can overlap with a B12-related pattern.' });
  }
  if(ids.includes('omeprazole') && (syms.includes('Muscle cramps') || syms.includes('Dizziness') || syms.includes('Fatigue'))){
    patterns.push({ title:'PPI + magnesium pattern', confidence:'Moderate', note:'Long-term acid suppression with these symptoms can overlap with a magnesium-related pattern.' });
  }
  if(ids.includes('atorvastatin') && (syms.includes('Muscle aches') || syms.includes('Fatigue'))){
    patterns.push({ title:'Statin tolerance pattern', confidence:'Moderate', note:'These symptoms can overlap with statin tolerance issues and possible CoQ10-related symptom patterns.' });
  }
  if(state.symptomOnlyMode && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Poor focus'))){
    patterns.push({ title:'Symptom-only B-vitamin support pattern', confidence:'Moderate', note:'Even without medications, this symptom cluster may overlap with B-vitamin support needs.' });
  }
  if(state.symptomOnlyMode && (syms.includes('Muscle cramps') || syms.includes('Sleep changes') || syms.includes('Anxiety'))){
    patterns.push({ title:'Symptom-only magnesium support pattern', confidence:'Moderate', note:'Even without medications, this symptom cluster may overlap with magnesium support needs.' });
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
      ? 'Based on your check-ins so far, GeneoRx is starting to identify repeat symptom patterns over time.'
      : 'Population-style insights will become stronger once you log check-ins over time.'
  };
}

function downloadDoctorReport(){
  const snapshot = buildClinicianSnapshotText();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>GeneoRx Doctor Report</title><style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.45;color:#111}pre{white-space:pre-wrap;font-family:Menlo,monospace;font-size:12px;border:1px solid #ddd;border-radius:12px;padding:16px;background:#fafafa}</style></head><body><h1>GeneoRx Doctor Report</h1><pre>${snapshot.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</pre></body></html>`;
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

  if(hasB12) routine.morning.push("Methyl B12 — morning (often energizing)");
  if(hasD) routine.morning.push("Vitamin D3 — with a meal that includes fat");
  if(hasCoq10) routine.midday.push("CoQ10 — with lunch (with food)");
  if(hasMg) routine.night.push("Magnesium glycinate — evening/night (often calming)");

  routine.notes.push("If nausea occurs, take supplements with food and reduce dose temporarily.");
  routine.notes.push("Avoid stacking new supplements all at once—phase in over 3–7 days.");
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
  const topDriver = scores.length ? `${scores[0][0]} (${scores[0][1]}%)` : "—";

  if(!last){
    return {
      headline: "Your coach is ready.",
      bullets: [
        "Add medications + symptoms to personalize results.",
        "Start your plan to track real improvement over time.",
        "Log a weekly check-in to generate your Health Signal."
      ],
      nextBestAction: "Go to Results → Start plan."
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
  else if(dE > 0 || dS > 0) next = "Nice trend—keep the same plan for one more week to confirm the signal.";

  const bullets = [
    `Wellbeing deltas: Energy ${dE>=0?"+":""}${dE}, Mood ${dM>=0?"+":""}${dM}, Sleep ${dS>=0?"+":""}${dS}, Focus ${dF>=0?"+":""}${dF}.`,
    `Most improved symptom: ${best?.symptom ? `${best.symptom} (${best.change})` : "—"}.`,
    `Least improved symptom: ${worst?.symptom ? `${worst.symptom} (${worst.change})` : "—"}.`,
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
  const adh = last ? `${last.adherencePct}%` : "—";
  const labs = uniq(scores.slice(0,5).flatMap(([n]) => LAB_SUGGESTIONS[n] || [])).slice(0,8);
  const symptoms = state.symptoms.selected.length ? state.symptoms.selected.join(", ") : "None selected";
  const lastDate = last ? fmtDate(last.dateISO) : "—";

  return [
    "GENEORX — YOUR DOCTOR VISIT SNAPSHOT",
    "===================================",
    "",
    `Patient: ${state.account.email || "Anonymous"}   Age: ${state.profile.age || "—"}   Gender: ${state.profile.gender || "—"}`,
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
    labs.length ? labs.map(x=>`- ${x}`).join("\n") : "- —",
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
  downloadJson("geneorx_review_packet.json", { meta:{createdISO:new Date().toISOString()}, state });
  showToast("Link copied + packet exported ✓");
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
  showToast("Copied ✓");
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
      if(idx < i) {
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
const STEP_LABELS = ["Account","Medications","Symptoms","Wellbeing","Results","Check-in","Progress","Citations","Summary","Feedback"];

function setStep(n){
  state.step = clamp(n, 0, STEP_LABELS.length-1);
  save();
}

function renderSteps(){
  const colors = ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10"];
  stepsEl.innerHTML = "";
  STEP_LABELS.forEach((lbl,i)=>{
    const s = document.createElement("div");
    s.className = `step ${colors[i]} ${i===state.step ? "on":""}`;
    s.textContent = lbl;
    s.addEventListener("click", ()=> setStep(i));
    stepsEl.appendChild(s);
  });
}

function renderPills(){
  // Only update pillUser if user entered an email in the form, otherwise show authenticated user
  const displayName = state.account.email || AUTHENTICATED_USER;
  pillUser.textContent = displayName;
  pillPlan.textContent = state.plan.started ? `Started ${fmtDate(state.plan.startDate)}` : "Not started";
  pillChecks.textContent = String(state.checkins.length);
}

function renderContactBox(){
  contactBox.innerHTML = `
    <div class="k">Your feedback is valuable</div>
    <div class="v">
      Found something confusing? Want to suggest an improvement?
      Email us at <a class="mailto" href="mailto:info@geneorx.com">info@geneorx.com</a>.
    </div>
    <div class="fineprint" style="margin-top:10px">
      Pro tip: “Share for review” exports a review packet JSON.
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
    : !state.plan.started ? "Review Results"
    : "Log a Check-in";

  summaryTop.innerHTML = `
    <div class="tagline">
      <strong>Quick status</strong><br>
      Age: <strong>${escapeHtml(state.profile.age||"—")}</strong> • Gender: <strong>${escapeHtml(state.profile.gender||"—")}</strong><br>
      Medications: <strong>${medsCount}</strong> • Symptoms: <strong>${symCount}</strong> • Evidence: <strong>${cov.evidenceCount}/${cov.selectedCount}</strong><br>
      <div class="fineprint" style="margin-top:8px">Safety flags: <strong>${escapeHtml(flags.length?flags.join(", "):"None")}</strong></div>
      <div class="fineprint" style="margin-top:8px">Next suggested step: <strong>${escapeHtml(next)}</strong></div>
      <div class="quickActions">
        <button class="qaBtn ghost" data-go="0">Account</button>
        <button class="qaBtn ghost" data-go="1">Medications</button>
        <button class="qaBtn ghost" data-go="2">Symptoms</button>
        <button class="qaBtn ghost" data-go="4">Results</button>
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
  const lastLine = last ? `Latest: ${fmtDate(last.dateISO)} • Adherence ${last.adherencePct}%` : "No check-ins yet.";
  const flags = safetyFlags();

  const blocks = [
    {k:"Account", v: `${state.account.email || AUTHENTICATED_USER} • Consent: ${state.account.consent ? "Yes" : "No"}`},
    {k:"Age / Gender", v: `${state.profile.age || "—"} / ${state.profile.gender || "—"}`},
    {k:"Safety flags", v: flags.length ? flags.join(", ") : "None"},
    {k:"Medications", v: meds.length ? meds.join(", ") : "None yet."},
    {k:"Symptoms selected", v: state.symptoms.selected.length ? state.symptoms.selected.join(", ") : "None yet."},
    {k:"Baseline wellbeing", v: `Energy ${state.wellbeingBaseline.energy}/10 • Mood ${state.wellbeingBaseline.mood}/10 • Sleep ${state.wellbeingBaseline.sleep}/10 • Focus ${state.wellbeingBaseline.focus}/10`},
    {k:"Plan", v: state.plan.started ? `Started ${fmtDate(state.plan.startDate)}` : "Not started yet."},
    {k:"Supplements", v: state.plan.recommendedSupplements.length ? state.plan.recommendedSupplements.join(", ") : "No active plan supplements."},
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

function navButtons(prev=true,next=true,nextLabel="Continue"){
  const wrap = document.createElement("div");
  wrap.className = "btns";
  if(prev){
    const b = document.createElement("button");
    b.textContent = "Back";
    b.className = "ghost";
    b.addEventListener("click", ()=> setStep(state.step-1));
    wrap.appendChild(b);
  }
  if(next){
    const b = document.createElement("button");
    b.textContent = nextLabel;
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
      <strong>Welcome</strong> — personalized guidance based on medications, symptoms, and outcomes.
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
        <div class="fineprint">These trigger extra safety notes on Results.</div>
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
      Your data is automatically saved to your account.
    </div>
  `;

  function commit(){
    state.account.email = s1.querySelector("#email").value.trim();
    state.account.consent = s1.querySelector("#consent").value==="yes";
    const ageVal = parseInt(s1.querySelector("#age").value || "", 10);
    state.profile.age = Number.isFinite(ageVal) ? String(ageVal) : "";
    state.profile.gender = s1.querySelector("#gender").value || "";
    state.profile.pregnant = s1.querySelector("#preg").value==="yes";
    state.profile.kidneyDisease = s1.querySelector("#kidneyChip").getAttribute("aria-pressed") === "true";
    state.profile.anticoagulants = s1.querySelector("#antiChip").getAttribute("aria-pressed") === "true";
    save();
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
    el.addEventListener(ev, commit);
    el.addEventListener("blur", commit);
  });

  s1.querySelector("#kidneyChip").addEventListener("click", ()=>{
    state.profile.kidneyDisease = !state.profile.kidneyDisease; save(); showToast("Saved ✓");
  });
  s1.querySelector("#antiChip").addEventListener("click", ()=>{
    state.profile.anticoagulants = !state.profile.anticoagulants; save(); showToast("Saved ✓");
  });

  mainEl.appendChild(s1);
  mainEl.appendChild(navButtons(false,true,"Continue"));
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
      medList.innerHTML = `<div class="fineprint">No medications added yet.</div>`;
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

  const nav = navButtons(true,true,"Continue");
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

  const nav = navButtons(true,true,"Continue");
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

  const nav = navButtons(true,true,"Continue");
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
          <div style="font-weight:950">AI Coach</div>
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
      <strong>Your Results</strong><br>
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
  const topSignal = scores.length ? { nutrient: scores[0][0], score: scores[0][1], tier: tierFromScore(scores[0][1]) } : null;
  const recentSymptoms = state.symptoms.selected.length ? state.symptoms.selected.slice(0,6) : [];
  const symptomText = recentSymptoms.length ? recentSymptoms.join(', ') : 'no symptoms selected yet';
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
        <div class="tagline"><strong>Why might I feel this way?</strong><br>GeneoRx explains likely drivers from your medications, symptoms, and nutrient signals.</div>
        <div style="height:10px"></div>
        <div class="item">
          <div class="k">Likely explanation</div>
          <div class="v">${escapeHtml(whyReason)}</div>
        </div>
        <div class="item">
          <div class="k">Current inputs</div>
          <div class="v">Symptoms: <strong>${escapeHtml(symptomText)}</strong>${topSignal ? `<br>Top signal: <strong>${escapeHtml(topSignal.nutrient)}</strong> (${topSignal.score}% • ${escapeHtml(topSignal.tier)})` : ''}</div>
        </div>
      </div>
      <div class="col">
        <div class="tagline"><strong>What should I discuss with my doctor?</strong><br>Bring these points to your next visit so the conversation is focused and useful.</div>
        <div style="height:10px"></div>
        <div class="list">${doctorTopics.length ? doctorTopics.map((x,i) => `<div class="item"><div class="k">Topic ${i+1}</div><div class="v">${escapeHtml(x)}</div></div>`).join('') : `<div class="fineprint">Add symptoms, medications, or safety flags to generate clinician discussion prompts.</div>`}</div>
      </div>
    </div>`;
  mainEl.appendChild(sCore);

  const sAction = document.createElement("div");
  sAction.className="section";
  sAction.innerHTML = `
    <div class="tagline"><strong>What should I do today?</strong><br>GeneoRx turns your inputs into a simple daily action plan.</div>
    <div style="height:10px"></div>
    <div class="list">
      <div class="item"><div class="k">1. Start with one action</div><div class="v">${topSignal ? `Focus on your <strong>${escapeHtml(topSignal.nutrient)}</strong> signal first instead of trying to change everything at once.` : `Log more symptoms or medications so GeneoRx can personalize your plan.`}</div></div>
      <div class="item"><div class="k">2. Follow your routine</div><div class="v">Use the Morning / Midday / Night routine below and keep it simple enough to repeat daily.</div></div>
      <div class="item"><div class="k">3. Track what changes</div><div class="v">Use weekly check-ins to watch energy, mood, sleep, focus, and your main symptoms over time.</div></div>
      <div class="item"><div class="k">4. Prepare for your clinician</div><div class="v">Use Your doctor visit Snapshot to bring a clean summary of symptoms, risks, and possible labs.</div></div>
    </div>`;
  mainEl.appendChild(sAction);

  const sInsightBtn = document.createElement("div");
  sInsightBtn.className = "section";
  sInsightBtn.innerHTML = `
    <div class="tagline"><strong>GeneoRx Insight</strong><br>Your AI-style summary is available in a focused popup so the Results tab stays clean.</div>
    <div class="btns"><button class="primary" id="openInsightBtn">Reveal My GeneoRx Insight</button></div>
  `;
  mainEl.appendChild(sInsightBtn);
  sInsightBtn.querySelector("#openInsightBtn").addEventListener("click", openInsightModal);

  const success = computeMedicationSuccessPrediction();
  const patterns = detectHealthPatterns();
  const population = computePopulationInsights();

  const sAdvanced = document.createElement("div");
  sAdvanced.className = "section";
  sAdvanced.innerHTML = `
    <div class="metricGrid">
      <div class="metricCard"><div class="k">Medication success prediction</div><div class="v"><strong>${success.score}%</strong> • ${escapeHtml(success.level)}<br>${escapeHtml(success.reason)}</div></div>
      <div class="metricCard"><div class="k">Pattern detection</div><div class="v">${patterns.length ? `<strong>${escapeHtml(patterns[0].title)}</strong><br>${escapeHtml(patterns[0].note)}` : 'No strong pattern detected yet.'}</div></div>
      <div class="metricCard"><div class="k">Population insights</div><div class="v">${escapeHtml(population.message)}<br>${population.trackedSymptoms.length ? `Frequently tracked: <strong>${escapeHtml(population.trackedSymptoms.join(', '))}</strong>` : 'Track more check-ins to unlock trends.'}</div></div>
    </div>
  `;
  mainEl.appendChild(sAdvanced);

  const sSafety = document.createElement("div");
  sSafety.className = "section";
  sSafety.innerHTML = `
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
  `;
  mainEl.appendChild(sSafety);
  const planSupps = state.plan.recommendedSupplements?.length ? state.plan.recommendedSupplements : rec.map(x=>x.supplement);
  const routine = buildRoutineFromSupplements(planSupps);

  const sRoutine = document.createElement("div");
  sRoutine.className = "section";
  sRoutine.innerHTML = `
    <div class="tagline"><strong>My Routine</strong><br>Simple schedule to keep adherence easy.</div>
    <div style="height:10px"></div>

    <div class="list">
      <div class="item"><div class="k">Morning</div><div class="v">${routine.morning.length ? routine.morning.map(x=>`• ${escapeHtml(x)}`).join("<br>") : "—"}</div></div>
      <div class="item"><div class="k">Midday</div><div class="v">${routine.midday.length ? routine.midday.map(x=>`• ${escapeHtml(x)}`).join("<br>") : "—"}</div></div>
      <div class="item"><div class="k">Night</div><div class="v">${routine.night.length ? routine.night.map(x=>`• ${escapeHtml(x)}`).join("<br>") : "—"}</div></div>
      <div class="item"><div class="k">Notes</div><div class="v">${routine.notes.length ? routine.notes.map(x=>`• ${escapeHtml(x)}`).join("<br>") : "—"}</div></div>
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
        if(!/^PMID:|^PMCID:/i.test(t)) continue;
        seen.add(t);
        cites.push(t);
      }
    }
    const top = cites.slice(0,2);
    if(!top.length) return `<div class="fineprint">Citations: Not loaded yet for this nutrient.</div>`;
    return `<div class="fineprint">Citations:</div><div class="inlineCites">${top.map(x=>renderCitationChip(x)).join("")}</div>`;
  }

  const tierClass = (tier) => tier==="High" ? "tierHigh" : (tier==="Moderate" ? "tierMod" : "tierLow");

  let nutrientHtml = "";
  if(!scores.length){
    nutrientHtml = `<div class="fineprint">No nutrient signals yet. Add meds and/or symptoms.</div>`;
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
              <span class="tierPill ${tierClass(r.tier)}">Tier: <strong style="color:var(--txt)">${escapeHtml(r.tier)}</strong></span>
              <span style="color: var(--muted)"> • driven by ${escapeHtml(r.nutrient)} (${r.score}%)</span>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="fineprint" style="margin-top:10px">Educational guidance only. Confirm dosing and labs with clinician.</div>`
    : `<div class="fineprint">No suggestions yet. Add medications and/or symptoms.</div>`;

  s2.innerHTML = `
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
          <div class="k">Start your plan</div>
          <div class="fineprint">Starting saves the current supplement set so we can track outcomes.</div>
          <div style="height:10px"></div>
          <input id="startDate" type="date" />
          <div class="btns">
            <button class="primary" id="startPlanBtn">${state.plan.started ? "Update plan" : "Start plan"}</button>
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
    showToast("Plan saved ✓");
  });

  mainEl.appendChild(navButtons(true,true,"Continue"));
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
    <div class="tagline"><strong>Supplements taken</strong><br>Select what you actually took this week.</div>
    <div class="chips" id="suppChips"></div>
    <div class="btns">
      <button class="ghost" id="suppAll">Select all</button>
      <button class="ghost" id="suppNone">Clear</button>
    </div>
  `;
  mainEl.appendChild(sSupp);

  const suppChips = sSupp.querySelector("#suppChips");
  let taken = last?.supplementsTaken?.length ? [...last.supplementsTaken] : [];

  function drawSuppChips(){
    suppChips.innerHTML = "";
    if(!planSupps.length){
      suppChips.innerHTML = `<div class="fineprint">No plan supplements saved yet. Start your plan on Results first.</div>`;
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
    <div class="tagline"><strong>Symptom improvement</strong><br>Rate each symptom change this week.</div>
    <div class="list" id="symList"></div>
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
    state.checkins.pop();
    save(); showToast("Deleted ✓");
  });

  mainEl.appendChild(navButtons(true,true,"Continue"));
}

/* ===== TAB 6: PROGRESS (SNAPSHOT BUTTON LIVES HERE ✅) ===== */
function renderProgress(){
  const last = latestCheckin();
  const base = state.wellbeingBaseline;

  const s1 = document.createElement("div");
  s1.className="section";

  if(!last){
    s1.innerHTML = `
      <div class="tagline"><strong>Progress</strong><br>No check-ins yet. Log your first check-in to see trends.</div>
      <div class="btns"><button class="primary" onclick="setStep(5)">Go to Check-in</button></div>
    `;
    mainEl.appendChild(s1);
    mainEl.appendChild(navButtons(true,true,"Continue"));
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
  const topDriver = scores.length ? `${scores[0][0]} (${scores[0][1]}%)` : "—";
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
        <button class="primary" id="btnSnapshot">Generate Your doctor visit Snapshot</button>
        <button class="ghost" id="btnAnother">Add another check-in</button>
      </div>
    </div>

    <div style="height:14px"></div>

    <div class="list">
      <div class="item">
        <div class="k">What changed (latest check-in)</div>
        <div class="v">
          Most improved: <strong>${escapeHtml(best?.symptom || "—")}</strong> (${escapeHtml(best?.change || "—")})<br>
          Least improved: <strong>${escapeHtml(worst?.symptom || "—")}</strong> (${escapeHtml(worst?.change || "—")})<br>
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
  document.getElementById("btnExportReport").addEventListener("click", ()=>{ downloadDoctorReport(); showToast("Doctor report downloaded ✓"); });

  mainEl.appendChild(navButtons(true,true,"Continue"));
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
      <strong>Citations Registry</strong><br>
      Click PMID/PMCID to open.
      <div class="fineprint" style="margin-top:8px">Coverage: <strong>${cov.evidenceCount}/${cov.selectedCount}</strong></div>
    </div>

    <div class="divider"></div>

    <div class="k">PMID (${reg.pmid.length})</div>
    <div class="inlineCites">${reg.pmid.map(renderCitationChip).join("") || `<div class="fineprint">None yet.</div>`}</div>

    <div class="divider"></div>

    <div class="k">PMCID (${reg.pmcid.length})</div>
    <div class="inlineCites">${reg.pmcid.map(renderCitationChip).join("") || `<div class="fineprint">None yet.</div>`}</div>
  `;
  mainEl.appendChild(s1);
  mainEl.appendChild(navButtons(true,true,"Continue"));
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
    <div class="tagline"><strong>Your GeneoRx Health Story</strong><br>GeneoRx analyzes your medications, symptoms, and timeline to identify patterns that may help explain how your body is responding.</div>
    <div style="height:10px"></div>
    <div class="item">
      <div class="k">A clear explanation of what GeneoRx thinks may be happening in your body</div>
      <div class="v" style="line-height:1.7">${escapeHtml(healthStory)}</div>
    </div>
    <div class="btns">
      <button class="primary" id="summarySnapshotBtn">Generate Your doctor visit Snapshot</button>
      <button class="ghost" id="summaryInsightBtn">Reveal My GeneoRx Insight</button>
    </div>
  `;
  mainEl.appendChild(sStory);
  sStory.querySelector("#summarySnapshotBtn").addEventListener("click", openSnapshotModal);
  sStory.querySelector("#summaryInsightBtn").addEventListener("click", openInsightModal);

  const s1 = document.createElement("div");
  s1.className = "section";
  s1.innerHTML = `
    <div class="tagline"><strong>GeneoRx Summary</strong><br>Your overall dashboard view before you leave the portal.</div>
    <div style="height:10px"></div>
    <div class="list">
      <div class="item"><div class="k">Account</div><div class="v">${escapeHtml(state.account.email || AUTHENTICATED_USER)} • Consent: ${state.account.consent ? "Yes" : "No"}</div></div>
      <div class="item"><div class="k">Medications</div><div class="v">${meds.length ? escapeHtml(meds.join(", ")) : "No medications added."}</div></div>
      <div class="item"><div class="k">Symptoms</div><div class="v">${state.symptoms.selected.length ? escapeHtml(state.symptoms.selected.join(", ")) : "No symptoms selected."}</div></div>
      <div class="item"><div class="k">Safety flags</div><div class="v">${flags.length ? escapeHtml(flags.join(", ")) : "None"}</div></div>
      <div class="item"><div class="k">Medication success prediction</div><div class="v"><strong>${success.score}%</strong> • ${escapeHtml(success.level)}<br>${escapeHtml(success.reason)}</div></div>
      <div class="item"><div class="k">Detected pattern</div><div class="v">${patterns.length ? `<strong>${escapeHtml(patterns[0].title)}</strong><br>${escapeHtml(patterns[0].note)}` : "No strong pattern detected yet."}</div></div>
      <div class="item"><div class="k">Drug interactions</div><div class="v">${interactions.length ? escapeHtml(interactions.map(x=>x.title).join(", ")) : "No interaction alerts triggered."}</div></div>
      <div class="item"><div class="k">Contraindications & cautions</div><div class="v">${contraindications.length ? escapeHtml(contraindications.map(x=>x.title).join(", ")) : "No contraindication alerts triggered."}</div></div>
      <div class="item"><div class="k">GeneoRx Insight summary</div><div class="v"><strong>${escapeHtml(insight.summary)}</strong><br>${escapeHtml(insight.meaning)}</div></div>
      <div class="item"><div class="k">Latest check-in</div><div class="v">${last ? `${fmtDate(last.dateISO)} • Adherence ${last.adherencePct}%` : "No check-ins yet."}</div></div>
    </div>
  `;
  mainEl.appendChild(s1);
  mainEl.appendChild(navButtons(true,true,"Continue"));
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
    "Account":"Set basics + consent + safety flags.",
    "Medications":"Pick from list or search + add a custom medication.",
    "Symptoms":"Pick symptoms and severity.",
    "Wellbeing":"Set baseline for tracking improvement.",
    "Results":"Nutrient signals + recommendations + evidence.",
    "Check-in":"Log symptom improvement + adherence + wellbeing.",
    "Progress":"Weekly health signal + snapshot for clinician.",
    "Citations":"All sources referenced in this session.",
    "Summary":"Your overall GeneoRx dashboard view.",
    "Feedback":"Send questions and feedback to GeneoRx."
  };
  mainSub.textContent = subMap[STEP_LABELS[state.step]] || "";

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
  renderSteps();
  renderPills();
  renderSummaryTop();
  renderSide();
  renderContactBox();
  renderMain();
}

// Load user profile from backend first, then render
loadFromBackend().then(() => renderAll()).catch(() => renderAll());
</script>