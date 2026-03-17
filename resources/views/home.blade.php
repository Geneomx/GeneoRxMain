
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /> 
<meta name="viewport" content="width=device-width, initial-scale=1.0" /> 
<title>GeneoRx | Why Am I Feeling This?</title> 
 
<style> 
  :root{
    --bg0:#070A12;
    --bg1:#0B1022;
    --card:#101935;
    --card2:#111827;
    --stroke:#24325E;
    --txt:#EAF0FF;
    --muted:#A9B4D6;
    --cyan:#28E1FF;
    --violet:#A78BFA;
    --green:#34D399;
    --amber:#FBBF24;
    --shadow:0 18px 55px rgba(0,0,0,.35);
    --radius:18px;
  }
 
  *{box-sizing:border-box}
 
  body{
    margin:0;
    font-family:Arial, Helvetica, sans-serif;
    color:var(--txt);
    background:
      radial-gradient(1200px 700px at 20% -10%, rgba(40,225,255,.10), transparent 60%),
      radial-gradient(900px 600px at 80% 10%, rgba(167,139,250,.10), transparent 55%),
      linear-gradient(180deg, var(--bg0), var(--bg1));
    min-height:100vh;
  }
 
  .wrap{
    max-width:860px;
    margin:0 auto;
    padding:32px 18px 50px;
  }
 
  .hero{
    text-align:center;
    margin-bottom:24px;
  }
 
  .eyebrow{
    display:inline-block;
    padding:8px 12px;
    border-radius:999px;
    border:1px solid rgba(255,255,255,.12);
    background:rgba(15,23,54,.55);
    color:var(--muted);
    font-size:13px;
    margin-bottom:16px;
  }
 
  h1{
    margin:0;
    font-size:40px;
    line-height:1.1;
    letter-spacing:-.5px;
  }
 
  .sub{
    max-width:700px;
    margin:14px auto 0;
    color:var(--muted);
    font-size:18px;
    line-height:1.5;
  }
 
  .trust{
    display:flex;
    justify-content:center;
    gap:10px;
    flex-wrap:wrap;
    margin-top:18px;
  }
 
  .trust span{
    padding:8px 12px;
    border-radius:999px;
    background:rgba(15,23,54,.45);
    border:1px solid rgba(255,255,255,.10);
    color:var(--txt);
    font-size:13px;
  }
 
  .steps{
    display:flex;
    gap:12px;
    justify-content:center;
    flex-wrap:wrap;
    margin:26px 0 24px;
  }
 
  .step{
    min-width:180px;
    padding:14px 16px;
    border-radius:14px;
    background:rgba(15,23,54,.55);
    border:1px solid rgba(255,255,255,.10);
    box-shadow:var(--shadow);
  }
 
  .stepNum{
    font-size:12px;
    color:var(--cyan);
    font-weight:bold;
    text-transform:uppercase;
    letter-spacing:.5px;
    margin-bottom:6px;
  }
 
  .stepText{
    font-size:15px;
    color:var(--txt);
  }
 
  .card{
    max-width:760px;
    margin:0 auto;
    background:linear-gradient(180deg, rgba(16,25,53,.88), rgba(17,24,39,.92));
    border:1px solid var(--stroke);
    border-radius:var(--radius);
    padding:28px;
    box-shadow:var(--shadow);
  }
 
  .card h2{
    margin:0 0 6px 0;
    font-size:24px;
  }
 
  .cardDesc{
    color:var(--muted);
    margin:0 0 24px 0;
    line-height:1.5;
  }
 
  .field{
    text-align:left;
    margin-bottom:18px;
  }
 
  label{
    display:block;
    margin-bottom:8px;
    font-size:14px;
    color:var(--muted);
  }
 
  select{
    width:100%;
    padding:14px 14px;
    border-radius:12px;
    border:1px solid rgba(255,255,255,.14);
    background:rgba(7,10,18,.45);
    color:var(--txt);
    font-size:15px;
    outline:none;
  }
 
  .primaryBtn, .secondaryBtn{
    border:none;
    padding:13px 20px;
    border-radius:12px;
    cursor:pointer;
    font-size:16px;
    font-weight:700;
    transition:.15s ease;
  }
 
  .primaryBtn{
    background:linear-gradient(135deg, rgba(40,225,255,.95), rgba(167,139,250,.90));
    color:#08111f;
    width:100%;
    margin-top:6px;
  }
 
  .primaryBtn:hover,
  .secondaryBtn:hover{
    transform:translateY(-1px);
    filter:brightness(1.04);
  }
 
  .result{
    margin-top:24px;
    background:rgba(7,10,18,.50);
    border:1px solid rgba(255,255,255,.10);
    padding:22px;
    border-radius:16px;
    display:none;
    text-align:left;
  }
 
  .resultHeader{
    display:flex;
    align-items:center;
    gap:10px;
    margin-bottom:10px;
  }
 
  .resultBadge{
    width:34px;
    height:34px;
    border-radius:10px;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(40,225,255,.14);
    border:1px solid rgba(40,225,255,.28);
    font-weight:700;
  }
 
  .resultTitle{
    font-size:22px;
    margin:0;
  }
 
  .resultBlock{
    margin-top:16px;
    padding:14px;
    border-radius:14px;
    background:rgba(15,23,54,.45);
    border:1px solid rgba(255,255,255,.08);
  }
 
  .resultBlock h3{
    margin:0 0 8px 0;
    font-size:15px;
    color:var(--cyan);
  }
 
  .resultBlock p{
    margin:0;
    line-height:1.6;
    color:var(--txt);
  }
 
  .note{
    margin-top:18px;
    color:var(--muted);
    font-size:13px;
    line-height:1.5;
  }
 
  .ctaWrap{
    display:flex;
    gap:12px;
    flex-wrap:wrap;
    margin-top:20px;
  }
 
  .secondaryBtn{
    background:rgba(15,23,54,.55);
    color:var(--txt);
    border:1px solid rgba(255,255,255,.12);
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-width:240px;
  }
 
  .footerMini{
    text-align:center;
    color:var(--muted);
    margin-top:18px;
    font-size:13px;
  }
 
  @media (max-width: 700px){
    h1{font-size:32px}
    .sub{font-size:16px}
    .card{padding:20px}
    .step{min-width:100%}
    .ctaWrap{flex-direction:column}
    .secondaryBtn{width:100%}
  }
</style> 
</head>
<body>
  
<div class="wrap"> 
  <div class="hero">
    <div class="eyebrow">GeneoRx • Trusted Health Companion</div>
    <h1>Why Might I Feel This Way?</h1>
    <p class="sub">
      Understand how medications, symptoms, and nutrient depletion may be connected — in about 60 seconds.
    </p>
 
    <div class="trust">
      <span>Science-based insights</span>
      <span>No account required</span>
      <span>Easy to try</span>
    </div>
  </div>
 
  <div class="steps">
    <div class="step">
      <div class="stepNum">Step 1</div>
      <div class="stepText">Choose medication</div>
    </div>
    <div class="step">
      <div class="stepNum">Step 2</div>
      <div class="stepText">Select symptoms</div>
    </div>
    <div class="step">
      <div class="stepNum">Step 3</div>
      <div class="stepText">Get your GeneoRx insight</div>
    </div>
  </div>
 
  <div class="card">
    <h2>Start your quick check</h2>
    <p class="cardDesc">
      This quick tool helps surface possible medication-symptom and nutrient pattern connections. It is designed for education, not diagnosis.
    </p>
 
    <div class="field">
      <label for="medication">Choose a medication</label>
      <select id="medication">
        <option value="">None / I don't take medications</option>
        <option value="metformin">Metformin</option>
        <option value="statin">Statin</option>
        <option value="ppi">Omeprazole / PPI</option>
        <option value="birthcontrol">Birth Control</option>
        <option value="antidepressant">Antidepressant</option>
      </select>
    </div>
 
    <div class="field">
      <label for="symptom">Choose your main symptom</label>
      <select id="symptom">
        <option value="">Select a symptom</option>
        <option value="fatigue">Fatigue</option>
        <option value="brainfog">Brain Fog</option>
        <option value="musclepain">Muscle Pain</option>
        <option value="dizziness">Dizziness</option>
        <option value="sleep">Sleep Problems</option>
        <option value="digestive">Digestive Issues</option>
      </select>
    </div>
 
    <button class="primaryBtn" onclick="generateInsight()">Check Insight</button>
 
    <div class="result" id="resultBox">
      <div class="resultHeader">
        <div class="resultBadge">✦</div>
        <h2 class="resultTitle">GeneoRx Insight</h2>
      </div>
 
      <div class="resultBlock">
        <h3>What GeneoRx sees</h3>
        <p id="insight"></p>
      </div>
 
      <div class="resultBlock">
        <h3>What this may mean</h3>
        <p id="meaning"></p>
      </div>
 
      <div class="resultBlock">
        <h3>What to discuss with your doctor</h3>
        <p id="doctor"></p>
      </div>
 
      <p class="note">
        <strong>Note:</strong> This is not medical advice. Always discuss persistent symptoms, medication changes, and lab testing with your healthcare provider.
      </p>
 
      <div class="ctaWrap">
        <a href="{{ route('treatments') }}" class="secondaryBtn">
          Explore Your Full GeneoRx Dashboard
        </a>
      </div>
    </div>
  </div>
 
  <div class="footerMini">
    GeneoRx helps users explore medication patterns, symptom connections, and questions to bring to their doctor.
  </div>
</div> 
 
<script> 
  function generateInsight(){
    let med = document.getElementById("medication").value;
    let symptom = document.getElementById("symptom").value;
 
    let insight = "";
    let meaning = "";
    let doctor = "";
 
    if(med === "metformin" && symptom === "fatigue"){
      insight = "Fatigue was selected in a Metformin user.";
      meaning = "In some long-term Metformin users, fatigue may overlap with a possible Vitamin B12 depletion pattern.";
      doctor = "You may want to ask whether Vitamin B12 testing would be appropriate.";
    }
    else if(med === "statin" && symptom === "musclepain"){
      insight = "Muscle discomfort was selected in a statin user.";
      meaning = "Muscle symptoms in statin users can sometimes overlap with tolerance issues and possible CoQ10-related patterns.";
      doctor = "Discuss muscle symptoms, timing, and whether CoQ10 support should be considered.";
    }
    else if(med === "ppi" && symptom === "fatigue"){
      insight = "Fatigue was selected in a proton pump inhibitor user.";
      meaning = "Long-term PPI use may sometimes be associated with lower magnesium levels and, in some cases, B12-related concerns.";
      doctor = "Ask whether magnesium or B12 testing may be appropriate based on your symptoms.";
    }
    else if(med === "birthcontrol" && symptom === "mood"){
      insight = "A mood-related symptom pattern may be relevant.";
      meaning = "Some users notice symptom changes with hormonal medications over time.";
      doctor = "Discuss symptom timing and any changes that appeared after starting the medication.";
    }
    else if(med === "" && symptom === "fatigue"){
      insight = "Fatigue was selected without a medication pattern.";
      meaning = "Even without medications, fatigue can sometimes overlap with nutritional support needs or other health factors.";
      doctor = "Ask about possible nutrient testing or other causes of persistent fatigue.";
    }
    else if(symptom === "brainfog"){
      insight = "Brain fog was selected as a primary symptom.";
      meaning = "Brain fog can overlap with medication effects, sleep disruption, stress, and possible nutrient-related patterns.";
      doctor = "Discuss when the symptom started and whether any medication or routine changes happened around that time.";
    }
    else{
      insight = "GeneoRx detected a possible medication-symptom relationship.";
      meaning = "Tracking your symptoms over time may help clarify whether a medication, nutrient pattern, or other factor is contributing.";
      doctor = "Bring persistent symptoms, timing, and medication history to your healthcare provider for review.";
    }
 
    document.getElementById("insight").innerText = insight;
    document.getElementById("meaning").innerText = meaning;
    document.getElementById("doctor").innerText = doctor;
    document.getElementById("resultBox").style.display = "block";
  }
</script> 
</body>
</html>
 