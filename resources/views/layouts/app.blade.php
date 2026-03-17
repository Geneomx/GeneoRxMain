<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>GeneoRx — Trusted Health Companion Portal</title>

    <!-- =========================================================
        ===== CSS (KEEPING ORIGINAL GENIORX BACKGROUND) =====
        ========================================================= -->
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
        background:
            radial-gradient(1200px 700px at 20% -10%, rgba(40,225,255,.12), transparent 60%),
            radial-gradient(900px 600px at 80% 10%, rgba(167,139,250,.12), transparent 55%),
            radial-gradient(900px 700px at 30% 110%, rgba(255,79,216,.10), transparent 55%),
            linear-gradient(180deg, var(--bg0), var(--bg1));
        min-height:100vh;
        }
        .wrap{max-width:1180px;margin:0 auto;padding:22px 18px 44px}
        .top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;flex-wrap:wrap}
        .brand{display:flex;align-items:center;gap:12px;min-width:260px}
        .brandmark{
        width:44px;height:44px;border-radius:14px;
        border:1px solid rgba(255,255,255,.14);
        background: rgba(15,23,54,.50);
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        box-shadow: 0 14px 34px rgba(40,225,255,.12);
        }
        .brandmark img{
        width:40px;height:40px;object-fit:contain;display:block;
        filter: drop-shadow(0 10px 18px rgba(0,0,0,.25));
        }
        h1{margin:0;font-size:16px;letter-spacing:.2px}
        .sub{margin:4px 0 0 0;color:var(--muted);font-size:14px;line-height:1.4}
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
        display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;
        }
        .hd h2{margin:0;font-size:15px}
        .hd .desc{margin:6px 0 0 0;color:var(--muted);font-size:14px;line-height:1.45}
        .bd{padding:18px}

        /* Tabs */
        .steps{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
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
        .step.on{color:#061018;font-weight:950}
        .c1.on{background: linear-gradient(135deg, rgba(40,225,255,.92), rgba(21,101,192,.65))}
        .c2.on{background: linear-gradient(135deg, rgba(251,191,36,.92), rgba(239,108,0,.70))}
        .c3.on{background: linear-gradient(135deg, rgba(52,211,153,.92), rgba(16,185,129,.65))}
        .c4.on{background: linear-gradient(135deg, rgba(167,139,250,.92), rgba(99,102,241,.65))}
        .c5.on{background: linear-gradient(135deg, rgba(255,79,216,.92), rgba(236,72,153,.65))}
        .c6.on{background: linear-gradient(135deg, rgba(148,163,184,.92), rgba(100,116,139,.65))}
        .c7.on{background: linear-gradient(135deg, rgba(251,113,133,.92), rgba(244,63,94,.65))}
        .c8.on{background: linear-gradient(135deg, rgba(59,130,246,.92), rgba(34,211,238,.65))}
        .c9.on{background: linear-gradient(135deg, rgba(16,185,129,.92), rgba(40,225,255,.65))}
        .c10.on{background: linear-gradient(135deg, rgba(244,114,182,.92), rgba(59,130,246,.65))}

        #summaryPanel{display:none}

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
</head>

<body>

 
  <div id="toast" class="toast">Saved ✓</div>

  <!-- =========================================================
       ===== 30-SECOND SNAPSHOT (MODAL) DOM =====
       ========================================================= -->
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
    <div class="modalBd">
      <pre id="snapText"></pre>
    </div>
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

  <div class="wrap">
   
     
  

      @yield('content')

   </div>

  @yield('scripts')
</body>
</html>
