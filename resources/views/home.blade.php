<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>GeneoRx</title>
  @include('partials.logo-head')
  @include('partials.brand-logo-styles')
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Inter:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/clean-ui.css') }}?v={{ filemtime(public_path('css/clean-ui.css')) }}">
  <link rel="stylesheet" href="{{ asset('css/home-clean.css') }}?v={{ filemtime(public_path('css/home-clean.css')) }}">
  <link rel="stylesheet" href="{{ asset('css/home-apple.css') }}?v={{ filemtime(public_path('css/home-apple.css')) }}">
</head>
<body class="gx-clean gx-home">
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header">
  <nav class="site-nav" aria-label="Main navigation">
    @include('partials.geneorx-brand', ['variant' => 'mark', 'size' => 38, 'showName' => false])
    <div class="site-links">
      <a href="#how-it-works" data-i18n="clean.how">How it works</a>
    </div>
    <div class="site-actions">
      @include('partials.language-selector')
      @auth
        @include('partials.staff-links')
        <a class="gx-button gx-button-primary" href="{{ route('treatments') }}" data-i18n="nav.dashboard">Open dashboard</a>
        <form method="POST" action="{{ route('logout') }}" class="nav-logout">@csrf<button type="submit" class="signin-link" data-i18n="mobile.profile.sign_out">Sign out</button></form>
      @else
        <a class="signin-link" href="{{ route('login') }}" data-i18n="nav.signin">Sign in</a>
        <a class="signin-link" href="{{ route('guest') }}" data-i18n="clean.try">Try as a guest</a>
        <a class="gx-button gx-button-primary" href="{{ route('register') }}" data-i18n="clean.create">Create your account</a>
      @endauth
    </div>
  </nav>
</header>
<main id="main-content">
  <section class="content-section explain-section" id="how-it-works" style="--mark:url('{{ \App\Support\LogoAssets::mark() }}'); --backdrop:url('{{ asset('images/home-backdrop.jpg') }}')">
    <span class="mark-float mf-1" aria-hidden="true"></span><span class="mark-float mf-2" aria-hidden="true"></span><span class="mark-float mf-3" aria-hidden="true"></span>
    <div class="section-heading reveal"><h2 class="vh" data-i18n="clean.how_title">A simple start. A clearer path forward.</h2>
    </div>
    @php
      $slides = require resource_path('data/intro_slides.php');
    @endphp
    @php
      $icons = [
        '<path d="M12 8v.01M11 12h1v5h1"/><circle cx="12" cy="12" r="9"/>',
        '<path d="M4 12h4l2-6 4 12 2-6h4"/>',
        '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
        '<path d="M5 13l4 4L19 7"/>',
      ];
    @endphp
    <div class="explain-grid">
      @foreach($slides as $i => $slide)
        @php
          $paragraphs = $slide['paragraphs'] ?? [];
          $bullets = array_map(fn ($b) => is_array($b) ? ($b['strong'].$b['text']) : $b, $slide['bullets'] ?? []);
        @endphp
        <article class="explain-card reveal{{ !empty($slide['accent']) ? ' explain-accent' : '' }}" style="--d:{{ $i * 110 }}ms">
          <span class="explain-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{!! $icons[$i % 4] !!}</svg></span>
          <span class="eyebrow" data-i18n="slide.{{ $i }}.tag">{{ $slide['tag'] }}</span>
          <h3 data-i18n="slide.{{ $i }}.title">{{ $slide['title'] }}</h3>
          @if(isset($paragraphs[0]))<p data-i18n="slide.{{ $i }}.p0">{{ $paragraphs[0] }}</p>@endif
          @if($bullets)
            <ul>
              @foreach($bullets as $k => $bullet)<li data-i18n="slide.{{ $i }}.b{{ $k }}">{{ $bullet }}</li>@endforeach
            </ul>
          @endif
          @if(isset($paragraphs[1]))<p data-i18n="slide.{{ $i }}.p1">{{ $paragraphs[1] }}</p>@endif
        </article>
      @endforeach
    </div>
  </section>
  <section class="start-section" style="--mark:url('{{ \App\Support\LogoAssets::mark() }}')"><span class="mark-float mf-4" aria-hidden="true"></span><div class="eyebrow" data-i18n="clean.next">Your next step</div><h2 data-i18n="clean.cta">Start with you.</h2><p data-i18n="clean.cta_sub">A little more clarity begins with your first step.</p><div class="hero-actions">@auth<a class="gx-button gx-button-primary gx-button-large" href="{{ route('treatments') }}" data-i18n="nav.dashboard">Open dashboard</a>@else<a class="gx-button gx-button-primary gx-button-large" href="{{ route('register') }}" data-i18n="clean.create">Create your account</a><a class="gx-text-link" href="{{ route('guest') }}"><span data-i18n="clean.try">Try as a guest</span> <span aria-hidden="true">&rsaquo;</span></a>@endauth</div></section>
</main>
<footer class="site-footer"><div class="footer-inner"><span>© {{ date('Y') }} GeneoRx</span><p data-i18n="clean.educational">Educational guidance only. Discuss health decisions with your clinician.</p><div><a href="{{ route('legal.privacy') }}" data-i18n="clean.privacy">Privacy</a><a href="{{ route('legal.terms') }}" data-i18n="clean.terms">Terms</a><a href="mailto:info@geneorx.com" data-i18n="clean.contact">Contact</a></div></div></footer>
@include('partials.ask-widget')
<script>
(function(){var els=document.querySelectorAll('.reveal');if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(e){e.classList.add('in')});return;}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15});els.forEach(function(e){io.observe(e)});})();
</script>
</body>
</html>
