<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', 'GeneoRx')</title>
  <link rel="icon" type="image/svg+xml" href="{{ asset('logo.svg') }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  @stack('styles')
  <style>
    :root {
      --bg0: #070A12;
      --bg1: #0B1022;
      --card: rgba(15, 23, 54, 0.72);
      --card2: rgba(16, 27, 64, 0.58);
      --teal: #28E1FF;
      --teal-dark: #1E9BB8;
      --teal-light: #5EEBFF;
      --teal-50: rgba(40, 225, 255, 0.08);
      --teal-100: rgba(40, 225, 255, 0.14);
      --bg: #070A12;
      --bg-soft: #0B1022;
      --bg-muted: rgba(15, 23, 54, 0.72);
      --text: #EAF0FF;
      --text-soft: #A9B4D6;
      --text-muted: #7E8AB8;
      --danger: #FB7185;
      --danger-50: rgba(251, 113, 133, 0.12);
      --border: rgba(255, 255, 255, 0.12);
      --border-soft: rgba(255, 255, 255, 0.08);
      --shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
      --r: 14px;
      --sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--sans);
      color: var(--text);
      background:
        radial-gradient(1200px 700px at 20% -10%, rgba(40, 225, 255, 0.12), transparent 60%),
        radial-gradient(900px 600px at 80% 10%, rgba(167, 139, 250, 0.12), transparent 55%),
        linear-gradient(180deg, var(--bg0), var(--bg1));
      min-height: 100vh;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }

    .geneorx-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--text);
    }
    .geneorx-brandmark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(15, 23, 54, 0.50);
      box-shadow: 0 14px 34px rgba(40, 225, 255, 0.12);
      overflow: hidden;
      flex-shrink: 0;
    }
    .geneorx-brandmark img { display: block; object-fit: contain; }
    .geneorx-brand-name {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.2px;
    }

    .auth-top {
      max-width: 1180px;
      margin: 0 auto;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .auth-top-link {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--border-soft);
      background: rgba(255, 255, 255, 0.03);
      transition: color 0.15s, border-color 0.15s, background 0.15s;
    }
    .auth-top-link:hover {
      color: var(--text);
      border-color: var(--border);
      background: rgba(255, 255, 255, 0.06);
    }
    .auth-top-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .auth-main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 12px 24px 48px;
    }

    .auth-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 440px);
      gap: 48px;
      align-items: center;
      min-height: calc(100vh - 120px);
    }
    .auth-intro .eyebrow {
      display: inline-flex;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--teal-light);
      background: var(--teal-50);
      border: 1px solid var(--teal-100);
      margin-bottom: 18px;
    }
    .auth-intro h1 {
      font-size: 38px;
      line-height: 1.1;
      font-weight: 800;
      letter-spacing: -0.8px;
      margin: 12px 0 14px;
    }
    .auth-intro .sub {
      font-size: 16px;
      line-height: 1.6;
      color: var(--text-soft);
      max-width: 440px;
    }
    .trust-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 22px;
    }
    .trust-row span {
      padding: 6px 11px;
      border-radius: 999px;
      background: rgba(7, 10, 18, 0.35);
      border: 1px solid var(--border);
      color: var(--text-soft);
      font-size: 12.5px;
      font-weight: 500;
    }

    .auth-card {
      background: linear-gradient(180deg, rgba(15, 23, 54, 0.72), rgba(16, 27, 64, 0.58));
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .auth-card .hd {
      padding: 22px 24px 0;
      border-bottom: none;
    }
    .auth-card .hd h2 { font-size: 18px; font-weight: 800; }
    .auth-card .hd .desc { margin-top: 6px; font-size: 14px; color: var(--text-muted); }
    .auth-card .bd { padding: 22px 24px 24px; }

    label { display: block; font-size: 13px; font-weight: 600; color: var(--text-soft); margin-bottom: 8px; }
    input, select, textarea {
      width: 100%;
      padding: 11px 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: rgba(7, 10, 18, 0.45);
      color: var(--text);
      font-size: 14px;
      font-family: var(--sans);
      outline: none;
    }
    input::placeholder { color: var(--text-muted); }
    input:focus, select:focus, textarea:focus {
      border-color: rgba(40, 225, 255, 0.45);
      box-shadow: 0 0 0 3px rgba(40, 225, 255, 0.12);
    }

    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .form-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }
    .form-label-row label { margin-bottom: 0; }
    .mailto { color: var(--teal-light); font-size: 13px; font-weight: 600; }
    .mailto:hover { color: var(--teal); }

    button, .primary {
      border: none;
      cursor: pointer;
      font-family: var(--sans);
    }
    .primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 46px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 800;
      color: #070A12;
      background: linear-gradient(135deg, rgba(40, 225, 255, 0.95), rgba(94, 235, 255, 0.88));
      box-shadow: 0 8px 24px rgba(40, 225, 255, 0.18);
      transition: transform 0.15s, filter 0.15s;
    }
    .primary:hover { filter: brightness(1.05); transform: translateY(-1px); }

    .banner {
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid rgba(251, 113, 133, 0.35);
      background: var(--danger-50);
      color: #fecdd3;
      font-size: 14px;
      margin-bottom: 14px;
    }
    .tagline {
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid rgba(40, 225, 255, 0.22);
      background: rgba(40, 225, 255, 0.08);
      color: var(--text);
      font-size: 14px;
      margin-bottom: 14px;
    }
    .fineprint { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
    .auth-actions { margin-top: 16px; text-align: center; font-size: 14px; color: var(--text-muted); }
    .auth-actions a { color: var(--teal-light); font-weight: 700; }
    .auth-actions a:hover { color: var(--teal); }

    .social-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 16px 0 12px;
    }
    .social-divider::before,
    .social-divider::after {
      content: ''; flex: 1;
      height: 1px; background: var(--border-soft);
    }
    .social-divider span {
      font-size: 12.5px; color: var(--text-muted);
      white-space: nowrap; font-weight: 500;
    }
    .social-btns { display: flex; flex-direction: column; gap: 10px; }
    .social-btn {
      display: flex; align-items: center; justify-content: center;
      gap: 10px; height: 46px; padding: 0 16px;
      border-radius: 12px; font-size: 14px; font-weight: 600;
      font-family: var(--sans); cursor: pointer; text-decoration: none;
      border: 1px solid var(--border);
      background: rgba(7, 10, 18, 0.35);
      color: var(--text);
      transition: background 0.15s, border-color 0.15s;
    }
    .social-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.18);
    }
    .social-btn svg { flex-shrink: 0; }

    .auth-shell-single {
      grid-template-columns: minmax(320px, 480px);
      justify-content: center;
    }

    @media (max-width: 860px) {
      .auth-shell { grid-template-columns: 1fr; min-height: auto; gap: 24px; }
      .auth-intro { display: none; }
      .auth-main { padding: 8px 16px 32px; }
      .auth-top { padding: 14px 16px; }
    }
  </style>
</head>
<body>
  <header class="auth-top">
    @include('partials.geneorx-brand', ['size' => 36])
    <div class="auth-top-actions">
      @include('partials.language-selector')
      <a href="{{ route('home') }}" class="auth-top-link" data-i18n="auth.back">Back to home</a>
    </div>
  </header>

  <main class="auth-main">
    @yield('content')
  </main>
</body>
</html>
