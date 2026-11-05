<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>GeneoRx — A clearer picture of your health</title>
  @include('partials.logo-head')
  @include('partials.brand-logo-styles')
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/clean-ui.css') }}">
  <link rel="stylesheet" href="{{ asset('css/home-clean.css') }}">
</head>
<body class="gx-clean gx-home">
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header">
  <nav class="site-nav" aria-label="Main navigation">
    @include('partials.geneorx-brand', ['variant' => 'mark', 'size' => 34])
    <div class="site-links">
      <a href="#how-it-works" data-i18n="clean.how">How it works</a>
    </div>
    <div class="site-actions">
      @include('partials.language-selector')
      @auth
        @include('partials.staff-links')
        <a class="gx-button gx-button-primary" href="{{ route('treatments') }}" data-i18n="nav.dashboard">Open dashboard</a>
      @else
        <a class="signin-link" href="{{ route('login') }}" data-i18n="nav.signin">Sign in</a>
        <a class="gx-button gx-button-primary" href="{{ route('register') }}" data-i18n="clean.start">Get started</a>
      @endauth
    </div>
  </nav>
</header>
<main id="main-content">
  <section class="landing-hero">
    <div class="hero-copy">
      <div class="eyebrow" data-i18n="hero.eyebrow">Personal medication intelligence</div>
      <h1 data-i18n="clean.headline">Your health.<br>A little clearer.</h1>
      <p class="hero-description" data-i18n="clean.description">Bring your medications, symptoms, and wellbeing together. Understand your patterns and feel more prepared for your next doctor visit.</p>
      <div class="hero-actions">
        @auth
          <a class="gx-button gx-button-primary gx-button-large" href="{{ route('treatments') }}" data-i18n="nav.dashboard">Open dashboard</a>
        @else
          <a class="gx-button gx-button-primary gx-button-large" href="{{ route('register') }}" data-i18n="clean.create">Create your account</a>
          <a class="gx-text-link" href="{{ route('guest') }}"><span data-i18n="clean.try">Try as a guest</span> <span aria-hidden="true">↗</span></a>
        @endauth
      </div>
      <p class="hero-footnote" data-i18n="clean.note">A guided space for better health conversations.</p>
    </div>
    <div class="product-scene">
      <svg class="hero-art" viewBox="0 0 320 250" aria-hidden="true" focusable="false">
        <circle cx="160" cy="125" r="118" fill="#E4EEDF"/>
        <circle cx="160" cy="125" r="108" fill="none" stroke="#E2725B" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>
        <circle cx="160" cy="125" r="86" fill="#16352B"/>
        <g transform="rotate(-35 160 125)"><path d="M160 101h-38a24 24 0 0 0 0 48h38z" fill="#E2725B"/><path d="M160 101h38a24 24 0 0 1 0 48h-38z" fill="#FFFBF3"/><rect x="128" y="108" width="24" height="5" rx="2.5" fill="#fff" opacity=".4"/></g>
        <circle cx="256" cy="44" r="15" fill="#E2725B"/>
        <g transform="translate(44 232) scale(.62)"><path d="M0 0C10-70 60-120 130-170" fill="none" stroke="#24503F" stroke-width="4" stroke-linecap="round"/><g fill="#24503F"><path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(8 -44) rotate(-20)"/><path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(10 -48) rotate(-150)"/><path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(40 -92) rotate(-35)"/><path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(42 -96) rotate(-155)"/><path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(84 -134) rotate(-40)"/></g></g>
      </svg>
    </div>
  </section>
  <section class="content-section explain-section" id="how-it-works">
    <div class="section-heading"><div class="eyebrow" data-i18n="clean.how">How it works</div><h2 data-i18n="clean.how_title">A simple start.<br>A clearer path forward.</h2></div>
    @php
      $slides = require resource_path('data/intro_slides.php');
    @endphp
    <div class="explain-grid">
      @foreach($slides as $i => $slide)
        @php
          $paragraphs = $slide['paragraphs'] ?? [];
          $bullets = array_map(fn ($b) => is_array($b) ? ($b['strong'].$b['text']) : $b, $slide['bullets'] ?? []);
        @endphp
        <article class="explain-card{{ !empty($slide['accent']) ? ' explain-accent' : '' }}">
          <span class="explain-num" aria-hidden="true">{{ $slide['num'] }}</span>
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
  <section class="start-section"><div class="eyebrow" data-i18n="clean.next">Your next step</div><h2 data-i18n="clean.cta">Start with you.</h2><p data-i18n="clean.cta_sub">A little more clarity begins with your first step.</p><a class="gx-button gx-button-primary gx-button-large" href="{{ route(auth()->check() ? 'treatments' : 'register') }}" data-i18n="clean.start">Get started</a></section>
</main>
<footer class="site-footer"><div class="footer-inner"><span>© {{ date('Y') }} GeneoRx</span><p data-i18n="clean.educational">Educational guidance only. Discuss health decisions with your clinician.</p><div><a href="{{ route('legal.privacy') }}" data-i18n="clean.privacy">Privacy</a><a href="{{ route('legal.terms') }}" data-i18n="clean.terms">Terms</a><a href="mailto:info@geneorx.com" data-i18n="clean.contact">Contact</a></div></div></footer>
@include('partials.ask-widget')
</body>
</html>
