<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{ $code }} · GeneoRx</title>
  @include('partials.logo-head')
  @include('partials.brand-logo-styles')
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@1,400&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --teal: #0E7C66;
      --teal-dark: #075F4F;
      --teal-50: #ECF6F3;
      --bg: #FFFFFF;
      --bg-warm: #FBF9F5;
      --text: #0F1F1B;
      --text-soft: #3C4F4A;
      --text-muted: #6B7B77;
      --border: #DDE6E3;
      --border-soft: #E8EDEC;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text);
      background: linear-gradient(180deg, var(--bg) 0%, var(--bg-warm) 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }

    .nav {
      padding: 18px 28px;
      border-bottom: 1px solid var(--border-soft);
      background: rgba(255,255,255,0.85);
      backdrop-filter: saturate(180%) blur(12px);
    }
    .nav-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .nav-brand img { width: 32px; height: 32px; }
    .nav-name { font-size: 16px; font-weight: 800; letter-spacing: -0.2px; }

    .error-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
    }
    .error-card {
      max-width: 540px;
      text-align: center;
    }
    .error-code {
      font-family: 'Source Serif 4', serif;
      font-style: italic;
      font-size: 110px;
      font-weight: 400;
      color: var(--teal-dark);
      line-height: 1;
      letter-spacing: -2px;
      margin-bottom: 20px;
    }
    .error-title {
      font-size: 32px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.6px;
      margin-bottom: 14px;
    }
    .error-message {
      font-size: 16px;
      line-height: 1.65;
      color: var(--text-soft);
      margin-bottom: 32px;
      max-width: 460px;
      margin-left: auto;
      margin-right: auto;
    }
    .error-actions {
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 44px;
      padding: 0 22px;
      font-size: 14.5px;
      font-weight: 600;
      border-radius: 9px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .btn-primary { background: var(--teal); color: #fff; }
    .btn-primary:hover { background: var(--teal-dark); transform: translateY(-1px); }
    .btn-outline {
      background: transparent;
      color: var(--text);
      border-color: var(--border);
    }
    .btn-outline:hover { border-color: var(--teal); color: var(--teal-dark); }

    .footer {
      padding: 24px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      border-top: 1px solid var(--border-soft);
    }

    @media (max-width: 520px) {
      .error-code { font-size: 80px; }
      .error-title { font-size: 26px; }
      .error-message { font-size: 15px; }
      .btn { width: 100%; }
    }
  </style>
</head>
<body>

  <nav class="nav">
    <a href="{{ url('/') }}" class="nav-brand">
      @include('partials.geneorx-brand', ['variant' => 'full', 'logoSize' => 'nav', 'showName' => false, 'href' => url('/')])
    </a>
  </nav>

  <main class="error-wrap">
    <div class="error-card">
      <div class="error-code">{{ $code }}</div>
      <h1 class="error-title">{{ $title }}</h1>
      @yield('error-content')
    </div>
  </main>

  <footer class="footer">
    &copy; {{ date('Y') }} GeneoRx   Educational guidance only, not medical advice.
  </footer>

</body>
</html>
