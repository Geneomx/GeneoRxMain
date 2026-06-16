  <!-- =========================================================
       ===== CSS (KEEPING ORIGINAL GENIORX BACKGROUND) =====
       ========================================================= -->
  @include('partials.brand-logo-styles')
  <style>
    :root{
      --bg0:#070A12;
      --bg1:#0B1022;
      --card:#0F1736CC;
      --card2:#101B40;
      --stroke:#24325E;
      --txt:#EAF0FF;
      --muted:#A9B4D6;
      --muted2:#7E8AB8;

      --cyan:#28E1FF;
      --violet:#A78BFA;
      --pink:#FF4FD8;
      --amber:#FBBF24;
      --green:#34D399;
      --red:#FB7185;

      --r:18px;
      --shadow: 0 18px 55px rgba(0,0,0,.35);
      --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:var(--sans);
      color:var(--txt);
      position:relative;
      background:
        radial-gradient(1200px 700px at 20% -10%, rgba(40,225,255,.12), transparent 60%),
        radial-gradient(900px 600px at 80% 10%, rgba(167,139,250,.12), transparent 55%),
        radial-gradient(900px 700px at 30% 110%, rgba(255,79,216,.10), transparent 55%),
        linear-gradient(180deg, var(--bg0), var(--bg1));
      min-height:100vh;
    }

    /* Animated logo background */
    .geneorx-bg{
      position:fixed; inset:0; overflow:hidden;
      pointer-events:none; z-index:0;
    }
    .geneorx-bg__ambient{
      position:absolute; inset:0;
      background:
        radial-gradient(circle at 18% 22%, rgba(40,225,255,.10), transparent 26%),
        radial-gradient(circle at 82% 38%, rgba(167,139,250,.09), transparent 30%),
        radial-gradient(circle at 48% 88%, rgba(52,211,153,.07), transparent 28%);
      opacity:.55;
      animation:geneorxAmbientDrift 20s ease-in-out infinite alternate;
    }
    .geneorx-bg__orbits::before,
    .geneorx-bg__orbits::after{
      content:"";
      position:absolute;
      border:1px solid rgba(255,255,255,.07);
      border-radius:50%;
      animation:geneorxOrbitPulse 14s ease-in-out infinite;
    }
    .geneorx-bg__orbits::before{
      width:min(720px, 90vw); height:min(720px, 90vw);
      right:-220px; top:-180px;
      animation-duration:18s;
    }
    .geneorx-bg__orbits::after{
      width:min(480px, 70vw); height:min(480px, 70vw);
      left:-140px; bottom:-120px;
      border-color:rgba(40,225,255,.10);
      animation-delay:2.5s;
      animation-duration:16s;
    }
    .geneorx-bg__logo{
      position:absolute;
      background:center / contain no-repeat var(--logo-url);
      filter:saturate(1.2);
      mix-blend-mode:screen;
    }
    .geneorx-bg__logo--primary{
      width:min(440px, 52vw);
      height:min(440px, 52vw);
      right:-6%;
      top:12%;
      opacity:.065;
      animation:geneorxLogoFloatA 17s ease-in-out infinite alternate;
    }
    .geneorx-bg__logo--secondary{
      width:min(300px, 40vw);
      height:min(300px, 40vw);
      left:-10%;
      bottom:8%;
      opacity:.042;
      animation:geneorxLogoFloatB 22s ease-in-out infinite alternate-reverse;
    }
    @keyframes geneorxAmbientDrift{
      0%{ transform:translate3d(0,0,0) scale(1); opacity:.42; }
      50%{ transform:translate3d(-2%,1.5%,0) scale(1.04); opacity:.58; }
      100%{ transform:translate3d(2%,-1%,0) scale(1.02); opacity:.48; }
    }
    @keyframes geneorxLogoFloatA{
      0%{ transform:translate3d(-24px, 28px, 0) rotate(-10deg) scale(.9); opacity:.045; }
      50%{ transform:translate3d(16px, -18px, 0) rotate(8deg) scale(1.06); opacity:.08; }
      100%{ transform:translate3d(36px, 22px, 0) rotate(-4deg) scale(.96); opacity:.055; }
    }
    @keyframes geneorxLogoFloatB{
      0%{ transform:translate3d(20px, -16px, 0) rotate(12deg) scale(.88); opacity:.03; }
      50%{ transform:translate3d(-14px, 12px, 0) rotate(-6deg) scale(1.04); opacity:.06; }
      100%{ transform:translate3d(-28px, -8px, 0) rotate(3deg) scale(.94); opacity:.038; }
    }
    @keyframes geneorxOrbitPulse{
      0%, 100%{ transform:scale(1) rotate(0deg); opacity:.85; }
      50%{ transform:scale(1.06) rotate(5deg); opacity:.45; }
    }
    @media (prefers-reduced-motion: reduce){
      .geneorx-bg__ambient,
      .geneorx-bg__logo,
      .geneorx-bg__orbits::before,
      .geneorx-bg__orbits::after{
        animation:none !important;
      }
    }

    .wrap{max-width:1180px;margin:0 auto;padding:22px 18px 44px;position:relative;z-index:1}
    .top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;flex-wrap:wrap}
    .brand{display:flex;align-items:center;gap:12px;min-width:260px}
    .brandmark,
    .geneorx-brandmark{
      width:44px;height:44px;border-radius:14px;
      border:1px solid rgba(255,255,255,.14);
      background: rgba(15,23,54,.50);
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;
      box-shadow: 0 14px 34px rgba(40,225,255,.12);
    }
    .brandmark img,
    .geneorx-brandmark img{
      width:40px;height:40px;object-fit:contain;display:block;
      filter: drop-shadow(0 10px 18px rgba(0,0,0,.25));
    }
    .portal-brand { align-items: center; }
    h1{margin:0;font-size:18px;font-weight:900;letter-spacing:-.3px}
    .sub{margin:4px 0 0 0;color:var(--muted);font-size:14px;line-height:1.4}
    .portal-top{margin-bottom:18px}
    .portal-brand{min-width:0}
    .portal-status{gap:8px}
    .portal-link-btn{text-decoration:none}
    .portal-menu{position:relative;display:inline-flex}
    .portal-menu-panel{
      position:absolute;top:calc(100% + 8px);right:0;min-width:220px;
      padding:8px;border-radius:14px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(11,16,34,.98);
      box-shadow:0 18px 48px rgba(0,0,0,.45);
      z-index:120;
    }
    .portal-menu-panel[hidden]{display:none}
    .portal-menu-email{
      padding:8px 10px 10px;font-size:12px;color:var(--muted);
      border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:6px;
      word-break:break-all;
    }
    .portal-menu-item{
      display:block;width:100%;text-align:left;
      padding:10px 12px;border:none;border-radius:10px;
      background:transparent;color:var(--txt);font:inherit;font-size:13px;font-weight:600;
      cursor:pointer;text-decoration:none;
    }
    .portal-menu-item:hover{background:rgba(40,225,255,.08)}
    .portal-menu-item--danger{color:#fda4af}
    .portal-menu-logout{margin:0;padding:0}
    .status{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
    .badge{
      border:1px solid rgba(255,255,255,.12);
      background: rgba(15,23,54,.60);
      border-radius:999px;
      padding:9px 12px;
      font-size:13px;
      color:var(--muted);
      box-shadow: 0 10px 22px rgba(0,0,0,.18);
    }
    .badge strong{color:var(--txt);font-weight:900}

    .grid{display:grid;grid-template-columns:1fr;gap:16px;}
    @media (max-width: 980px){ .grid{grid-template-columns:1fr} }

    .card{
      border-radius: var(--r);
      border:1px solid rgba(255,255,255,.12);
      background: linear-gradient(180deg, rgba(15,23,54,.72), rgba(16,27,64,.58));
      box-shadow: var(--shadow);
      overflow:hidden;
    }
    .hd{
      padding:16px 16px 12px 16px;
      border-bottom:1px solid rgba(255,255,255,.10);
      display:block;
    }
    .hd-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .hd h2{margin:0;font-size:15px}
    .hd .desc{margin:6px 0 0 0;color:var(--muted);font-size:14px;line-height:1.45}
    .bd{padding:18px}

    /* Tabs */
    .steps{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-start;margin-top:10px}
    .step{
      padding:9px 12px;border-radius:999px;
      border:1px solid rgba(255,255,255,.12);
      background: rgba(7,10,18,.35);
      color: var(--muted);
      font-size:13px;cursor:pointer;user-select:none;
      box-shadow: 0 10px 20px rgba(0,0,0,.16);
      transition: transform .05s ease, filter .15s ease;
    }
    .step:hover{filter:brightness(1.05)}
    .step:active{transform:translateY(1px)}
    .step.on{
      color:#061018;font-weight:950;
      background: linear-gradient(135deg, rgba(40,225,255,.92), rgba(21,101,192,.65));
      border-color: rgba(40,225,255,.35);
    }

    #summaryPanel{display:none}
    #summaryPanel .hd.summary-hd{
      display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;
    }

    .section{
      padding:16px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:16px;
      background: rgba(7,10,18,.28);
    }
    .section + .section{margin-top:14px}
    .row{display:flex;gap:12px;flex-wrap:wrap}
    .col{flex:1;min-width:220px}

    label{display:block;font-size:13px;color:var(--muted);margin:0 0 8px}
    input, select, textarea{
      width:100%;
      padding:11px 12px;
      border-radius: 12px;
      border:1px solid rgba(255,255,255,.14);
      background: rgba(7,10,18,.45);
      color: var(--txt);
      outline:none;
      font-size:14px;
    }
    textarea{min-height:115px;resize:vertical}
    input::placeholder, textarea::placeholder{color: rgba(169,180,214,.75)}

    .btns{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:14px}
    button{
      border:none;padding:11px 14px;border-radius: 12px;
      cursor:pointer;font-size:14px;
      border:1px solid rgba(255,255,255,.14);
      background: rgba(15,23,54,.55);
      color:var(--txt);
      box-shadow: 0 10px 22px rgba(0,0,0,.18);
      transition: transform .05s ease, filter .15s ease;
    }
    button:hover{filter:brightness(1.06)}
    button:active{transform: translateY(1px)}
    .primary{
      border-color: rgba(255,255,255,.18);
      background: linear-gradient(135deg, rgba(40,225,255,.92), rgba(167,139,250,.86));
      color:#061018;
      font-weight:950;
    }
    .ghost{background: rgba(7,10,18,.35)}
    .danger{background: rgba(251,113,133,.18);border-color: rgba(251,113,133,.35)}
    .mini{padding:9px 12px;font-size:13px}

    .fineprint{font-size:14px;line-height:1.5;color: var(--muted)}
    .divider{height:1px;background: rgba(255,255,255,.10);margin:14px 0}

    .chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
    .chip{
      padding:9px 12px;border-radius:999px;
      border:1px solid rgba(255,255,255,.14);
      background: rgba(15,23,54,.45);
      color: var(--txt);
      font-size:14px;cursor:pointer;user-select:none;
      box-shadow: 0 10px 18px rgba(0,0,0,.14);
    }
    .chip[aria-pressed="true"]{
      background: rgba(40,225,255,.18);
      border-color: rgba(40,225,255,.45);
      font-weight:950;
    }

    .score-picker-grid{display:flex;flex-direction:column;gap:18px}
    .score-picker-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:8px}
    .score-picker-head label{margin:0;font-size:14px;font-weight:800;color:var(--txt)}
    .score-picker-value{
      font-size:22px;font-weight:950;color:var(--cyan);
      min-width:34px;text-align:right;line-height:1;
    }
    .score-picker-track{display:flex;gap:6px;flex-wrap:wrap}
    .score-pill{
      min-width:36px;height:36px;padding:0 8px;border-radius:10px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(15,23,54,.45);color:var(--txt);
      font-size:13px;font-weight:800;cursor:pointer;user-select:none;
      transition:background .15s ease,border-color .15s ease,transform .12s ease,box-shadow .15s ease;
    }
    .score-pill:hover{border-color:rgba(40,225,255,.35);background:rgba(40,225,255,.08)}
    .score-pill[aria-pressed="true"]{
      background:rgba(40,225,255,.22);border-color:rgba(40,225,255,.55);color:#fff;
      transform:scale(1.06);box-shadow:0 8px 20px rgba(40,225,255,.16);
    }
    @media (max-width: 520px){
      .score-picker-track{gap:4px}
      .score-pill{min-width:28px;height:32px;font-size:12px;padding:0 4px;border-radius:8px}
      .score-picker-value{font-size:20px}
    }
    .sym-checkin-item{display:flex;flex-direction:column;gap:14px;padding:14px}
    .sym-checkin-name{font-weight:900;font-size:15px;color:var(--txt);line-height:1.35}
    .sym-field-label{display:block;font-size:13px;font-weight:800;color:var(--muted);margin-bottom:8px}
    .sym-impact-picker .chips{margin-top:0}
    .impact-chip{font-size:13px;padding:8px 11px}
    .score-picker--inline{margin-top:0}
    @media (max-width: 520px){
      .impact-chip{font-size:12px;padding:7px 9px}
    }

    .list{display:flex;flex-direction:column;gap:10px}
    .item{
      border:1px solid rgba(255,255,255,.12);
      border-radius:14px;
      background: rgba(7,10,18,.22);
      padding:12px;
    }
    .k{font-size:13px;color:var(--muted);margin-bottom:5px}
    .v{font-size:14px;line-height:1.45}

    .tagline{
      padding:12px 14px;border-radius:14px;
      border:1px solid rgba(40,225,255,.22);
      background: rgba(40,225,255,.10);
      color: var(--txt);
      font-size:14px;line-height:1.5;
    }
    .banner{
      padding:12px 14px;border-radius:14px;
      border:1px solid rgba(251,113,133,.30);
      background: rgba(251,113,133,.12);
      color: var(--txt);
      margin-top:12px;
      font-size:14px;line-height:1.5;
    }

    /* Evidence */
    .evrow{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;}
    .sourceBadge{
      font-size:12px;padding:6px 10px;border-radius:999px;
      border:1px solid rgba(255,255,255,.12);
      background: rgba(7,10,18,.30);
      color: var(--muted);
      white-space:nowrap;
    }
    .sourceBadge strong{color:var(--txt)}
    .sourceBadge.high{border-color: rgba(52,211,153,.28); background: rgba(52,211,153,.10)}
    .sourceBadge.mod{border-color: rgba(251,191,36,.28); background: rgba(251,191,36,.08)}
    .sourceBadge.pre{border-color: rgba(251,113,133,.28); background: rgba(251,113,133,.08)}
    .sourceBadge.pending{border-color: rgba(148,163,184,.25); background: rgba(148,163,184,.07)}
    .evbtn{
      padding:9px 12px;border-radius:12px;
      font-size:14px;font-weight:900;
      background: rgba(167,139,250,.14);
      border:1px solid rgba(167,139,250,.25);
      cursor:pointer;user-select:none;
      display:inline-flex;align-items:center;gap:8px;
    }
    .evidence{
      margin-top:10px;
      padding:12px;border-radius:14px;
      border:1px solid rgba(255,255,255,.12);
      background: rgba(15,23,54,.40);
    }
    .citeList{display:flex;flex-direction:column;gap:8px;margin-top:10px}
    .cite{
      font-family: var(--mono);
      font-size:12.5px;
      color: rgba(234,240,255,.90);
      padding:8px 10px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.12);
      background: rgba(7,10,18,.30);
      width: fit-content;
      max-width: 100%;
      overflow-x:auto;
      text-decoration:none;
      display:inline-block;
    }
    a.cite:hover{filter:brightness(1.08)}
    .inlineCites{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;}
    .inlineCites .cite{padding:6px 8px;font-size:12px;opacity:.95;}
    .note{margin-top:10px;color: var(--muted);font-size:14px;line-height:1.5;}

    /* Summary */
    .quickActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
    .qaBtn{padding:9px 12px;font-size:13px;border-radius:12px}

    .tierPill{
      display:inline-flex;align-items:center;gap:8px;
      padding:6px 10px;border-radius:999px;
      border:1px solid rgba(255,255,255,.12);
      background: rgba(7,10,18,.30);
      color: var(--muted);
      font-size:12.5px;
      white-space:nowrap;
    }
    .tierHigh{border-color: rgba(52,211,153,.30); background: rgba(52,211,153,.10)}
    .tierMod{border-color: rgba(251,191,36,.30); background: rgba(251,191,36,.08)}
    .tierLow{border-color: rgba(148,163,184,.28); background: rgba(148,163,184,.07)}

    /* Contact */
    .contactBox{
      border:1px solid rgba(255,255,255,.12);
      border-radius:16px;
      background: rgba(7,10,18,.24);
      padding:14px;
    }
    .mailto{
      color: var(--txt);
      text-decoration:none;
      border-bottom:1px dashed rgba(234,240,255,.55);
    }

    /* Meds */
    .medRow{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;}
    .hint{font-size:13px;color:var(--muted);margin-top:8px}
    .covPill{
      display:inline-flex;align-items:center;gap:8px;
      padding:7px 10px;border-radius:999px;
      border:1px solid rgba(255,255,255,.12);
      background: rgba(7,10,18,.30);
      color: var(--muted);
      font-size:13px;
      margin-top:10px;
      width: fit-content;
    }
    .covPill strong{color:var(--txt)}

    /* Toast */
    .toast{
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(7,10,18,.72);
      border: 1px solid rgba(255,255,255,.14);
      color: var(--txt);
      padding: 10px 12px;
      border-radius: 999px;
      box-shadow: 0 18px 55px rgba(0,0,0,.35);
      font-size: 13px;
      display: none;
      z-index: 9999;
      max-width: calc(100vw - 24px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Coach */
    .coachBox{
      border:1px solid rgba(255,255,255,.12);
      border-radius:16px;
      background: linear-gradient(180deg, rgba(40,225,255,.10), rgba(167,139,250,.08));
      padding:14px;
    }
    .coachTitle{display:flex;align-items:center;gap:10px}
    .spark{
      width:28px;height:28px;border-radius:10px;
      background: rgba(255,255,255,.10);
      border:1px solid rgba(255,255,255,.14);
      display:flex;align-items:center;justify-content:center;
      font-weight:950;
      color: var(--txt);
    }

    /* =========================================================
       ===== 30-SECOND SNAPSHOT (MODAL) =====
       ========================================================= */
    .modalBackdrop{
      position:fixed; inset:0;
      background: rgba(0,0,0,.55);
      display:none;
      z-index:9998;
    }
    .modal{
      position:fixed; left:50%; top:50%;
      transform: translate(-50%,-50%);
      width: min(880px, calc(100vw - 24px));
      max-height: calc(100vh - 24px);
      overflow:auto;
      background: rgba(15,23,54,.96);
      border:1px solid rgba(255,255,255,.14);
      border-radius: 18px;
      box-shadow: var(--shadow);
      display:none;
      z-index:9999;
    }
    .modalHd{
      padding:14px 14px 10px 14px;
      border-bottom:1px solid rgba(255,255,255,.10);
      display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
    }
    .modalBd{padding:14px}
    .modal pre{
      white-space:pre-wrap;
      background: rgba(7,10,18,.40);
      border:1px solid rgba(255,255,255,.10);
      border-radius: 14px;
      padding:12px;
      font-family: var(--mono);
      font-size: 12.5px;
      color: rgba(234,240,255,.92);
      margin:0;
    }

    .alertBox{border-radius:14px;padding:12px;border:1px solid rgba(255,255,255,.12);background:rgba(7,10,18,.24)}
    .alertHigh{border-color:rgba(251,113,133,.45);background:rgba(251,113,133,.10)}
    .alertModerate{border-color:rgba(251,191,36,.45);background:rgba(251,191,36,.08)}
    .alertLow{border-color:rgba(52,211,153,.35);background:rgba(52,211,153,.08)}
    .metricGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    @media (max-width:780px){.metricGrid{grid-template-columns:1fr}}
    .metricCard{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(7,10,18,.22);padding:12px}

  </style>