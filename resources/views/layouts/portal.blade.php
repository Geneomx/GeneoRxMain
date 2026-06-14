<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>GeneoRx — Trusted Health Companion Portal</title>
  @include('partials.logo-head')
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
    .guest-bar {
      display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      padding: 10px 16px; margin-bottom: 12px;
      background: rgba(251, 191, 36, .12); border: 1px solid rgba(251, 191, 36, .35);
      border-radius: 14px; font-size: 13px; line-height: 1.45;
    }
    .guest-bar-btns { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
    .save-account-cta {
      margin-top: 14px; padding: 14px; border-radius: 14px;
      border: 1px solid rgba(56, 189, 248, .35); background: rgba(56, 189, 248, .08);
    }
    .save-account-cta-title { font-weight: 900; font-size: 15px; margin-bottom: 6px; }
  </style>
</head>
<body>
  @include('partials.logo-bg-animation')
  <div id="toast" class="toast" data-i18n="toast.saved">Saved ✓</div>

  <div id="backdrop" class="modalBackdrop"></div>
  <div id="modal" class="modal" role="dialog" aria-modal="true">
    <div class="modalHd">
      <div style="font-weight:950" data-i18n="modal.snapshot.title">Your doctor visit Snapshot</div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="snapCopy" data-i18n="modal.snapshot.copy">Copy</button>
        <button class="ghost mini" id="snapPrint" data-i18n="modal.snapshot.print">Print</button>
        <button class="danger mini" id="snapClose" data-i18n="modal.snapshot.close">Close</button>
      </div>
    </div>
    <div class="modalBd"><pre id="snapText"></pre></div>
  </div>

  <div id="insightBackdrop" class="modalBackdrop"></div>
  <div id="insightModal" class="modal" role="dialog" aria-modal="true">
    <div class="modalHd">
      <div style="font-weight:950" data-i18n="modal.insight.title">GeneoRx Insight</div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="insightCopy" data-i18n="modal.insight.copy">Copy</button>
        <button class="danger mini" id="insightClose" data-i18n="modal.insight.close">Close</button>
      </div>
    </div>
    <div class="modalBd">
      <div class="list">
        <div class="item"><div class="k" data-i18n="modal.insight.sees">What GeneoRx sees</div><div class="v" id="insightSummary"></div></div>
        <div class="item"><div class="k" data-i18n="modal.insight.means">What this may mean</div><div class="v" id="insightMeaning"></div></div>
        <div class="item"><div class="k" data-i18n="modal.insight.doctor">What to discuss with your doctor</div><div class="v" id="insightDoctor"></div></div>
        <div class="item"><div class="k" data-i18n="modal.insight.why">Why GeneoRx generated this insight</div><div class="v" id="insightWhy"></div></div>
      </div>
    </div>
  </div>

  <div id="reportPickerBackdrop" class="modalBackdrop"></div>
  <div id="reportPickerModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="reportPickerTitle">
    <div class="modalHd">
      <div>
        <div id="reportPickerTitle" style="font-weight:950" data-i18n="modal.report.title">Choose check-in report</div>
        <div class="fineprint" style="margin-top:6px" data-i18n="modal.report.sub">Pick which check-in to download. Your report includes only your data.</div>
      </div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="reportPickerClose" data-i18n="modal.report.close">Close</button>
      </div>
    </div>
    <div class="modalBd">
      <div class="list" id="reportPickerList"></div>
      <div class="btns" style="margin-top:14px">
        <button class="primary" id="reportPickerDownload" data-i18n="modal.report.download">Download selected report</button>
      </div>
    </div>
  </div>

  <div id="checkinViewBackdrop" class="modalBackdrop"></div>
  <div id="checkinViewModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="checkinViewTitle">
    <div class="modalHd">
      <div>
        <div id="checkinViewTitle" style="font-weight:950" data-i18n="modal.checkin.title">My check-ins</div>
        <div class="fineprint" style="margin-top:6px" data-i18n="modal.checkin.sub">Tap a date below to see details, then download if you need a report.</div>
      </div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="checkinViewClose" data-i18n="modal.checkin.close">Close</button>
      </div>
    </div>
    <div class="modalBd">
      <div class="list" id="checkinViewList"></div>
      <div id="checkinViewDetail" style="margin-top:14px"></div>
      <div class="btns" style="margin-top:14px">
        <button class="primary" id="checkinViewDownload" style="width:100%" data-i18n="modal.checkin.download">Download report</button>
      </div>
    </div>
  </div>

  <div id="profileBackdrop" class="modalBackdrop"></div>
  <div id="profileModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">
    <div class="modalHd">
      <div>
        <div id="profileModalTitle" style="font-weight:950" data-i18n="profile.edit_title">Health profile</div>
        <div class="fineprint" style="margin-top:6px" data-i18n="profile.edit_sub">Update details used for safety checks and recommendations.</div>
      </div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="profileModalClose" data-i18n="common.close">Close</button>
      </div>
    </div>
    <div class="modalBd" id="profileModalBody"></div>
    <div class="modalBd" style="padding-top:0;border-top:1px solid rgba(255,255,255,.08)">
      <div class="btns">
        <button class="primary" id="profileModalSave" data-i18n="profile.save">Save profile</button>
      </div>
    </div>
  </div>

  <div id="saveAccountBackdrop" class="modalBackdrop"></div>
  <div id="saveAccountModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="saveAccountTitle">
    <div class="modalHd">
      <div>
        <div id="saveAccountTitle" style="font-weight:950" data-i18n="save_account.title">Create an account to save your information?</div>
        <div class="fineprint" style="margin-top:6px" id="saveAccountSub" data-i18n="save_account.sub">Your health profile is saved on this device only. Create a free account to keep medications, symptoms, and check-ins permanently.</div>
      </div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="saveAccountClose" type="button" data-i18n="common.close">Close</button>
      </div>
    </div>
    <div class="modalBd">
      <div id="saveAccountStepAsk">
        <p class="fineprint" data-i18n="save_account.device_note">Your wizard progress stays in this browser until you create an account.</p>
        <div class="btns" style="margin-top:14px">
          <button class="ghost" type="button" id="saveAccountNotNow" data-i18n="save_account.not_now">Not now</button>
          <button class="primary" type="button" id="saveAccountYes" data-i18n="save_account.yes">Yes, create account</button>
        </div>
        <form method="POST" action="{{ route('logout') }}" style="margin-top:14px">
          @csrf
          <input type="hidden" name="redirect_to" value="login">
          <button type="submit" class="ghost mini" style="padding:0;min-height:auto" data-i18n="save_account.signin_link">Already have an account? Sign in</button>
        </form>
      </div>
      <div id="saveAccountStepForm" style="display:none">
        <div class="fineprint" style="margin-bottom:12px" data-i18n="save_account.form_sub">Choose a password to save your progress to your GeneoRx account.</div>
        <form method="POST" action="{{ route('register') }}" id="saveAccountForm" class="auth-form" style="display:flex;flex-direction:column;gap:12px">
          @csrf
          <div>
            <label for="saveAccountName" data-i18n="save_account.name">Full name</label>
            <input type="text" id="saveAccountName" name="name" required autocomplete="name" placeholder="John Doe">
          </div>
          <div>
            <label for="saveAccountEmail" data-i18n="save_account.email">Email address</label>
            <input type="email" id="saveAccountEmail" name="email" required autocomplete="email" placeholder="you@example.com">
          </div>
          <div>
            <label for="saveAccountPhone" data-i18n="save_account.phone">Phone (optional)</label>
            <input type="tel" id="saveAccountPhone" name="phone" autocomplete="tel" placeholder="+1 555 000 0000">
          </div>
          <div>
            <label for="saveAccountPassword" data-i18n="save_account.password">Password</label>
            <input type="password" id="saveAccountPassword" name="password" required autocomplete="new-password" minlength="6" placeholder="••••••••">
          </div>
          <div>
            <label for="saveAccountPasswordConfirm" data-i18n="save_account.password_confirm">Confirm password</label>
            <input type="password" id="saveAccountPasswordConfirm" name="password_confirmation" required autocomplete="new-password" minlength="6" placeholder="••••••••">
          </div>
          <div class="btns" style="margin-top:4px">
            <button class="ghost" type="button" id="saveAccountBack" data-i18n="save_account.back">Back</button>
            <button class="primary" type="submit" id="saveAccountSubmit" data-i18n="save_account.submit">Create account &amp; save</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div id="feedbackBackdrop" class="modalBackdrop"></div>
  <div id="feedbackModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="feedbackModalTitle">
    <div class="modalHd">
      <div>
        <div id="feedbackModalTitle" style="font-weight:950" data-i18n="feedback.modal_title">Share feedback (optional)</div>
        <div class="fineprint" style="margin-top:6px" data-i18n="feedback.modal_sub">Tell us how this check-in went — or skip if you prefer.</div>
      </div>
      <div class="btns" style="margin-top:0">
        <button class="ghost mini" id="feedbackModalSkip" data-i18n="feedback.skip">Skip</button>
      </div>
    </div>
    <div class="modalBd" id="feedbackModalBody"></div>
  </div>

  <div id="revealBackdrop" class="modalBackdrop"></div>
  <div id="revealModal" class="revealModal" role="dialog" aria-modal="true" aria-labelledby="revealTitle">
    <div class="revealHd">
      <div id="revealTitle" style="font-weight:950;font-size:18px" data-i18n="modal.reveal.title">GeneoRx analyzing your health pattern</div>
      <div class="revealSub" data-i18n="modal.reveal.sub">GeneoRx is reviewing your medication profile, symptoms, depletion evidence, and pattern signals before revealing your insight.</div>
    </div>
    <div class="revealBd">
      <div class="revealSteps" id="revealSteps">
        <div class="revealStep" data-step="0"><div class="revealIcon">1</div><div><div class="revealLabel" data-i18n="modal.reveal.step1">Analyzing medication profile</div><div class="revealHint" data-i18n="modal.reveal.step1_hint">Reviewing your selected medications, dose, and duration.</div></div></div>
        <div class="revealStep" data-step="1"><div class="revealIcon">2</div><div><div class="revealLabel" data-i18n="modal.reveal.step2">Checking symptom timeline</div><div class="revealHint" data-i18n="modal.reveal.step2_hint">Looking at symptoms, severity, and your most recent check-ins.</div></div></div>
        <div class="revealStep" data-step="2"><div class="revealIcon">3</div><div><div class="revealLabel" data-i18n="modal.reveal.step3">Reviewing nutrient depletion research</div><div class="revealHint" data-i18n="modal.reveal.step3_hint">Matching your inputs to evidence-linked nutrient pathways.</div></div></div>
        <div class="revealStep" data-step="3"><div class="revealIcon">4</div><div><div class="revealLabel" data-i18n="modal.reveal.step4">Comparing pattern signals</div><div class="revealHint" data-i18n="modal.reveal.step4_hint">Combining pattern detection, safety checks, and success prediction.</div></div></div>
      </div>
      <div class="revealProgress"><div class="revealBar" id="revealBar"></div></div>
      <div class="revealFoot" id="revealFoot" data-i18n="modal.insight.preparing">Preparing your GeneoRx insight…</div>
    </div>
  </div>

  <div class="wrap">
    @yield('content')
  </div>

  @yield('scripts')
</body>
</html>
