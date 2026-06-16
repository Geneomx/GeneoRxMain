<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{ $pageTitle }} · GeneoRx</title>
  @include('partials.logo-head')
  @include('partials.brand-logo-styles')
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:ital,opsz,wght@1,8..60,400&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --teal:       #0E7C66;
      --teal-dark:  #075F4F;
      --teal-50:    #ECF6F3;
      --teal-100:   #D7EDE7;
      --bg:         #FFFFFF;
      --bg-warm:    #FBF9F5;
      --text:       #0F1F1B;
      --text-soft:  #3C4F4A;
      --text-muted: #6B7B77;
      --border:     #DDE6E3;
      --border-soft:#E8EDEC;
    }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text);
      background: var(--bg);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--teal); text-decoration: none; }
    a:hover { color: var(--teal-dark); text-decoration: underline; }

    /* ── Nav ── */
    .nav {
      position: sticky; top: 0; z-index: 100;
      padding: 16px 28px;
      border-bottom: 1px solid var(--border-soft);
      background: rgba(255,255,255,0.9);
      backdrop-filter: saturate(180%) blur(12px);
      display: flex; align-items: center; justify-content: space-between;
    }
    .nav-brand {
      display: inline-flex; align-items: center; gap: 10px;
      text-decoration: none; color: var(--text);
    }
    .nav-brand img { width: 30px; height: 30px; }
    .nav-brand-name { font-size: 15px; font-weight: 800; letter-spacing: -0.2px; }
    .nav-back {
      font-size: 13.5px; font-weight: 500; color: var(--text-muted);
      text-decoration: none; display: flex; align-items: center; gap: 6px;
    }
    .nav-back:hover { color: var(--teal-dark); text-decoration: none; }
    .nav-back svg { flex-shrink: 0; }

    /* ── Page layout ── */
    .page-wrap {
      flex: 1;
      max-width: 760px;
      width: 100%;
      margin: 0 auto;
      padding: 56px 28px 80px;
    }

    /* ── Header ── */
    .doc-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--teal-50); color: var(--teal-dark);
      font-size: 12px; font-weight: 700; letter-spacing: 0.6px;
      text-transform: uppercase;
      padding: 5px 12px; border-radius: 20px;
      margin-bottom: 20px;
    }
    .doc-title {
      font-size: 40px; font-weight: 800;
      letter-spacing: -1px; line-height: 1.1;
      color: var(--text);
      margin-bottom: 10px;
    }
    .doc-title em {
      font-family: 'Source Serif 4', serif;
      font-style: italic; font-weight: 400;
      color: var(--teal-dark);
    }
    .doc-meta {
      font-size: 13.5px; color: var(--text-muted);
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--border-soft);
    }

    /* ── Table of contents ── */
    .toc {
      background: var(--teal-50);
      border: 1px solid var(--teal-100);
      border-radius: 12px;
      padding: 22px 26px;
      margin-bottom: 48px;
    }
    .toc-title {
      font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
      text-transform: uppercase; color: var(--teal-dark);
      margin-bottom: 14px;
    }
    .toc ol {
      list-style: decimal; padding-left: 20px;
      display: flex; flex-direction: column; gap: 7px;
    }
    .toc li a {
      font-size: 14px; font-weight: 500; color: var(--teal-dark);
      text-decoration: none;
    }
    .toc li a:hover { text-decoration: underline; }

    /* ── Content ── */
    .doc-section {
      margin-bottom: 44px;
      scroll-margin-top: 80px;
    }
    .doc-section h2 {
      font-size: 20px; font-weight: 700;
      letter-spacing: -0.3px; color: var(--text);
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-soft);
    }
    .doc-section h3 {
      font-size: 15.5px; font-weight: 700;
      color: var(--text); margin: 20px 0 8px;
    }
    .doc-section p {
      font-size: 15px; line-height: 1.75;
      color: var(--text-soft); margin-bottom: 14px;
    }
    .doc-section ul, .doc-section ol {
      padding-left: 22px;
      display: flex; flex-direction: column; gap: 8px;
      margin-bottom: 16px;
    }
    .doc-section li {
      font-size: 15px; line-height: 1.7;
      color: var(--text-soft);
    }
    .doc-section strong { color: var(--text); font-weight: 600; }
    .doc-section a { color: var(--teal); }

    /* Callout box */
    .callout {
      background: var(--teal-50);
      border-left: 3px solid var(--teal);
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .callout p { margin: 0; font-size: 14.5px; }

    /* ── Footer ── */
    .footer {
      padding: 28px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      border-top: 1px solid var(--border-soft);
      background: var(--bg-warm);
    }
    .footer a { color: var(--text-muted); }
    .footer a:hover { color: var(--teal-dark); }
    .footer-links {
      display: flex; justify-content: center; gap: 24px;
      margin-bottom: 10px; flex-wrap: wrap;
    }

    @media (max-width: 600px) {
      .page-wrap { padding: 36px 20px 60px; }
      .doc-title { font-size: 30px; }
      .nav { padding: 14px 18px; }
    }
  </style>
</head>
<body>

<nav class="nav">
  <a href="{{ url('/') }}" class="nav-brand">
    @include('partials.geneorx-brand', ['variant' => 'full', 'logoSize' => 'nav', 'showName' => false, 'href' => url('/')])
  </a>
  <a href="{{ url('/') }}" class="nav-back">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Back to home
  </a>
</nav>

<main class="page-wrap">
  @yield('doc-content')
</main>

<footer class="footer">
  <div class="footer-links">
    <a href="{{ url('/') }}">Home</a>
    <a href="{{ url('/legal/privacy') }}">Privacy Policy</a>
    <a href="{{ url('/legal/terms') }}">Terms of Service</a>
    <a href="mailto:info@geneorx.com">Contact</a>
  </div>
  <span>&copy; {{ date('Y') }} GeneoRx &mdash; Educational guidance only, not medical advice.</span>
</footer>

</body>
</html>
