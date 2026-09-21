<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>GeneoRx Admin   @yield('title', 'Dashboard')</title>
  @include('partials.logo-head')
  @include('partials.brand-logo-styles')
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* GeneoRx v2 admin — dark clinical theme, matching the app and website.
       Token names are kept (--teal*) so every existing view keeps working;
       only the values change from the old light/teal palette to navy/cyan. */
    :root {
      --teal:        #28E1FF;   /* primary accent (cyan) */
      --teal-dark:   #5EEBFF;   /* lighter on dark bg, for text on tinted chips */
      --teal-50:     rgba(40, 225, 255, 0.10);
      --teal-100:    rgba(40, 225, 255, 0.22);

      --bg:          #0F1736;   /* cards, top bar, inputs */
      --bg-soft:     #070A12;   /* page background */
      --bg-muted:    rgba(15, 23, 54, 0.55);
      --sidebar:     #0B1022;

      --text:        #EAF0FF;
      --text-soft:   #A9B4D6;
      --text-muted:  #7E8AB8;
      --text-dim:    #5A6490;

      --border:      rgba(255, 255, 255, 0.12);
      --border-soft: rgba(255, 255, 255, 0.08);

      /* Semantic status colors — dark-friendly alpha tints */
      --success:     #34D399;
      --success-bg:  rgba(52, 211, 153, 0.12);
      --success-bd:  rgba(52, 211, 153, 0.32);
      --warn:        #FBBF24;
      --warn-bg:     rgba(251, 191, 36, 0.12);
      --warn-bd:     rgba(251, 191, 36, 0.32);
      --danger:      #FB7185;
      --danger-bg:   rgba(251, 113, 133, 0.12);
      --danger-bd:   rgba(251, 113, 133, 0.34);

      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.30);
      --shadow:    0 4px 16px rgba(0, 0, 0, 0.35);

      --r:    10px;
      --r-lg: 14px;
      --sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--sans);
      color: var(--text);
      background: var(--bg-soft);
      min-height: 100vh;
      display: flex; flex-direction: column;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }

    /* ========== TOP BAR ========== */
    .admin-topbar {
      height: 56px;
      background: var(--bg);
      border-bottom: 1px solid var(--border-soft);
      display: flex; align-items: center;
      padding: 0 24px; gap: 16px;
      position: sticky; top: 0; z-index: 50;
    }
    .admin-brand { display: flex; align-items: center; gap: 9px; }
    .admin-brand img { width: 28px; height: 28px; }
    .admin-brand-name {
      font-size: 15px; font-weight: 700;
      color: var(--text); letter-spacing: -0.2px;
    }
    .admin-brand-badge {
      font-size: 10px; font-weight: 700;
      padding: 3px 7px; border-radius: 4px;
      background: var(--teal-50); color: var(--teal-dark);
      text-transform: uppercase; letter-spacing: 0.7px;
      margin-left: 4px;
    }
    .admin-topbar-spacer { flex: 1; }
    .admin-topbar-user {
      display: flex; align-items: center; gap: 10px;
      font-size: 13.5px; color: var(--text-muted);
    }
    .admin-topbar-user strong { color: var(--text); font-weight: 600; }
    .admin-topbar-btn {
      display: inline-flex; align-items: center;
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 12.5px; font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--bg); color: var(--text);
      font-family: var(--sans);
      transition: background 0.15s, border-color 0.15s;
    }
    .admin-topbar-btn:hover { background: var(--bg-muted); border-color: var(--text-muted); }

    /* ========== BODY: SIDEBAR + CONTENT ========== */
    .admin-body { display: flex; flex: 1; min-height: 0; }

    .admin-sidebar {
      width: 220px; flex-shrink: 0;
      background: var(--sidebar);
      border-right: 1px solid var(--border-soft);
      padding: 18px 14px;
      display: flex; flex-direction: column; gap: 4px;
      position: sticky; top: 56px;
      height: calc(100vh - 56px);
      overflow-y: auto;
    }

    .sidebar-label {
      font-size: 10.5px; font-weight: 700;
      letter-spacing: 1.1px;
      text-transform: uppercase;
      color: var(--text-dim);
      padding: 10px 10px 6px;
    }

    .sidebar-link {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px;
      border-radius: 7px;
      font-size: 13.5px; font-weight: 500;
      color: var(--text-soft);
      transition: background 0.12s, color 0.12s;
    }
    .sidebar-link:hover { color: var(--text); background: var(--bg-muted); }
    .sidebar-link.active {
      color: var(--teal-dark);
      background: var(--teal-50);
      font-weight: 600;
    }
    .sidebar-link .icon {
      width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .sidebar-divider { height: 1px; background: var(--border-soft); margin: 8px 0; }

    /* ========== MAIN ========== */
    .admin-content {
      flex: 1; min-width: 0;
      padding: 30px 32px 56px;
      overflow-x: auto;
    }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
      margin-bottom: 26px;
    }
    .page-header h1 {
      font-size: 24px; font-weight: 700;
      letter-spacing: -0.4px; color: var(--text);
    }
    .page-header p {
      margin-top: 4px; font-size: 14px; color: var(--text-muted);
    }

    /* ========== FLASH ========== */
    .flash {
      padding: 12px 16px;
      border-radius: 9px;
      font-size: 13.5px; line-height: 1.5;
      margin-bottom: 18px;
      display: flex; align-items: center; gap: 10px;
    }
    .flash.success {
      border: 1px solid var(--success-bd);
      background: var(--success-bg);
      color: var(--success);
    }
    .flash.error {
      border: 1px solid var(--danger-bd);
      background: var(--danger-bg);
      color: var(--danger);
    }

    /* ========== STAT CARDS ========== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .stat-card {
      padding: 20px;
      border-radius: var(--r-lg);
      border: 1px solid var(--border-soft);
      background: var(--bg);
      box-shadow: var(--shadow-sm);
    }
    .stat-label {
      font-size: 11.5px; font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.7px;
      margin-bottom: 10px;
    }
    .stat-value {
      font-size: 30px; font-weight: 700;
      letter-spacing: -0.8px; line-height: 1;
      color: var(--text);
    }
    .stat-value.teal   { color: var(--teal); }
    .stat-sub {
      margin-top: 6px;
      font-size: 12.5px; color: var(--text-muted);
    }

    /* ========== ADMIN CARD ========== */
    .admin-card {
      border-radius: var(--r-lg);
      border: 1px solid var(--border-soft);
      background: var(--bg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      margin-bottom: 18px;
    }
    .admin-card-hd {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-soft);
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap;
    }
    .admin-card-hd h2 { font-size: 15px; font-weight: 700; color: var(--text); }
    .admin-card-hd p  { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    .admin-card-bd { padding: 20px; }

    /* ========== TABLE ========== */
    .admin-table-wrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
    }
    th {
      text-align: left;
      padding: 11px 16px;
      font-size: 11px; font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.6px;
      border-bottom: 1px solid var(--border-soft);
      background: var(--bg-soft);
      white-space: nowrap;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-soft);
      vertical-align: middle;
      color: var(--text);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg-soft); }

    /* ========== PILLS ========== */
    .pill {
      display: inline-flex; align-items: center;
      padding: 3px 9px;
      border-radius: 5px;
      font-size: 11.5px; font-weight: 600;
      white-space: nowrap;
    }
    .pill-plus     { background: var(--teal-50); color: var(--teal-dark); }
    .pill-free     { background: var(--bg-muted); color: var(--text-muted); }
    .pill-verified { background: var(--success-bg); color: var(--success); }
    .pill-unverified { background: var(--warn-bg); color: var(--warn); }
    .pill-admin    { background: var(--warn-bg); color: var(--warn); }

    /* ========== BUTTONS ========== */
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 7px 14px;
      border-radius: 7px;
      font-size: 12.5px; font-weight: 600;
      cursor: pointer; border: 1px solid transparent;
      font-family: var(--sans);
      transition: all 0.13s;
      text-decoration: none; white-space: nowrap;
    }
    .btn-primary {
      background: var(--teal); color: #061018;
    }
    .btn-primary:hover { background: var(--teal-dark); }
    .btn-ghost {
      background: var(--bg); color: var(--text);
      border-color: var(--border);
    }
    .btn-ghost:hover { background: var(--bg-muted); border-color: var(--text-muted); }
    .btn-danger {
      background: var(--danger-bg); color: var(--danger); border-color: var(--danger-bd);
    }
    .btn-danger:hover { background: rgba(251, 113, 133, 0.2); }
    .btn-sm { padding: 5px 11px; font-size: 12px; border-radius: 6px; }

    /* ========== FORM ========== */
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="number"],
    input[type="search"],
    select {
      height: 38px;
      padding: 0 12px;
      border: 1px solid var(--border);
      border-radius: 7px;
      background: var(--bg);
      color: var(--text);
      font-size: 13.5px;
      font-family: var(--sans);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    textarea {
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 7px;
      background: var(--bg);
      color: var(--text);
      font-size: 13.5px;
      font-family: var(--sans);
      outline: none;
      line-height: 1.6;
      resize: vertical;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--teal);
      box-shadow: 0 0 0 3px rgba(14,124,102,0.10);
    }
    input::placeholder, textarea::placeholder { color: var(--text-muted); }

    /* ========== FIELD HELPERS ========== */
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: .4px;
      margin-bottom: 6px;
    }
    .field-hint {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-top: 4px;
    }
    .field-group { margin-bottom: 16px; }

    /* ========== INFO GRID ========== */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    .info-item {
      padding: 14px;
      border-radius: 9px;
      border: 1px solid var(--border-soft);
      background: var(--bg-soft);
    }
    .info-label {
      font-size: 11px; font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.6px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 14px; font-weight: 600;
      color: var(--text);
    }
    .info-value.muted { color: var(--text-muted); font-weight: 400; }

    /* ========== PAGINATION ========== */
    .pagination {
      display: flex; gap: 5px; align-items: center;
      flex-wrap: wrap; margin-top: 18px;
    }
    .pagination a, .pagination span {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 34px; height: 34px;
      padding: 0 10px;
      border-radius: 7px;
      font-size: 13px; font-weight: 500;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text-soft);
    }
    .pagination a:hover { background: var(--bg-muted); color: var(--text); }
    .pagination .active {
      background: var(--teal); border-color: var(--teal); color: #061018;
    }
    .pagination .disabled { opacity: 0.4; cursor: not-allowed; }

    /* ========== AVATAR ========== */
    .avatar-sq {
      width: 32px; height: 32px;
      border-radius: 7px;
      background: var(--teal-50);
      color: var(--teal-dark);
      display: flex; align-items: center; justify-content: center;
      font-size: 12.5px; font-weight: 700;
      flex-shrink: 0;
    }

    /* ========== RESPONSIVE ========== */
    @media (max-width: 800px) {
      .admin-sidebar { display: none; }
      .admin-content { padding: 20px 16px 40px; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <!-- TOP BAR -->
  <header class="admin-topbar">
    <a href="{{ route('home') }}" class="admin-brand">
      @include('partials.geneorx-brand', ['variant' => 'full', 'logoSize' => 'nav', 'showName' => false, 'href' => route('home')])
      <span class="admin-brand-badge">Admin</span>
    </a>

    <div class="admin-topbar-spacer"></div>

    <div class="admin-topbar-user">
      Signed in as <strong>{{ auth()->user()->name }}</strong>
    </div>

    <a href="{{ route('treatments') }}" class="admin-topbar-btn">App</a>

    <form method="POST" action="{{ route('logout') }}" style="display:inline;">
      @csrf
      <button type="submit" class="admin-topbar-btn">Sign out</button>
    </form>
  </header>

  <div class="admin-body">
    <!-- SIDEBAR -->
    <nav class="admin-sidebar">
      <div class="sidebar-label">Overview</div>
      <a href="{{ route('admin.dashboard') }}" class="sidebar-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </span>
        Dashboard
      </a>

      <div class="sidebar-label">Manage</div>
      <a href="{{ route('admin.users') }}" class="sidebar-link {{ request()->routeIs('admin.users', 'admin.user-detail') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </span>
        Users
      </a>
      <a href="{{ route('admin.medications') }}" class="sidebar-link {{ request()->routeIs('admin.medications*') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M12 8v8M8 12h8"/></svg>
        </span>
        Medications
      </a>
      <a href="{{ route('admin.subscriptions') }}" class="sidebar-link {{ request()->routeIs('admin.subscriptions') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
        </span>
        Subscriptions
      </a>

      <div class="sidebar-label">Insight</div>
      <a href="{{ route('admin.analytics') }}" class="sidebar-link {{ request()->routeIs('admin.analytics') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 19l5-5 4 4 8-9"/><path d="M14 9h6v6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        Analytics
      </a>
      <a href="{{ route('admin.doctors') }}" class="sidebar-link {{ request()->routeIs('admin.doctors*') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/></svg>
        </span>
        Doctors
      </a>
      @php
        // Badge counts the two things a patient is actively waiting on.
        $openConsults = \App\Models\DoctorMessage::where('status', 'new')->count()
          + \App\Models\AppointmentRequest::where('status', 'requested')->count();
      @endphp
      <a href="{{ route('admin.consults') }}" class="sidebar-link {{ request()->routeIs('admin.consults*') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
        </span>
        Consults
        @if ($openConsults > 0)
          <span style="margin-left:auto;background:var(--teal);color:#fff;font-size:11px;font-weight:700;border-radius:999px;padding:1px 7px;">{{ $openConsults }}</span>
        @endif
      </a>
      @php $newFeedback = \App\Models\Feedback::where('status', 'new')->count(); @endphp
      <a href="{{ route('admin.feedback') }}" class="sidebar-link {{ request()->routeIs('admin.feedback') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        Feedback
        @if ($newFeedback > 0)
          <span style="margin-left:auto;background:var(--teal);color:#fff;font-size:11px;font-weight:700;border-radius:999px;padding:1px 7px;">{{ $newFeedback }}</span>
        @endif
      </a>
      <a href="{{ route('admin.audit') }}" class="sidebar-link {{ request()->routeIs('admin.audit') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h3"/></svg>
        </span>
        Audit log
      </a>

      <div class="sidebar-divider"></div>

      <div class="sidebar-label">About</div>
      <div class="sidebar-link" style="cursor:default;opacity:.55;font-size:12.5px;">
        v3.0
      </div>
    </nav>

    <!-- MAIN -->
    <main class="admin-content">
      @if(session('success'))
        <div class="flash success">{{ session('success') }}</div>
      @endif
      @if(session('error'))
        <div class="flash error">{{ session('error') }}</div>
      @endif

      @yield('content')
    </main>
  </div>

</body>
</html>
