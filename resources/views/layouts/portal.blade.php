<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>GeneoRx — Trusted Health Companion Portal</title>
  <link rel="icon" type="image/svg+xml" href="{{ asset('logo.svg') }}">
  @include('include.style')
  @stack('styles')
  <style>
    #summaryPanel { display: block; }
    #summaryPanel.summary-panel--hidden { display: none !important; }
    #summaryPanel.summary-panel--compact .hd .desc { display: none; }
    #summaryPanel.summary-panel--compact #contactBox { display: none; }
    .summaryCompactLine { font-size: 14px; line-height: 1.5; }
    .summaryCompactNext { margin-top: 6px; font-size: 13px; }
    .summarySimpleHero { margin-bottom: 4px; }
    .summarySimpleHeroTitle { font-size: 16px; font-weight: 900; }
    .summarySimpleHeroMeta { font-size: 13px; color: var(--muted); margin-top: 4px; }
    .summarySimpleGrid { display: flex; flex-direction: column; gap: 10px; }
    .summaryDetails {
      margin-top: 14px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 14px;
      background: rgba(7,10,18,.22);
      padding: 12px 14px;
    }
    .summaryDetails summary {
      cursor: pointer;
      font-weight: 800;
      font-size: 14px;
      color: var(--txt);
      list-style: none;
    }
    .summaryDetails summary::-webkit-details-marker { display: none; }
    .summaryDetails[open] summary { margin-bottom: 10px; }
    @media (min-width: 981px) {
      .grid { grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); align-items: start; }
    }
    .scoreBadge{
      display:inline-flex;align-items:center;justify-content:center;
      width:68px;height:68px;border-radius:50%;font-size:22px;font-weight:900;
      border:3px solid;flex-shrink:0;
    }
    .scoreHigh{color:rgb(52,211,153);border-color:rgba(52,211,153,.5);background:rgba(52,211,153,.08)}
    .scoreMod{color:rgb(251,191,36);border-color:rgba(251,191,36,.45);background:rgba(251,191,36,.08)}
    .scoreLow{color:rgb(251,113,133);border-color:rgba(251,113,133,.45);background:rgba(251,113,133,.08)}
    .revealModal{
      position:fixed; left:50%; top:50%;
      transform: translate(-50%,-50%);
      width:min(640px, calc(100vw - 24px));
      background: rgba(15,23,54,.98);
      border:1px solid rgba(255,255,255,.14);
      border-radius:20px;
      box-shadow: var(--shadow);
      display:none;
      z-index:10000;
      overflow:hidden;
    }
    .revealHd{
      padding:18px 18px 10px 18px;
      border-bottom:1px solid rgba(255,255,255,.08);
    }
    .revealSub{font-size:14px;color:var(--muted);margin-top:8px;line-height:1.55}
    .revealBd{padding:18px}
    .revealSteps{display:flex;flex-direction:column;gap:12px}
    .revealStep{
      display:flex;align-items:center;gap:12px;
      padding:12px 14px;border-radius:14px;
      border:1px solid rgba(255,255,255,.10);
      background: rgba(7,10,18,.28);
      opacity:.55; transform: translateY(4px);
      transition: opacity .25s ease, transform .25s ease, border-color .25s ease, background .25s ease;
    }
    .revealStep.on{opacity:1;transform:translateY(0);border-color:rgba(40,225,255,.30);background:rgba(40,225,255,.08)}
    .revealStep.done{opacity:1;transform:translateY(0);border-color:rgba(52,211,153,.28);background:rgba(52,211,153,.08)}
    .revealIcon{
      width:28px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center;
      background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
      font-weight:900;font-size:13px;color:var(--txt);flex:0 0 28px;
    }
    .revealStep.done .revealIcon{background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.28);color:#b7f1df}
    .revealStep.on .revealIcon{background:rgba(40,225,255,.14);border-color:rgba(40,225,255,.28);color:#b9f8ff}
    .revealLabel{font-size:14px;font-weight:800;color:var(--txt)}
    .revealHint{font-size:13px;color:var(--muted);margin-top:4px;line-height:1.5}
    .revealProgress{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid rgba(255,255,255,.08);margin-top:16px}
    .revealBar{height:100%;width:0%;background:linear-gradient(135deg, rgba(40,225,255,.95), rgba(167,139,250,.92));transition:width .28s ease}
    .revealFoot{margin-top:14px;font-size:13px;color:var(--muted)}
    .report-picker-item{cursor:pointer;transition:border-color .15s ease,background .15s ease}
    .report-picker-item--on{border-color:rgba(40,225,255,.35)!important;background:rgba(40,225,255,.08)!important}
    .checkin-detail-panel{
      padding:14px 16px;border-radius:14px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(7,10,18,.35);
    }
    .checkin-detail-row{display:flex;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}
    .checkin-detail-row:last-child{border-bottom:none;padding-bottom:0}
    .checkin-detail-k{flex:0 0 110px;font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
    .checkin-detail-v{flex:1;font-size:14px;line-height:1.5;color:var(--txt)}
    .badge-click{cursor:pointer;transition:border-color .15s ease,background .15s ease}
    .badge-click:hover{border-color:rgba(40,225,255,.28);background:rgba(40,225,255,.08)}
    .badge-click.is-disabled{opacity:.45;cursor:not-allowed;pointer-events:none}
  </style>
</head>
<body>
  <div id="toast" class="toast">Saved ✓</div>

  <div id="backdrop" class="modalBackdrop"></div>
  <div id="modal" class="modal" role="dialog" aria-modal="true">
    <div class="modalHd">
      <div style="font-weight:950">Your doctor visit Snapshot</div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="snapCopy">Copy</button>
        <button class="ghost mini" id="snapPrint">Print</button>
        <button class="danger mini" id="snapClose">Close</button>
      </div>
    </div>
    <div class="modalBd"><pre id="snapText"></pre></div>
  </div>

  <div id="insightBackdrop" class="modalBackdrop"></div>
  <div id="insightModal" class="modal" role="dialog" aria-modal="true">
    <div class="modalHd">
      <div style="font-weight:950">GeneoRx Insight</div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="insightCopy">Copy</button>
        <button class="danger mini" id="insightClose">Close</button>
      </div>
    </div>
    <div class="modalBd">
      <div class="list">
        <div class="item"><div class="k">What GeneoRx sees</div><div class="v" id="insightSummary"></div></div>
        <div class="item"><div class="k">What this may mean</div><div class="v" id="insightMeaning"></div></div>
        <div class="item"><div class="k">What to discuss with your doctor</div><div class="v" id="insightDoctor"></div></div>
        <div class="item"><div class="k">Why GeneoRx generated this insight</div><div class="v" id="insightWhy"></div></div>
      </div>
    </div>
  </div>

  <div id="reportPickerBackdrop" class="modalBackdrop"></div>
  <div id="reportPickerModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="reportPickerTitle">
    <div class="modalHd">
      <div>
        <div id="reportPickerTitle" style="font-weight:950">Choose check-in report</div>
        <div class="fineprint" style="margin-top:6px">Pick which check-in to download. Your report includes only your data.</div>
      </div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="reportPickerClose">Close</button>
      </div>
    </div>
    <div class="modalBd">
      <div class="list" id="reportPickerList"></div>
      <div class="btns" style="margin-top:14px">
        <button class="primary" id="reportPickerDownload">Download selected report</button>
      </div>
    </div>
  </div>

  <div id="checkinViewBackdrop" class="modalBackdrop"></div>
  <div id="checkinViewModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="checkinViewTitle">
    <div class="modalHd">
      <div>
        <div id="checkinViewTitle" style="font-weight:950">My check-ins</div>
        <div class="fineprint" style="margin-top:6px">Tap a date below to see details, then download if you need a report.</div>
      </div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="checkinViewClose">Close</button>
      </div>
    </div>
    <div class="modalBd">
      <div class="list" id="checkinViewList"></div>
      <div id="checkinViewDetail" style="margin-top:14px"></div>
      <div class="btns" style="margin-top:14px">
        <button class="primary" id="checkinViewDownload" style="width:100%">Download report</button>
      </div>
    </div>
  </div>

  <div id="revealBackdrop" class="modalBackdrop"></div>
  <div id="revealModal" class="revealModal" role="dialog" aria-modal="true" aria-labelledby="revealTitle">
    <div class="revealHd">
      <div id="revealTitle" style="font-weight:950;font-size:18px">GeneoRx analyzing your health pattern</div>
      <div class="revealSub">GeneoRx is reviewing your medication profile, symptoms, depletion evidence, and pattern signals before revealing your insight.</div>
    </div>
    <div class="revealBd">
      <div class="revealSteps" id="revealSteps">
        <div class="revealStep" data-step="0"><div class="revealIcon">1</div><div><div class="revealLabel">Analyzing medication profile</div><div class="revealHint">Reviewing your selected medications, dose, and duration.</div></div></div>
        <div class="revealStep" data-step="1"><div class="revealIcon">2</div><div><div class="revealLabel">Checking symptom timeline</div><div class="revealHint">Looking at symptoms, severity, and your most recent check-ins.</div></div></div>
        <div class="revealStep" data-step="2"><div class="revealIcon">3</div><div><div class="revealLabel">Reviewing nutrient depletion research</div><div class="revealHint">Matching your inputs to evidence-linked nutrient pathways.</div></div></div>
        <div class="revealStep" data-step="3"><div class="revealIcon">4</div><div><div class="revealLabel">Comparing pattern signals</div><div class="revealHint">Combining pattern detection, safety checks, and success prediction.</div></div></div>
      </div>
      <div class="revealProgress"><div class="revealBar" id="revealBar"></div></div>
      <div class="revealFoot" id="revealFoot">Preparing your GeneoRx insight…</div>
    </div>
  </div>

  <div class="wrap">
    @yield('content')
  </div>

  @yield('scripts')
</body>
</html>
