<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>GeneoRx</title>
  @include('partials.logo-head')
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  @stack('styles')

  <style>
    :root {
      --teal:        #0E7C66;
      --teal-dark:   #075F4F;
      --teal-light:  #3FB39A;
      --teal-50:     #ECF6F3;
      --teal-100:    #D7EDE7;

      --bg:          #FFFFFF;
      --bg-soft:     #F7FAF9;
      --bg-muted:    #F1F5F4;

      --text:        #0F1F1B;
      --text-soft:   #3C4F4A;
      --text-muted:  #6B7B77;
      --danger:      #B91C1C;
      --danger-50:   #FEF2F2;
      --danger-100:  #FECACA;

      --border:      #DDE6E3;
      --border-soft: #E8EDEC;

      --shadow-sm: 0 1px 2px rgba(15, 31, 27, 0.04);
      --shadow:    0 4px 16px rgba(15, 31, 27, 0.06);
      --shadow-lg: 0 12px 36px rgba(15, 31, 27, 0.09);

      --r:           10px;
      --r-lg:        14px;

      --sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--sans);
      color: var(--text);
      background: var(--bg-soft);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    a { color: inherit; text-decoration: none; }

    /* =========================================
       NAV
    ========================================= */
    .nav {
      position: sticky; top: 0; z-index: 50;
      background: rgba(255,255,255,0.92);
      backdrop-filter: saturate(180%) blur(12px);
      -webkit-backdrop-filter: saturate(180%) blur(12px);
      border-bottom: 1px solid var(--border-soft);
    }
    .nav-inner {
      max-width: 1180px; margin: 0 auto;
      padding: 12px 24px;
      display: flex; align-items: center; gap: 16px;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 9px;
      margin-right: auto;
    }
    .nav-logo { width: 30px; height: 30px; }
    .nav-name {
      font-size: 15px; font-weight: 700;
      letter-spacing: -0.2px; color: var(--text);
    }
    .nav-links {
      display: flex; align-items: center; gap: 20px;
    }
    .nav-link {
      font-size: 14px; font-weight: 500; color: var(--text-soft);
      padding: 6px 0; position: relative;
    }
    .nav-link:hover { color: var(--text); }
    .nav-link.active { color: var(--teal); }
    .nav-link.active::after {
      content: '';
      position: absolute; left: 0; right: 0; bottom: -13px;
      height: 2px; background: var(--teal);
    }

    /* ── User menu ── */
    .nav-user {
      position: relative;
      padding-left: 16px;
      border-left: 1px solid var(--border-soft);
    }
    .nav-avatar-btn {
      display: flex; align-items: center; gap: 8px;
      background: none; border: none; cursor: pointer;
      padding: 4px 6px 4px 4px;
      border-radius: 999px;
      font-family: var(--sans);
      transition: background 0.15s;
    }
    .nav-avatar-btn:hover { background: var(--bg-muted); }
    .nav-avatar {
      width: 32px; height: 32px;
      background: var(--teal);
      color: #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700;
      flex-shrink: 0;
    }
    .nav-uname { font-size: 13.5px; font-weight: 600; color: var(--text); }
    .nav-chevron {
      width: 16px; height: 16px; color: var(--text-muted);
      transition: transform 0.18s;
      flex-shrink: 0;
    }
    .nav-user.open .nav-chevron { transform: rotate(180deg); }

    /* dropdown */
    .nav-dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      min-width: 220px;
      background: var(--bg);
      border: 1px solid var(--border-soft);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(15,31,27,0.12), 0 2px 8px rgba(15,31,27,0.06);
      padding: 6px;
      z-index: 200;
      display: none;
      animation: dropIn 0.14s ease;
    }
    @keyframes dropIn {
      from { opacity:0; transform:translateY(-6px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .nav-user.open .nav-dropdown { display: block; }

    .nav-drop-info {
      padding: 10px 12px 8px;
      border-bottom: 1px solid var(--border-soft);
      margin-bottom: 4px;
    }
    .nav-drop-name  { font-size: 13.5px; font-weight: 700; color: var(--text); }
    .nav-drop-email { font-size: 12px; color: var(--text-muted); margin-top: 2px; word-break: break-all; }

    .nav-drop-item {
      display: flex; align-items: center; gap: 9px;
      padding: 11px 12px;
      border-radius: 9px;
      font-size: 13.5px; font-weight: 500; color: var(--text-soft);
      cursor: pointer; width: 100%;
      background: none; border: none; font-family: var(--sans);
      text-align: left; transition: background 0.12s, color 0.12s;
      text-decoration: none;
      min-height: 44px;
    }
    .nav-drop-item:hover { background: var(--bg-muted); color: var(--text); }
    .nav-drop-item svg { flex-shrink: 0; color: var(--text-muted); }
    .nav-drop-divider { height: 1px; background: var(--border-soft); margin: 4px 0; }
    .nav-drop-item.danger { color: #B91C1C; }
    .nav-drop-item.danger:hover { background: #FEF2F2; color: #991B1B; }
    .nav-drop-item.danger svg { color: #B91C1C; }

    /* =========================================
       BUTTONS
    ========================================= */
    .btn,
    .primary,
    .ghost,
    .danger {
      display: inline-flex;
      align-items: center; justify-content: center;
      height: 38px; padding: 0 16px;
      font-size: 13.5px; font-weight: 600;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer; font-family: inherit;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .btn:hover,
    .primary:hover,
    .ghost:hover,
    .danger:hover { text-decoration: none; }
    .btn:focus-visible,
    .primary:focus-visible,
    .ghost:focus-visible,
    .danger:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(14, 124, 102, 0.16);
    }
    .btn-primary { background: var(--teal); color: #fff; }
    .btn-primary:hover { background: var(--teal-dark); }
    .btn-outline { background: var(--bg); color: var(--text); border-color: var(--border); }
    .btn-outline:hover { border-color: var(--text-muted); }
    .btn-ghost   { background: transparent; color: var(--text-soft); }
    .btn-ghost:hover { background: var(--bg-muted); color: var(--text); }
    .btn-danger {
      background: var(--danger-50); color: var(--danger); border-color: var(--danger-100);
    }
    .btn-danger:hover { background: #FEE2E2; }
    .btn-lg    { height: 44px; padding: 0 20px; font-size: 14.5px; }
    .btn-sm    { height: 32px; padding: 0 12px; font-size: 12.5px; }
    .btn-block { width: 100%; }

    /* =========================================
       LAYOUT
    ========================================= */
    .wrap {
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px 24px 48px;
    }

    .page-head {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .page-head h1 {
      font-size: 28px; font-weight: 800;
      letter-spacing: -0.4px; color: var(--text);
      margin-top: 6px;
    }
    .page-head .sub {
      margin-top: 4px; font-size: 14.5px; color: var(--text-muted);
    }
    .page-head .actions {
      display: flex; gap: 10px; flex-wrap: wrap;
      align-items: center;
    }

    /* =========================================
       CARDS
    ========================================= */
    .card {
      background: var(--bg);
      border: 1px solid var(--border-soft);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .card > .hd {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--border-soft);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      background: var(--bg);
    }
    .card > .hd h2 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: var(--text);
    }
    .card > .hd .desc {
      margin-top: 4px;
      font-size: 13.5px;
      color: var(--text-muted);
      max-width: 52ch;
      line-height: 1.5;
    }
    .card > .bd { padding: 22px; }
    #main {
      padding: 24px;
      background: var(--bg-soft);
    }
    #summaryPanel {
      position: sticky;
      top: 78px;
    }
    .card-hd {
      padding: 18px 22px;
      border-bottom: 1px solid var(--border-soft);
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 12px; flex-wrap: wrap;
    }
    .card-hd h2 { font-size: 16px; font-weight: 700; color: var(--text); }
    .card-hd .desc {
      margin-top: 3px; font-size: 13.5px; color: var(--text-muted);
    }
    .card-bd { padding: 22px; }

    /* =========================================
       TOP STATUS ROW (used by treatments)
    ========================================= */
    .top {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: 14px; margin-bottom: 22px; flex-wrap: wrap;
    }
    .top .sub { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
    .status { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      min-height: 34px;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--bg);
      border: 1px solid var(--border);
      font-size: 12.5px; color: var(--text-soft);
    }
    .badge strong { color: var(--text); font-weight: 700; }
    .save-status {
      min-width: 84px;
      justify-content: center;
    }
    .save-status.saving {
      border-color: #FED7AA;
      background: #FFF7ED;
      color: #9A3412;
    }
    .save-status.saved {
      border-color: #BBF7D0;
      background: #F0FDF4;
      color: #166534;
    }
    .save-status.error {
      border-color: #FECACA;
      background: #FEF2F2;
      color: var(--danger);
    }

    .eyebrow {
      display: inline-block;
      padding: 4px 10px; border-radius: 4px;
      background: var(--teal-50); color: var(--teal-dark);
      font-size: 11.5px; font-weight: 600;
      letter-spacing: 0.4px; text-transform: uppercase;
    }

    /* =========================================
       GRID
    ========================================= */
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
      gap: 18px;
      align-items: start;
    }

    /* =========================================
       FORM ELEMENTS
    ========================================= */
    label {
      display: block;
      font-size: 13px; font-weight: 600;
      color: var(--text); margin-bottom: 7px;
    }
    input, select, textarea {
      width: 100%;
      height: 42px;
      padding: 0 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg);
      color: var(--text);
      font-size: 14.5px;
      font-family: var(--sans);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    textarea { height: auto; min-height: 100px; padding: 12px 14px; resize: vertical; }
    input::placeholder, textarea::placeholder { color: var(--text-muted); }
    input:focus, select:focus, textarea:focus {
      border-color: var(--teal);
      box-shadow: 0 0 0 3px rgba(14, 124, 102, 0.12);
    }

    /* =========================================
       SECTION / ROW / COL
    ========================================= */
    .section {
      padding: 24px;
      border: 1px solid var(--border-soft);
      border-radius: 12px;
      background: var(--bg);
      box-shadow: none;
    }
    .section + .section { margin-top: 16px; }
    .section label {
      font-size: 14px;
      margin-bottom: 8px;
    }
    .section .fineprint {
      margin-top: -4px;
      margin-bottom: 10px;
    }
    .row { display: flex; gap: 12px; flex-wrap: wrap; }
    .col { flex: 1; min-width: 220px; }

    .divider { height: 1px; background: var(--border-soft); margin: 14px 0; }
    .fineprint { font-size: 13px; color: var(--text-muted); line-height: 1.55; }
    .hint { font-size: 12.5px; color: var(--text-muted); margin-top: 6px; }

    .btns { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
    .stickyNav {
      position: sticky;
      bottom: 12px;
      z-index: 30;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border-soft);
      border-radius: var(--r-lg);
      background: var(--bg);
      box-shadow: 0 4px 16px rgba(15, 31, 27, 0.06);
    }
    .stickyNav .navStepMeta {
      flex: 1;
      text-align: center;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .primary {
      background: var(--teal);
      color: #fff;
      border-color: var(--teal);
      min-height: 40px;
    }
    .primary:hover { background: var(--teal-dark); border-color: var(--teal-dark); }
    .ghost {
      background: var(--bg);
      color: var(--text-soft);
      border-color: var(--border);
      min-height: 40px;
    }
    .ghost:hover { background: var(--bg-muted); color: var(--text); border-color: var(--text-muted); }
    .danger {
      background: var(--danger-50);
      color: var(--danger);
      border-color: var(--danger-100);
      min-height: 40px;
    }
    .danger:hover { background: #FEE2E2; border-color: #FCA5A5; }

    /* =========================================
       STEPS / CHIPS
    ========================================= */
    .steps {
      flex: 1 1 100%;
      min-width: 0;
    }
    .stepRail {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      overflow: visible;
      padding: 2px 0 4px;
    }
    .step {
      flex: 0 0 auto;
      padding: 8px 14px; border-radius: 999px;
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text-soft); font-size: 13px; font-weight: 500;
      cursor: pointer; user-select: none;
      font-family: var(--sans);
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .step:hover { border-color: var(--teal); color: var(--teal-dark); }
    .step.on { background: var(--teal); color: #fff; border-color: var(--teal); font-weight: 600; box-shadow: none; }
    .stepMoreSelect {
      flex: 0 0 auto;
      width: auto;
      min-width: 118px;
      height: 34px;
      padding: 0 30px 0 12px;
      border-radius: 999px;
      font-size: 13px;
      color: var(--text-soft);
      background-color: var(--bg);
    }
    .stepMoreSelect.on {
      color: var(--teal-dark);
      border-color: var(--teal);
      background-color: var(--bg);
      font-weight: 700;
    }

    /* journey color variants -> all use teal in new scheme but vary slightly */
    .c1.on, .c2.on, .c3.on, .c4.on, .c5.on, .c6.on, .c7.on, .c8.on, .c9.on, .c10.on {
      background: var(--teal); color: #fff;
    }

    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .chip {
      padding: 8px 14px; border-radius: 999px;
      border: 1.5px solid var(--border); background: var(--bg);
      color: var(--text-soft); font-size: 13.5px;
      cursor: pointer; user-select: none;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .chip:hover { border-color: var(--teal); }
    .chip[aria-pressed="true"] {
      background: var(--bg); border-color: var(--teal); color: var(--teal-dark);
      font-weight: 600;
      box-shadow: inset 0 0 0 1px var(--teal);
    }

    /* =========================================
       LISTS / ITEMS
    ========================================= */
    .list { display: flex; flex-direction: column; gap: 10px; }
    .item {
      border: 1px solid var(--border-soft);
      border-radius: var(--r);
      background: var(--bg);
      padding: 14px;
    }
    .emptyState {
      border: 1px dashed var(--border);
      border-radius: var(--r-lg);
      background: var(--bg);
      padding: 18px;
    }
    .emptyStateTitle {
      font-size: 15px;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 4px;
    }
    .emptyStateText {
      font-size: 13.5px;
      color: var(--text-muted);
      line-height: 1.55;
    }
    .k { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
    .v { font-size: 14px; color: var(--text); line-height: 1.55; }

    /* =========================================
       BANNERS / FLASH
    ========================================= */
    .tagline {
      padding: 14px 16px; border-radius: 10px;
      background: var(--bg); border: 1px solid var(--border-soft);
      border-left: 4px solid var(--teal);
      color: var(--text-soft); font-size: 14px; line-height: 1.6;
    }
    .tagline strong {
      color: var(--text);
      display: block;
      margin-bottom: 4px;
    }
    .banner {
      padding: 12px 14px; border-radius: var(--r);
      background: #FEF2F2; border: 1px solid #FECACA;
      color: #B91C1C; font-size: 14px; line-height: 1.5;
      margin-top: 10px;
    }
    .alert-info {
      padding: 10px 14px;
      border: 1px solid var(--teal-100);
      background: var(--teal-50);
      border-radius: var(--r);
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap;
      margin-bottom: 16px;
      font-size: 13px;
      color: var(--teal-dark);
    }
    .alert-info .btn {
      height: 30px;
      padding: 0 12px;
      font-size: 12px;
    }

    /* =========================================
       EVIDENCE / SOURCE BADGES
    ========================================= */
    .sourceBadge {
      display: inline-block;
      font-size: 11.5px; padding: 4px 9px; border-radius: 999px;
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text-soft);
    }
    .sourceBadge strong { color: var(--text); }
    .sourceBadge.high    { border-color: #BBF7D0; background: #F0FDF4; color: #166534; }
    .sourceBadge.mod     { border-color: #FED7AA; background: #FFF7ED; color: #9A3412; }
    .sourceBadge.pre     { border-color: #FECACA; background: #FEF2F2; color: #991B1B; }
    .sourceBadge.pending { border-color: var(--border); background: var(--bg-muted); color: var(--text-muted); }

    .evrow { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; }
    .evbtn {
      padding: 7px 12px; border-radius: 8px;
      font-size: 13px; font-weight: 600;
      background: var(--bg); border: 1px solid var(--border); color: var(--text);
      cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .evbtn:hover { background: var(--bg-muted); }

    .evidence {
      margin-top: 10px;
      padding: 14px; border-radius: var(--r);
      border: 1px solid var(--border-soft); background: var(--bg-soft);
    }
    .citeList { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .cite {
      font-family: var(--mono);
      font-size: 12.5px; color: var(--text-soft);
      padding: 7px 10px; border-radius: 7px;
      border: 1px solid var(--border-soft); background: var(--bg);
      width: fit-content; max-width: 100%; overflow-x: auto;
      text-decoration: none; display: inline-block;
    }
    .inlineCites { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .inlineCites .cite { padding: 4px 8px; font-size: 11.5px; }
    .note { margin-top: 10px; color: var(--text-muted); font-size: 13px; line-height: 1.55; }

    /* =========================================
       TIER PILLS
    ========================================= */
    .tierPill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 9px; border-radius: 999px;
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text-soft); font-size: 12px;
    }
    .tierHigh { border-color: #BBF7D0; background: #F0FDF4; color: #166534; }
    .tierMod  { border-color: #FED7AA; background: #FFF7ED; color: #9A3412; }
    .tierLow  { border-color: var(--border); background: var(--bg-muted); color: var(--text-muted); }

    /* =========================================
       COACH BOX
    ========================================= */
    .coachBox {
      border: 1px solid var(--border-soft);
      border-left: 4px solid var(--teal);
      border-radius: 12px;
      background: var(--bg);
      padding: 18px 20px;
    }
    .coachTitle { display: flex; align-items: center; gap: 10px; }
    .spark {
      width: 26px; height: 26px; border-radius: 8px;
      background: var(--teal); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px;
    }

    /* =========================================
       METRICS GRID
    ========================================= */
    .metricGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .metricCard {
      border: 1px solid var(--border-soft);
      border-radius: var(--r);
      background: var(--bg);
      padding: 14px;
    }
    .alertBox { border-radius: var(--r); padding: 12px; border: 1px solid var(--border-soft); background: var(--bg-soft); }
    .alertHigh { border-color: #FECACA; background: #FEF2F2; }
    .alertModerate { border-color: #FED7AA; background: #FFF7ED; }
    .alertLow { border-color: #BBF7D0; background: #F0FDF4; }

    /* =========================================
       MEDS / CONTACT
    ========================================= */
    .medRow { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
    .covPill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 10px; border-radius: 999px;
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text-soft); font-size: 12.5px; margin-top: 10px;
      width: fit-content;
    }
    .covPill strong { color: var(--text); }

    .contactBox {
      border: 1px solid var(--border-soft);
      border-radius: var(--r);
      background: var(--bg-soft);
      padding: 14px;
    }
    .summary-toggle { display: none; }
    .dashboardDetails {
      border: 1px solid var(--border-soft);
      border-radius: var(--r-lg);
      background: var(--bg);
      overflow: hidden;
    }
    .dashboardDetails summary {
      cursor: pointer;
      list-style: none;
      padding: 16px;
      font-weight: 750;
      color: var(--text);
    }
    .dashboardDetails summary::-webkit-details-marker { display: none; }
    .dashboardDetails summary::after {
      content: 'View';
      float: right;
      color: var(--teal);
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .dashboardDetails[open] summary {
      border-bottom: 1px solid var(--border-soft);
    }
    .dashboardDetails[open] summary::after { content: 'Hide'; }
    .dashboardDetails .detailsBody { padding: 16px; }
    .mailto {
      color: var(--teal); text-decoration: none;
      border-bottom: 1px dashed var(--teal-light);
    }

    /* =========================================
       TOAST
    ========================================= */
    .toast {
      position: fixed; top: 70px; left: 50%;
      transform: translateX(-50%);
      background: var(--text); color: #fff;
      padding: 10px 16px; border-radius: 999px;
      box-shadow: var(--shadow-lg);
      font-size: 13px; font-weight: 500;
      display: none; z-index: 9999;
      max-width: calc(100vw - 24px);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* =========================================
       MODALS
    ========================================= */
    .modalBackdrop {
      position: fixed; inset: 0;
      background: rgba(15, 31, 27, 0.45);
      display: none; z-index: 9998;
    }
    .modal {
      position: fixed; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: min(880px, calc(100vw - 24px));
      max-height: calc(100vh - 24px); overflow: auto;
      background: var(--bg);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-lg);
      display: none; z-index: 9999;
    }
    .modalHd {
      padding: 16px 20px; border-bottom: 1px solid var(--border-soft);
      display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
    }
    .modalBd { padding: 20px; }
    .modal pre {
      white-space: pre-wrap;
      background: var(--bg-soft);
      border: 1px solid var(--border-soft);
      border-radius: var(--r);
      padding: 14px;
      font-family: var(--mono);
      font-size: 12.5px;
      color: var(--text);
      margin: 0;
    }
    .snapshotPreview {
      display: grid;
      gap: 12px;
    }
    .snapshotReport {
      border: 1px solid var(--border-soft);
      border-radius: var(--r-lg);
      background: var(--bg);
      overflow: hidden;
    }
    .snapshotReportHd {
      padding: 18px 20px;
      background: var(--teal-50);
      border-bottom: 1px solid var(--teal-100);
    }
    .snapshotReportHd h2 {
      margin: 0;
      font-size: 20px;
      letter-spacing: -0.3px;
      color: var(--text);
    }
    .snapshotReportHd p {
      margin: 6px 0 0;
      color: var(--text-soft);
      font-size: 13.5px;
    }
    .snapshotSection {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-soft);
    }
    .snapshotSection:last-child { border-bottom: none; }
    .snapshotSectionTitle {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .snapshotLine {
      font-size: 13.5px;
      line-height: 1.6;
      color: var(--text);
      white-space: pre-wrap;
    }
    .snapshotBullet {
      padding: 8px 10px;
      border: 1px solid var(--border-soft);
      border-radius: 8px;
      background: var(--bg-soft);
      font-size: 13.5px;
      line-height: 1.5;
      margin-top: 6px;
    }

    .quickActions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .qaBtn { padding: 7px 12px; font-size: 12.5px; border-radius: 7px; }

    /* =========================================
       AUTH SHELL
    ========================================= */
    .auth-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
      gap: 48px;
      align-items: center;
      min-height: calc(100vh - 180px);
    }
    .auth-shell-single {
      grid-template-columns: minmax(320px, 520px);
      justify-content: center;
    }
    .auth-intro {}
    .auth-intro .eyebrow { margin-bottom: 18px; }
    .auth-intro h1 {
      font-size: 38px; line-height: 1.1;
      font-weight: 800; letter-spacing: -0.8px;
      color: var(--text); margin: 12px 0 14px;
    }
    .auth-intro .sub {
      font-size: 16px; line-height: 1.6;
      color: var(--text-soft); max-width: 440px;
    }
    .auth-logo {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 8px;
    }
    .auth-logo img { width: 36px; height: 36px; }
    .auth-logo span { font-size: 16px; font-weight: 700; color: var(--text); }

    .trust-row {
      display: flex; gap: 8px; flex-wrap: wrap; margin-top: 22px;
    }
    .trust-row span {
      padding: 6px 11px;
      border-radius: 999px;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text-soft);
      font-size: 12.5px; font-weight: 500;
    }

    .auth-card {
      background: var(--bg);
      border: 1px solid var(--border-soft);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow);
      overflow: hidden;
      width: 100%;
    }
    .auth-card .hd {
      padding: 22px 24px 18px;
      border-bottom: 1px solid var(--border-soft);
    }
    .auth-card .hd h2 { font-size: 18px; font-weight: 700; color: var(--text); }
    .auth-card .hd p  { margin-top: 4px; font-size: 14px; color: var(--text-muted); }
    .auth-card .bd    { padding: 24px; }
    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .form-label-row {
      display: flex; justify-content: space-between; gap: 12px; align-items: center;
    }
    .auth-actions {
      display: flex; gap: 12px; flex-wrap: wrap;
      justify-content: center; align-items: center;
      margin-top: 18px; padding-top: 18px;
      border-top: 1px solid var(--border-soft);
    }
    .auth-actions a {
      color: var(--teal); font-weight: 600; font-size: 14px;
    }
    .auth-actions a:hover { color: var(--teal-dark); }
    .auth-actions form { margin: 0; }
    .otp-field {
      text-align: center; letter-spacing: 8px;
      font-size: 22px; font-weight: 700;
    }

    .auth-form .primary { height: 44px; }

    /* =========================================
       FOOTER
    ========================================= */
    .site-footer {
      background: var(--bg);
      border-top: 1px solid var(--border-soft);
      padding: 24px;
      margin-top: auto;
    }
    .site-footer-inner {
      max-width: 1180px; margin: 0 auto;
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px; flex-wrap: wrap;
      font-size: 13px; color: var(--text-muted);
    }
    .site-footer a { color: var(--text-soft); }
    .site-footer a:hover { color: var(--text); }

    /* Footer links row */
    .site-footer-links { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }

    /* =========================================
       GUEST BANNER  (persistent strip at top of all pages)
    ========================================= */
    .guest-bar {
      background: #FFFBEB;
      border-bottom: 1px solid #FDE68A;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 13.5px;
      color: #92400E;
      position: sticky;
      top: 57px;   /* sits just below the sticky nav */
      z-index: 49;
    }
    .guest-bar strong { color: #78350F; }
    .guest-bar-btns  { display: flex; gap: 8px; flex-shrink: 0; }
    @media (max-width: 640px) {
      .guest-bar { flex-direction: column; align-items: flex-start; gap: 8px; top: 54px; padding: 10px 16px; }
      .guest-bar-btns { width: 100%; }
      .guest-bar-btns form,
      .guest-bar-btns a { flex: 1; }
      .guest-bar-btns .btn { width: 100%; justify-content: center; }
    }

    /* =========================================
       MOBILE BOTTOM NAV  (auth only)
    ========================================= */
    .mob-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: rgba(255, 255, 255, 0.97);
      backdrop-filter: saturate(180%) blur(16px);
      -webkit-backdrop-filter: saturate(180%) blur(16px);
      border-top: 1px solid var(--border-soft);
      box-shadow: 0 -2px 20px rgba(15, 31, 27, 0.06);
      z-index: 100;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .mob-nav-inner {
      display: flex;
      align-items: stretch;
      height: 60px;
    }
    .mob-nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 6px 4px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.15px;
      color: var(--text-muted);
      text-decoration: none;
      border: none;
      background: none;
      cursor: pointer;
      font-family: var(--sans);
      transition: color 0.15s;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      min-height: 60px;
    }
    .mob-nav-item svg {
      width: 22px; height: 22px;
      stroke-width: 1.75;
      flex-shrink: 0;
    }
    .mob-nav-item.active { color: var(--teal); }
    .mob-nav-item.active::before {
      content: '';
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 36px; height: 3px;
      background: var(--teal);
      border-radius: 0 0 4px 4px;
    }
    .mob-nav-avatar-sm {
      width: 24px; height: 24px;
      background: var(--teal);
      color: #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 800;
      flex-shrink: 0;
      transition: box-shadow 0.15s;
    }
    .mob-nav-item.active .mob-nav-avatar-sm {
      box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--teal);
    }

    /* =========================================
       RESPONSIVE
    ========================================= */
    @media (max-width: 860px) {
      /* Nav */
      .nav-links, .nav-uname { display: none; }

      /* Main content area — bottom cleared for bottom nav + sticky form nav */
      .wrap { padding: 20px 16px calc(60px + env(safe-area-inset-bottom, 0px) + 24px); }

      /* Show mobile bottom nav */
      .mob-nav { display: block; }

      /* Sticky form nav — float above the mobile bottom nav */
      .stickyNav {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 10px);
        margin: 0;
      }
      .stickyNav .primary,
      .stickyNav .ghost { min-width: 96px; }

      /* Layout */
      .top { align-items: flex-start; }
      .grid { grid-template-columns: 1fr; }
      #summaryPanel { position: static; }
      #summaryPanel #summaryBody { display: none; }
      #summaryPanel.summary-open #summaryBody { display: block; }
      .summary-toggle { display: inline-flex; }
      .col { min-width: 100%; }
      .metricGrid { grid-template-columns: 1fr; }

      /* Auth: show form card FIRST on mobile (before marketing intro) */
      .auth-shell { grid-template-columns: 1fr; min-height: auto; gap: 20px; display: flex; flex-direction: column; width: 100%; }
      .auth-shell-single { align-items: stretch; }
      .auth-card  { order: -1; width: 100%; }
      .auth-intro { order: 1; padding-bottom: 8px; }
      .auth-intro h1 { font-size: 26px; letter-spacing: -0.4px; }
      .auth-intro .sub { font-size: 14px; }
      .trust-row { margin-top: 14px; }

      /* Page header stacks nicely */
      .page-head { gap: 12px; margin-bottom: 14px; }
      .page-head h1 { font-size: 24px; margin-top: 4px; }
      .page-head .actions { gap: 8px; }

      /* Larger nav avatar tap target */
      .nav-avatar-btn { padding: 6px 8px 6px 6px; }
      .nav-avatar { width: 34px; height: 34px; }

      /* Dropdown anchors to right, safe width */
      .nav-dropdown { right: -8px; min-width: 200px; }
    }

    @media (max-width: 640px) {
      /* Badge row wraps better */
      .status { gap: 6px; }
      .badge { min-height: 32px; font-size: 12px; padding: 4px 10px; }

      /* Cards tighter */
      .card > .hd, .card-hd { padding: 14px 16px; }
      .card > .bd, .card-bd { padding: 16px; }
      .section { padding: 16px; }

      /* Items tighter */
      .item { padding: 12px; }
    }

    @media (max-width: 520px) {
      /* Typography */
      .page-head h1 { font-size: 20px; }

      /* Buttons — full width for primary CTAs, keep small buttons auto */
      .btn-block-mobile { width: 100%; }
      .auth-form .primary { width: 100%; }
      .btn-sm { width: auto; }

      /* Auth card inner padding */
      .auth-card .hd, .auth-card .bd { padding: 16px; }

      /* Inputs — prevent iOS zoom (16px+ triggers no zoom) */
      input, select, textarea { font-size: 16px; height: 48px; }
      textarea { height: auto; }

      /* Nav user dropdown full width feel */
      .nav-dropdown { right: -4px; left: -140px; }

      /* Email verify banner stacks */
      .alert-info { flex-direction: column; align-items: flex-start; gap: 10px; }
      .alert-info .btn { width: 100%; }

      /* Footer compact */
      .site-footer { padding: 18px 16px; }
      .site-footer-inner { flex-direction: column; gap: 8px; text-align: center; }
    }

    @media (max-width: 380px) {
      .wrap { padding-left: 12px; padding-right: 12px; }
      .page-head h1 { font-size: 18px; }
      .auth-card .hd, .auth-card .bd { padding: 14px; }
    }
  </style>
</head>
<body>

  <!-- NAV -->
  <nav class="nav">
    <div class="nav-inner">
      <a href="{{ route('home') }}" class="nav-brand">
        <img src="{{ \App\Support\LogoAssets::mark() }}" alt="GeneoRx" class="nav-logo">
        <span class="nav-name">GeneoRx</span>
      </a>

      <div class="nav-links">
        @auth
          <a href="{{ route('treatments') }}" class="nav-link {{ request()->routeIs('treatments') ? 'active' : '' }}">Dashboard</a>
          @if(auth()->user()->is_admin ?? false)
            <a href="{{ route('admin.dashboard') }}" class="nav-link {{ request()->routeIs('admin.*') ? 'active' : '' }}">Admin</a>
          @endif
        @else
          <a href="{{ route('home') }}#about"   class="nav-link">About</a>
          <a href="{{ route('home') }}#how"     class="nav-link">How it works</a>
          <a href="{{ route('home') }}#demo"    class="nav-link">Demo</a>
          <a href="{{ route('home') }}#faq"     class="nav-link">FAQ</a>
        @endauth
      </div>

      @auth
        @php $initials = strtoupper(substr(auth()->user()->name, 0, 1)); @endphp
        <div class="nav-user" id="navUser">
          <button class="nav-avatar-btn" id="navAvatarBtn" type="button"
                  aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
            <div class="nav-avatar">{{ $initials }}</div>
            <span class="nav-uname">{{ auth()->user()->name }}</span>
            <svg class="nav-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="5 8 10 13 15 8"/>
            </svg>
          </button>

          <div class="nav-dropdown" id="navDropdown" role="menu">
            <div class="nav-drop-info">
              <div class="nav-drop-name">{{ auth()->user()->name }}</div>
              <div class="nav-drop-email">{{ auth()->user()->email }}</div>
            </div>

            <a href="{{ route('treatments') }}" class="nav-drop-item" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
              Dashboard
            </a>

            <a href="{{ route('account.settings') }}" class="nav-drop-item" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Settings
            </a>

            @if(auth()->user()->is_admin ?? false)
              <a href="{{ route('admin.dashboard') }}" class="nav-drop-item" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Admin panel
              </a>
            @endif

            <div class="nav-drop-divider"></div>

            <form method="POST" action="{{ route('logout') }}" style="display:contents;">
              @csrf
              <button type="submit" class="nav-drop-item danger" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      @else
        <a href="{{ route('login') }}"    class="btn btn-ghost btn-sm">Sign in</a>
        <a href="{{ route('register') }}" class="btn btn-primary btn-sm">Create account</a>
      @endauth
    </div>
  </nav>

  <!-- TOAST -->
  <div id="toast" class="toast">Saved</div>

  <!-- MODALS -->
  <div id="backdrop" class="modalBackdrop"></div>
  <div id="modal" class="modal" role="dialog" aria-modal="true">
    <div class="modalHd">
      <div>
        <div style="font-weight:800">Doctor Visit Summary</div>
        <div class="fineprint">Formatted preview for your clinician conversation.</div>
      </div>
      <div class="btns" style="margin-top:0">
        <button class="btn btn-outline btn-sm" id="snapCopy">Copy</button>
        <button class="btn btn-outline btn-sm" id="snapPrint">Print</button>
        <button class="btn btn-ghost btn-sm" id="snapClose">Close</button>
      </div>
    </div>
    <div class="modalBd"><div id="snapText" class="snapshotPreview"></div></div>
  </div>

  <div id="insightBackdrop" class="modalBackdrop"></div>
  <div id="insightModal" class="modal" role="dialog" aria-modal="true">
    <div class="modalHd">
      <div style="font-weight:700">GeneoRx Insight</div>
      <div class="btns" style="margin-top:0">
        <button class="btn btn-outline btn-sm" id="insightCopy">Copy</button>
        <button class="btn btn-ghost btn-sm" id="insightClose">Close</button>
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

  {{-- ── Persistent guest bar (shows on ALL pages in guest mode) ── --}}
  @if(session('is_web_guest'))
  <div class="guest-bar" role="alert">
    <span>👤 <strong>Guest mode</strong> — explore all features. Your progress is saved on this device. Create a free account to keep it permanently.</span>
    <div class="guest-bar-btns">
      {{-- Sign out of guest then land on register --}}
      <form method="POST" action="{{ route('logout') }}" style="margin:0;">
        @csrf
        <input type="hidden" name="redirect_to" value="register">
        <button type="submit" class="btn btn-primary btn-sm">Create free account</button>
      </form>
      {{-- Sign out of guest then land on login --}}
      <form method="POST" action="{{ route('logout') }}" style="margin:0;">
        @csrf
        <input type="hidden" name="redirect_to" value="login">
        <button type="submit" class="btn btn-outline btn-sm">Sign in</button>
      </form>
    </div>
  </div>
  @endif

  <!-- MAIN CONTENT -->
  <div class="wrap">
    @auth
      @if(! auth()->user()->email_verified_at && !session('is_web_guest'))
        <div class="alert-info">
          <span><strong>Verify your email</strong> to keep your account secure and your GeneoRx progress synced across devices.</span>
          <a href="{{ route('email.otp.show') }}" class="btn btn-primary btn-sm">Verify email</a>
        </div>
      @endif
    @endauth

    @yield('content')
  </div>

  <!-- MOBILE BOTTOM NAV (authenticated users) -->
  @auth
  @php $mobInitials = strtoupper(substr(auth()->user()->name, 0, 1)); @endphp

  @if(session('is_web_guest'))
  {{-- ── Guest bottom nav: sign-in + register ── --}}
  <nav class="mob-nav" aria-label="Mobile navigation">
    <div class="mob-nav-inner">
      <a href="{{ route('treatments') }}"
         class="mob-nav-item {{ request()->routeIs('treatments') ? 'active' : '' }}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
          <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
        </svg>
        Dashboard
      </a>

      {{-- Create account — log out guest then go to register --}}
      <form method="POST" action="{{ route('logout') }}" style="flex:1;margin:0;">
        @csrf
        <input type="hidden" name="redirect_to" value="register">
        <button type="submit" class="mob-nav-item" style="width:100%;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Register
        </button>
      </form>

      {{-- Sign in — log out guest then go to login --}}
      <form method="POST" action="{{ route('logout') }}" style="flex:1;margin:0;">
        @csrf
        <input type="hidden" name="redirect_to" value="login">
        <button type="submit" class="mob-nav-item" style="width:100%;color:var(--teal);font-weight:700;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Sign in
        </button>
      </form>
    </div>
  </nav>

  @else
  {{-- ── Authenticated user bottom nav ── --}}
  <nav class="mob-nav" aria-label="Mobile navigation">
    <div class="mob-nav-inner">

      {{-- Dashboard --}}
      <a href="{{ route('treatments') }}"
         class="mob-nav-item {{ request()->routeIs('treatments') ? 'active' : '' }}"
         aria-label="Dashboard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
          <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
        </svg>
        Dashboard
      </a>

      {{-- Settings --}}
      <a href="{{ route('account.settings') }}"
         class="mob-nav-item {{ request()->routeIs('account.*') ? 'active' : '' }}"
         aria-label="Settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        Settings
      </a>

      @if(auth()->user()->is_admin ?? false)
      {{-- Admin --}}
      <a href="{{ route('admin.dashboard') }}"
         class="mob-nav-item {{ request()->routeIs('admin.*') ? 'active' : '' }}"
         aria-label="Admin">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Admin
      </a>
      @endif

      {{-- Account (opens top dropdown) --}}
      <button class="mob-nav-item" type="button" id="mobNavAccountBtn" aria-label="Account menu">
        <div class="mob-nav-avatar-sm">{{ $mobInitials }}</div>
        Account
      </button>

    </div>
  </nav>
  @endif

  @endauth

  <!-- FOOTER -->
  <footer class="site-footer">
    <div class="site-footer-inner">
      <span>&copy; {{ date('Y') }} GeneoRx. Educational guidance only. Not medical advice.</span>
      <span>
        <a href="mailto:info@geneorx.com" style="margin-right:16px;">Contact</a>
        <a href="{{ route('home') }}">Home</a>
      </span>
    </div>
  </footer>

  @yield('scripts')

  <script>
    // ── User avatar dropdown (top nav) ────────────────────────────────────────
    (function () {
      const navUser  = document.getElementById('navUser');
      const btn      = document.getElementById('navAvatarBtn');
      const dropdown = document.getElementById('navDropdown');
      if (!navUser || !btn || !dropdown) return;

      function open()  { navUser.classList.add('open');    btn.setAttribute('aria-expanded', 'true');  }
      function close() { navUser.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
      function toggle(){ navUser.classList.contains('open') ? close() : open(); }

      btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });

      document.addEventListener('click', (e) => {
        if (!navUser.contains(e.target)) close();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });

      // ── Mobile bottom nav "Account" button ──────────────────────────────────
      const mobAccountBtn = document.getElementById('mobNavAccountBtn');
      if (mobAccountBtn) {
        mobAccountBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Scroll to top smoothly so the dropdown is visible
          window.scrollTo({ top: 0, behavior: 'smooth' });
          // Slight delay lets the scroll start before the menu opens
          setTimeout(() => toggle(), 120);
        });
      }
    })();
  </script>
</body>
</html>
