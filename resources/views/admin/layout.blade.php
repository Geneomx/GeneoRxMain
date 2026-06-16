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
    :root {
      --teal:        #0E7C66;
      --teal-dark:   #075F4F;
      --teal-50:     #ECF6F3;
      --teal-100:    #D7EDE7;

      --bg:          #FFFFFF;
      --bg-soft:     #F7FAF9;
      --bg-muted:    #F1F5F4;
      --sidebar:     #FFFFFF;

      --text:        #0F1F1B;
      --text-soft:   #3C4F4A;
      --text-muted:  #6B7B77;
      --text-dim:    #9CA8A4;

      --border:      #DDE6E3;
      --border-soft: #E8EDEC;

      --shadow-sm: 0 1px 2px rgba(15, 31, 27, 0.04);
      --shadow:    0 4px 16px rgba(15, 31, 27, 0.06);

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
      border: 1px solid #BBF7D0;
      background: #F0FDF4;
      color: #166534;
    }
    .flash.error {
      border: 1px solid #FECACA;
      background: #FEF2F2;
      color: #B91C1C;
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
    .pill-verified { background: #F0FDF4; color: #166534; }
    .pill-unverified { background: #FFFBEB; color: #92400E; }
    .pill-admin    { background: #FEF3C7; color: #92400E; }

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
      background: var(--teal); color: #fff;
    }
    .btn-primary:hover { background: var(--teal-dark); }
    .btn-ghost {
      background: var(--bg); color: var(--text);
      border-color: var(--border);
    }
    .btn-ghost:hover { background: var(--bg-muted); border-color: var(--text-muted); }
    .btn-danger {
      background: #FEF2F2; color: #B91C1C; border-color: #FECACA;
    }
    .btn-danger:hover { background: #FEE2E2; }
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
      background: var(--teal); border-color: var(--teal); color: #fff;
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
      <a href="{{ route('admin.analytics') }}" class="sidebar-link {{ request()->routeIs('admin.analytics') ? 'active' : '' }}">
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 19l5-5 4 4 8-9"/><path d="M14 9h6v6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        Analytics
      </a>

      <div class="sidebar-divider"></div>

      <div class="sidebar-label">About</div>
      <div class="sidebar-link" style="cursor:default;opacity:.55;font-size:12.5px;">
        v1.0
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
