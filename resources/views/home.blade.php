<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GeneoRx   Personal medication intelligence</title>
<link rel="icon" type="image/svg+xml" href="{{ asset('logo.svg') }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:ital,opsz,wght@1,8..60,400&display=swap" rel="stylesheet">
<style>
  :root {
    --bg0:         #070A12;
    --bg1:         #0B1022;
    --card:        rgba(15, 23, 54, 0.72);
    --card2:       rgba(16, 27, 64, 0.58);
    --stroke:      #24325E;

    --teal:        #28E1FF;
    --teal-dark:   #1E9BB8;
    --teal-deeper: #0B1022;
    --teal-light:  #5EEBFF;
    --teal-50:     rgba(40, 225, 255, 0.08);
    --teal-100:    rgba(40, 225, 255, 0.14);
    --teal-200:    rgba(40, 225, 255, 0.22);

    --cream:       #0B1022;
    --cream-soft:  #101B40;

    --bg:          #070A12;
    --bg-soft:     #0B1022;
    --bg-muted:    rgba(15, 23, 54, 0.72);
    --bg-warm:     #0B1022;

    --text:        #EAF0FF;
    --text-soft:   #A9B4D6;
    --text-muted:  #7E8AB8;
    --text-dim:    #5A6490;

    --border:      rgba(255, 255, 255, 0.12);
    --border-soft: rgba(255, 255, 255, 0.08);
    --border-warm: rgba(255, 255, 255, 0.10);

    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.25);
    --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.28);
    --shadow:    0 6px 24px rgba(0, 0, 0, 0.35);
    --shadow-lg: 0 18px 48px rgba(0, 0, 0, 0.42);
    --shadow-xl: 0 30px 80px rgba(0, 0, 0, 0.50);

    --hero-accent: #28E1FF;
    --hero-accent-dark: #1E9BB8;
    --hero-accent-rgb: 40, 225, 255;
    --hero-accent-light-rgb: 94, 235, 255;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--text);
    background:
      radial-gradient(1200px 700px at 20% -10%, rgba(40, 225, 255, 0.12), transparent 60%),
      radial-gradient(900px 600px at 80% 10%, rgba(167, 139, 250, 0.12), transparent 55%),
      radial-gradient(900px 700px at 30% 110%, rgba(255, 79, 216, 0.10), transparent 55%),
      linear-gradient(180deg, var(--bg0), var(--bg1));
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    min-height: 100vh;
  }

  ::selection { background: rgba(40, 225, 255, 0.25); color: #fff; }

  a { color: inherit; text-decoration: none; }

  /* =============================================
     NAV
  ============================================= */
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(7, 10, 18, 0.92);
    backdrop-filter: saturate(180%) blur(18px);
    -webkit-backdrop-filter: saturate(180%) blur(18px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  }
  .nav-shell {
    max-width: 1180px;
    margin: 0 auto;
  }
  .nav-intro {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 28px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background:
      linear-gradient(180deg, rgba(40, 225, 255, 0.04), transparent 70%);
  }
  .nav-tagline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    width: fit-content;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 1.65px;
    text-transform: uppercase;
    color: var(--teal-light);
  }
  .nav-tagline::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--teal-light), var(--teal-dark));
    box-shadow: 0 0 14px rgba(40, 225, 255, 0.55);
    flex-shrink: 0;
  }
  .nav-lead {
    margin: 0;
    max-width: 640px;
    font-size: 14px;
    line-height: 1.55;
    font-weight: 400;
    color: var(--text-muted);
  }
  .nav-inner {
    padding: 12px 28px 14px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .nav-brand-wrap {
    margin-right: auto;
    min-width: 0;
  }
  .nav-brand-wrap .geneorx-brand { flex-shrink: 0; }
  .nav-brand-wrap .geneorx-brand-name {
    font-size: 18px;
    letter-spacing: -0.35px;
  }
  .nav-brand-wrap .geneorx-brandmark {
    box-shadow: 0 10px 28px rgba(40, 225, 255, 0.16);
  }
  .mobile-menu-intro {
    display: none;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .mobile-menu-intro .nav-tagline { margin-bottom: 8px; }
  .mobile-menu-intro .nav-lead {
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-soft);
  }
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
    font-size: 16.5px;
    font-weight: 800;
    letter-spacing: -0.3px;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 26px;
    margin-right: 18px;
  }
  .nav-link {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-soft);
    transition: color 0.15s;
    position: relative;
    padding-bottom: 2px;
  }
  .nav-link:hover { color: var(--teal-light); }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -3px; left: 0; right: 0;
    height: 2px;
    background: var(--teal);
    border-radius: 2px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.2s ease;
  }
  .nav-link:hover::after  { transform: scaleX(1); }
  .nav-link.active        { color: var(--teal-dark); font-weight: 600; }
  .nav-link.active::after { transform: scaleX(1); }
  .nav-cta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .nav-toggle {
    display: none;
    width: 44px; height: 44px;
    border: 1px solid var(--border);
    background: var(--bg);
    border-radius: 10px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    padding: 0;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .nav-toggle span {
    display: block;
    width: 18px; height: 1.8px;
    background: var(--text);
    border-radius: 2px;
    transition: transform 0.2s, opacity 0.2s;
  }
  .nav-toggle[aria-expanded="true"] span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
  .nav-toggle[aria-expanded="true"] span:nth-child(2) { opacity: 0; }
  .nav-toggle[aria-expanded="true"] span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

  .mobile-menu {
    display: none;
    position: fixed;
    top: 64px; left: 0; right: 0;
    background: rgba(11, 16, 34, 0.98);
    border-bottom: 1px solid var(--border);
    padding: 16px 28px 24px;
    z-index: 99;
    box-shadow: var(--shadow-lg);
  }
  .mobile-menu.open { display: block; }
  .mobile-menu-lang {
    margin-bottom: 14px;
  }
  .mobile-menu-cta {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .mobile-menu-cta .btn { width: 100%; height: 50px; font-size: 15px; border-radius: 12px; }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0 18px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 9px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.18s ease;
    font-family: inherit;
    white-space: nowrap;
  }
  .btn-primary  {
    background: var(--teal);
    color: #070A12;
    box-shadow: 0 1px 0 rgba(0,0,0,0.15), 0 6px 18px rgba(40, 225, 255, 0.22);
  }
  .btn-primary:hover  {
    background: var(--teal-light);
    transform: translateY(-1px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.15), 0 10px 24px rgba(40, 225, 255, 0.30);
  }
  .btn-outline {
    background: transparent;
    color: var(--text);
    border-color: var(--border);
  }
  .btn-outline:hover {
    border-color: var(--teal);
    color: var(--teal-light);
  }
  .btn-ghost   { background: transparent; color: var(--text-soft); }
  .btn-ghost:hover   { background: var(--bg-muted); color: var(--text); }
  .btn-dark {
    background: var(--text);
    color: #fff;
  }
  .btn-dark:hover { background: var(--teal-deeper); transform: translateY(-1px); }
  .btn-lg       { height: 50px; padding: 0 26px; font-size: 15px; }

  /* =============================================
     HERO
  ============================================= */
  .hero {
    position: relative;
    overflow: hidden;
    padding: 80px 0 0;
    background: transparent;
    transition: background 0.7s ease;
  }
  @media (max-width: 520px) {
    .hero { background: transparent; }
  }
  .hero::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 24% 28%, rgba(40, 225, 255, 0.08), transparent 24%),
      radial-gradient(circle at 72% 42%, rgba(167, 139, 250, 0.08), transparent 28%);
    opacity: 0.7;
    animation: heroAmbientDrift 18s ease-in-out infinite alternate;
  }

  .hero-logo-float {
    position: absolute;
    width: min(360px, 42vw);
    height: min(360px, 42vw);
    right: 8%;
    top: 22%;
    pointer-events: none;
    opacity: 0.055;
    background: center / contain no-repeat url('{{ asset('logo.svg') }}');
    filter: saturate(1.25);
    mix-blend-mode: screen;
    animation: heroLogoFloat 14s ease-in-out infinite alternate;
    z-index: 0;
  }

  .hero-orbits {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .hero-orbits::before,
  .hero-orbits::after {
    content: '';
    position: absolute;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    animation: orbitPulse 12s ease-in-out infinite;
  }
  .hero-orbits::before {
    width: 800px; height: 800px;
    right: -240px; top: -200px;
    animation-duration: 18s;
  }
  .hero-orbits::after {
    width: 540px; height: 540px;
    right: -110px; top: -60px;
    border-color: rgba(40, 225, 255, 0.12);
    animation-delay: 3s;
    animation-duration: 15s;
  }
  @keyframes heroAmbientDrift {
    0% { background-position: 0% 40%, 100% 50%, 0 100%; opacity: 0.42; }
    50% { background-position: 38% 24%, 62% 68%, 0 100%; opacity: 0.62; }
    100% { background-position: 72% 52%, 28% 36%, 0 100%; opacity: 0.48; }
  }
  @keyframes heroLogoFloat {
    0% { transform: translate3d(-18px, 20px, 0) rotate(-8deg) scale(0.92); opacity: 0.04; }
    50% { transform: translate3d(12px, -12px, 0) rotate(6deg) scale(1.05); opacity: 0.075; }
    100% { transform: translate3d(34px, 18px, 0) rotate(-3deg) scale(0.98); opacity: 0.052; }
  }
  @keyframes orbitPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05) rotate(4deg); opacity: 0.58; }
  }
  @keyframes heroBlockIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Decorative dots in hero */
  .hero-dots {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .hero-dots span {
    position: absolute;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--teal);
    opacity: 0.10;
    animation: heroDotFloat 9s ease-in-out infinite;
  }
  .hero-dots span:nth-child(1) { top: 15%; left: 8%; width: 8px; height: 8px; opacity: 0.08; animation-delay: 0s; }
  .hero-dots span:nth-child(2) { top: 35%; left: 3%; width: 5px; height: 5px; opacity: 0.12; animation-delay: 1.6s; }
  .hero-dots span:nth-child(3) { bottom: 20%; left: 12%; opacity: 0.07; animation-delay: 3.1s; }
  .hero-dots span:nth-child(4) { top: 10%; right: 15%; width: 4px; height: 4px; opacity: 0.10; animation-delay: 2.3s; }
  .hero-dots span:nth-child(5) { bottom: 30%; right: 5%; width: 7px; height: 7px; opacity: 0.06; animation-delay: 4s; }
  @keyframes heroDotFloat {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(14px, -18px, 0) scale(1.45); }
  }

  .hero-inner {
    position: relative;
    max-width: 960px;
    margin: 0 auto;
    padding: 32px 28px 80px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .hero-trust-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 28px;
    animation: heroBlockIn 0.55s ease 0.24s forwards;
    opacity: 0;
    transform: translateY(16px);
  }
  .hero-trust-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 8px 13px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.84);
    border: 1px solid rgba(176, 220, 208, 0.82);
    box-shadow: 0 8px 22px rgba(15, 31, 27, 0.06);
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    backdrop-filter: blur(10px);
  }
  .hero-trust-pill::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--teal-light), var(--teal-dark));
    box-shadow: 0 0 0 4px rgba(63, 179, 154, 0.12);
  }

  .hero-actions {
    display: flex;
    gap: 14px;
    align-items: center;
    flex-wrap: wrap;
  }
  .hero-actions .btn-dark {
    box-shadow: 0 2px 0 rgba(0,0,0,0.06), 0 8px 24px rgba(15, 31, 27, 0.18);
  }
  .hero-actions .btn-dark:hover {
    box-shadow: 0 2px 0 rgba(0,0,0,0.06), 0 14px 36px rgba(14, 124, 102, 0.28);
  }
  .hero-actions .btn-outline {
    box-shadow: var(--shadow-xs);
  }
  .hero-actions .btn-outline:hover {
    box-shadow: 0 6px 20px rgba(14, 124, 102, 0.12);
  }

  /* HERO INFO — static banner grid */
  .hero-info-banners {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
  }

  .hero-info-block {
    position: relative;
    padding: 22px 22px 20px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(16px);
    animation: heroBlockIn 0.55s ease forwards;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    overflow: hidden;
  }
  .hero-info-block:nth-child(1) { animation-delay: 0.28s; }
  .hero-info-block:nth-child(2) { animation-delay: 0.36s; }
  .hero-info-block:nth-child(3) { animation-delay: 0.44s; }
  .hero-info-block:nth-child(4) { animation-delay: 0.52s; }
  .hero-info-block::before {
    content: '';
    display: block;
    width: 44px;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--slide-accent), transparent);
    margin-bottom: 14px;
    opacity: 0.85;
  }
  .hero-info-block:hover {
    transform: translateY(-4px);
    border-color: rgba(var(--slide-accent-rgb), 0.28);
    box-shadow: 0 16px 40px rgba(var(--slide-accent-rgb), 0.12);
  }

  .hero-info-teal {
    --slide-accent: #28E1FF;
    --slide-accent-dark: #1E9BB8;
    --slide-accent-rgb: 40, 225, 255;
  }
  .hero-info-blue {
    --slide-accent: #5EEBFF;
    --slide-accent-dark: #2B7A9B;
    --slide-accent-rgb: 43, 122, 155;
  }
  .hero-info-violet {
    --slide-accent: #A78BFA;
    --slide-accent-dark: #6B5B95;
    --slide-accent-rgb: 107, 91, 149;
  }
  .hero-info-amber {
    --slide-accent: #FBBF24;
    --slide-accent-dark: #C17D3A;
    --slide-accent-rgb: 193, 125, 58;
  }

  .hero-slide-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }
  .hero-slide-tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--slide-accent);
    background: transparent;
    border: none;
  }
  .hero-slide-counter { display: none; }

  .hero-slide-title-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 18px;
  }
  .hero-info-block h3 {
    font-size: clamp(18px, 2.2vw, 22px);
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -0.4px;
    color: var(--text);
    margin: 0;
    padding: 2px 0 0;
  }
  .hero-info-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #070A12;
    background: linear-gradient(135deg, var(--slide-accent), var(--slide-accent-dark));
    box-shadow: 0 8px 24px rgba(var(--slide-accent-rgb), 0.22);
  }
  .hero-info-icon svg { width: 22px; height: 22px; stroke: currentColor; }

  .hero-slide-body p {
    font-size: 14px;
    color: var(--text-soft);
    line-height: 1.6;
    margin: 0 0 10px;
  }
  .hero-slide-body ul {
    list-style: none;
    padding: 0;
    margin: 0 0 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .hero-slide-body li {
    position: relative;
    padding-left: 20px;
    font-size: 13.5px;
    color: var(--text-soft);
    line-height: 1.55;
  }
  .hero-slide-body li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--slide-accent);
    box-shadow: 0 0 12px rgba(var(--slide-accent-rgb), 0.45);
  }
  .hero-slide-body li strong { color: var(--text); font-weight: 600; }

  .hero-info-teal .hero-info-icon   { background: linear-gradient(135deg, #28E1FF, #1E9BB8); }
  .hero-info-blue .hero-info-icon   { background: linear-gradient(135deg, #5EEBFF, #2B7A9B); color: #070A12; }
  .hero-info-violet .hero-info-icon { background: linear-gradient(135deg, #A78BFA, #6B5B95); color: #fff; }
  .hero-info-amber .hero-info-icon  { background: linear-gradient(135deg, #FBBF24, #C17D3A); color: #070A12; }

  /* =============================================
     SECTION TYPE
  ============================================= */
  section { scroll-margin-top: 80px; }
  .section-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--teal-dark);
    text-transform: uppercase;
    letter-spacing: 1.6px;
    margin-bottom: 16px;
  }
  .section-tag::before {
    content: '';
    width: 24px; height: 2px;
    background: var(--teal);
    border-radius: 2px;
  }
  .section-title {
    font-size: 42px;
    line-height: 1.12;
    font-weight: 800;
    letter-spacing: -1px;
    color: var(--text);
    margin-bottom: 14px;
  }
  .section-title em {
    font-family: 'Source Serif 4', serif;
    font-style: italic;
    font-weight: 400;
    color: var(--teal-dark);
    position: relative;
  }
  .section-title em::after {
    content: '';
    position: absolute;
    bottom: 1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, var(--teal), var(--teal-light));
    border-radius: 2px;
    opacity: 0.25;
  }
  .section-desc {
    font-size: 16.5px;
    color: var(--text-soft);
    max-width: 620px;
    line-height: 1.65;
  }

  /* =============================================
     STEPS   HOW IT WORKS
  ============================================= */
  .steps-section {
    background: var(--bg-warm);
    padding: 110px 0;
    position: relative;
    overflow: hidden;
  }
  .steps-section::before {
    content: '';
    position: absolute;
    top: -200px; right: -200px;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(14, 124, 102, 0.06), transparent 70%);
  }
  .steps-inner {
    position: relative;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 28px;
  }
  .steps-head { text-align: center; margin-bottom: 64px; }
  .steps-head .section-tag { justify-content: center; }
  .steps-head .section-desc { margin: 0 auto; }

  .steps-flow {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    position: relative;
  }
  .step-card {
    background:
      linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,252,251,0.94));
    border: 1px solid rgba(221, 230, 227, 0.88);
    border-radius: 22px;
    padding: 34px 30px;
    position: relative;
    transition: all 0.28s ease;
    box-shadow: 0 10px 30px rgba(15, 31, 27, 0.045);
    overflow: hidden;
  }
  .step-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 85% 12%, rgba(63, 179, 154, 0.14), transparent 34%),
      linear-gradient(90deg, rgba(14, 124, 102, 0.10), transparent 34%);
    opacity: 0;
    transition: opacity 0.28s ease;
    pointer-events: none;
  }
  .step-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 58px rgba(14, 124, 102, 0.14);
    border-color: var(--teal-100);
  }
  .step-card:hover::before { opacity: 1; }
  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px; height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--teal-50), var(--teal-100));
    color: var(--teal-dark);
    font-size: 20px;
    font-weight: 800;
    font-family: 'Source Serif 4', serif;
    font-style: italic;
    margin-bottom: 22px;
    box-shadow: 0 4px 12px rgba(14, 124, 102, 0.10);
    transition: all 0.28s ease;
  }
  .step-card:hover .step-num {
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    color: #fff;
    box-shadow: 0 6px 18px rgba(14, 124, 102, 0.25);
  }
  .step-card h3 {
    position: relative;
    font-size: 19px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.3px;
    margin-bottom: 10px;
  }
  .step-card p {
    position: relative;
    font-size: 14.5px;
    color: var(--text-soft);
    line-height: 1.65;
  }

  /* =============================================
     DEMO
  ============================================= */
  .demo-section {
    background: var(--bg);
    padding: 110px 0;
  }
  .demo {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 28px;
  }
  .demo-head { text-align: center; margin-bottom: 48px; }
  .demo-head .section-tag { justify-content: center; }
  .demo-head .section-desc { margin: 0 auto; }

  .demo-card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(221, 230, 227, 0.9);
    border-radius: 24px;
    overflow: hidden;
    box-shadow:
      0 30px 70px rgba(7, 95, 79, 0.10),
      0 8px 22px rgba(15, 31, 27, 0.06);
    position: relative;
  }
  .demo-card::before {
    content: '';
    position: absolute;
    top: -130px;
    right: -120px;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(63, 179, 154, 0.18), transparent 66%);
    pointer-events: none;
  }
  .demo-card-hd {
    position: relative;
    padding: 28px 32px;
    border-bottom: 1px solid var(--border-soft);
    background:
      radial-gradient(circle at 95% 10%, rgba(63, 179, 154, 0.16), transparent 32%),
      linear-gradient(180deg, var(--bg-soft), var(--bg));
  }
  .demo-card-hd h3 {
    font-size: 19px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 5px;
    letter-spacing: -0.3px;
  }
  .demo-card-hd p { font-size: 14px; color: var(--text-muted); }
  .demo-card-bd { position: relative; padding: 32px; }

  .field { margin-bottom: 20px; }
  .field label {
    display: block;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 9px;
  }
  .field select {
    width: 100%;
    height: 50px;
    padding: 0 16px;
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--bg);
    color: var(--text);
    font-size: 15px;
    font-family: inherit;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B7B77' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
    box-shadow: 0 4px 14px rgba(15, 31, 27, 0.035);
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  }
  .field select:focus {
    border-color: var(--teal);
    box-shadow: 0 0 0 4px rgba(14, 124, 102, 0.10);
    transform: translateY(-1px);
  }

  .demo-submit {
    width: 100%;
    height: 54px;
    background: linear-gradient(135deg, var(--text) 0%, var(--teal-deeper) 100%);
    color: #fff;
    font-size: 15.5px;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.22s ease;
    letter-spacing: 0.1px;
    box-shadow: 0 4px 14px rgba(15, 31, 27, 0.15);
  }
  .demo-submit:hover {
    background: linear-gradient(135deg, var(--teal-dark) 0%, var(--teal-deeper) 100%);
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(14, 124, 102, 0.30);
  }

  .result {
    margin-top: 28px;
    background: var(--bg-soft);
    border: 1px solid var(--border-soft);
    border-radius: 14px;
    padding: 28px;
    display: none;
  }
  .result-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border-soft);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .result-title::before {
    content: '';
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--teal);
  }
  .result-block { margin-bottom: 18px; }
  .result-block:last-child { margin-bottom: 0; }
  .result-block h4 {
    font-size: 11px;
    font-weight: 700;
    color: var(--teal-dark);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 6px;
  }
  .result-block p {
    font-size: 15px;
    line-height: 1.65;
    color: var(--text-soft);
  }
  .result-note {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border-soft);
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.6;
  }
  .result-cta {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* =============================================
     TESTIMONIALS
  ============================================= */
  .testimonials {
    background: var(--text);
    color: #fff;
    padding: 110px 0;
    position: relative;
    overflow: hidden;
  }
  .testimonials::before {
    content: '';
    position: absolute;
    top: -300px; left: -200px;
    width: 700px; height: 700px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(63, 179, 154, 0.10), transparent 60%);
  }
  .testimonials::after {
    content: '';
    position: absolute;
    bottom: -250px; right: -150px;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(14, 124, 102, 0.12), transparent 60%);
  }
  .testimonials-inner {
    position: relative;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 28px;
  }
  .testimonials-head { text-align: center; margin-bottom: 56px; }
  .testimonials-head .section-tag { justify-content: center; color: var(--teal-light); }
  .testimonials-head .section-tag::before { background: var(--teal-light); }
  .testimonials-head .section-title { color: #fff; }
  .testimonials-head .section-desc { color: rgba(255,255,255,0.75); margin: 0 auto; }

  .testimonials-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .quote {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.045));
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 22px;
    padding: 32px;
    backdrop-filter: blur(8px);
    transition: all 0.28s ease;
    position: relative;
    overflow: hidden;
  }
  .quote::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 85% 0%, rgba(63, 179, 154, 0.16), transparent 34%);
    opacity: 0;
    transition: opacity 0.28s ease;
    pointer-events: none;
  }
  .quote:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.20);
  }
  .quote:hover::before { opacity: 1; }
  .quote-mark {
    font-family: 'Source Serif 4', serif;
    font-size: 56px;
    line-height: 0.8;
    color: var(--teal-light);
    height: 22px;
    margin-bottom: 14px;
  }
  .quote-text {
    position: relative;
    font-size: 16px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.88);
    margin-bottom: 22px;
  }
  .quote-author {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .quote-avatar {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--teal-light), var(--teal-dark));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
  }
  .quote-meta { line-height: 1.3; }
  .quote-name { font-size: 14px; font-weight: 600; color: #fff; }
  .quote-role { font-size: 12.5px; color: rgba(255, 255, 255, 0.55); }

  /* =============================================
     FAQ
  ============================================= */
  .faq-section {
    background: var(--bg);
    padding: 110px 0;
  }
  .faq-inner {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 28px;
  }
  .faq-head { text-align: center; margin-bottom: 48px; }
  .faq-head .section-tag { justify-content: center; }

  .faq-list { display: flex; flex-direction: column; gap: 10px; }
  details.faq {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(221, 230, 227, 0.92);
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
    transition: all 0.22s ease;
    box-shadow: 0 4px 16px rgba(15, 31, 27, 0.035);
  }
  details.faq:hover {
    border-color: var(--teal-200);
    box-shadow: 0 14px 34px rgba(14, 124, 102, 0.08);
    transform: translateY(-2px);
  }
  details.faq[open] {
    border-color: var(--teal-100);
    box-shadow: 0 4px 16px rgba(14, 124, 102, 0.08);
    background: linear-gradient(180deg, var(--bg) 0%, var(--teal-50) 100%);
  }
  details.faq summary {
    padding: 22px 26px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
  }
  details.faq summary::-webkit-details-marker { display: none; }
  details.faq summary::after {
    content: '+';
    width: 28px; height: 28px;
    border-radius: 50%;
    background: var(--bg-muted);
    color: var(--text-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 300;
    flex-shrink: 0;
    transition: all 0.18s ease;
  }
  details.faq[open] summary::after {
    content: '−';
    background: var(--teal);
    color: #fff;
  }
  .faq-body {
    padding: 0 26px 24px;
    font-size: 14.5px;
    line-height: 1.7;
    color: var(--text-soft);
  }

  /* =============================================
     FINAL CTA
  ============================================= */
  .final-cta {
    padding: 110px 0;
    background: transparent;
    border-top: 1px solid var(--border-soft);
  }
  .final-cta-inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 28px;
  }
  .final-cta-card {
    background:
      radial-gradient(circle at 75% 25%, rgba(40, 225, 255, 0.18), transparent 60%),
      linear-gradient(135deg, rgba(15, 23, 54, 0.95), rgba(11, 16, 34, 0.98));
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 72px 56px;
    position: relative;
    overflow: hidden;
    text-align: center;
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
  }
  .final-cta-card::before {
    content: '';
    position: absolute;
    top: -100px; left: -100px;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%);
  }
  .final-cta-card::after {
    content: '';
    position: absolute;
    bottom: -120px; right: -80px;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(63,179,154,0.20), transparent 70%);
  }
  .final-cta-content { position: relative; z-index: 1; }
  .final-cta h2 {
    font-size: 44px;
    font-weight: 800;
    letter-spacing: -1.2px;
    line-height: 1.15;
    margin-bottom: 16px;
    max-width: 700px;
    margin-left: auto; margin-right: auto;
  }
  .final-cta h2 em {
    font-family: 'Source Serif 4', serif;
    font-style: italic;
    font-weight: 400;
    color: var(--teal-light);
  }
  .final-cta p {
    font-size: 17px;
    color: rgba(255, 255, 255, 0.78);
    margin-bottom: 32px;
    max-width: 520px;
    margin-left: auto; margin-right: auto;
    line-height: 1.6;
  }
  .final-cta-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn-light {
    background: var(--teal);
    color: #070A12;
  }
  .btn-light:hover {
    background: var(--teal-light);
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(40, 225, 255, 0.22);
  }
  .btn-on-dark {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.25);
  }
  .btn-on-dark:hover {
    border-color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  /* =============================================
     FOOTER
  ============================================= */
  .footer {
    background: var(--bg);
    border-top: 1px solid var(--border-soft);
    padding: 56px 28px 36px;
  }
  .footer-inner {
    max-width: 1180px;
    margin: 0 auto;
  }
  .footer-top {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    gap: 56px;
    padding-bottom: 40px;
    border-bottom: 1px solid var(--border-soft);
  }
  .footer-brand-area {
    max-width: 320px;
  }
  .footer-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .footer-brand img { width: 30px; height: 30px; }
  .footer-brand-name { font-size: 16px; font-weight: 800; color: var(--text); letter-spacing: -0.2px; }
  .footer-tagline { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

  .footer-col h4 {
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 18px;
  }
  .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 11px; }
  .footer-col a {
    font-size: 14px;
    color: var(--text-muted);
    transition: color 0.15s;
  }
  .footer-col a:hover { color: var(--teal-light); }

  .footer-bottom {
    padding-top: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 13px;
    color: var(--text-muted);
  }

  /* =============================================
     ANIMATION ON SCROLL
  ============================================= */
  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.in {
    opacity: 1;
    transform: translateY(0);
  }

  /* =============================================
     RESPONSIVE
  ============================================= */

  @media (max-width: 1100px) {
    .nav-intro { padding: 12px 20px 10px; }
    .nav-inner { padding: 10px 20px 12px; }
    .nav-lead { font-size: 13px; max-width: 520px; }
  }

  @media (max-width: 980px) {

    .hero-inner {
      padding: 28px 24px 64px;
      max-width: 100%;
    }
    .hero-orbits { display: none !important; }

    .nav-intro { display: none; }
    .mobile-menu-intro { display: block; }

    .hero-info-banners,
    .hero-info-block {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }

    .hero-info-banners {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    /* Section / layout */
    .testimonials-grid { grid-template-columns: 1fr; }
    .steps-flow        { grid-template-columns: 1fr; }
    .section-title     { font-size: 32px; }
    .final-cta h2      { font-size: 34px; }
    .final-cta-card    { padding: 56px 32px; }
    .footer-top        { grid-template-columns: 1fr 1fr; gap: 32px; }
    .nav-links         { display: none; }
    .nav-cta .nav-cta-extra { display: none; }
    .nav-toggle        { display: inline-flex; }
  }

  /* ── Phone  ≤ 620 px ──────────────────────────────────────────────────── */
  @media (max-width: 620px) {
    .hero-info-banners { gap: 10px; }
    .nav-inner { padding: 10px 16px 12px; align-items: center; }
  }

  /* ── Phone  ≤ 520 px ──────────────────────────────────────────────────── */
  @media (max-width: 520px) {
    .hero { padding: 24px 0 0; }
    .hero-inner { padding: 20px 16px 48px; }
    .hero-trust-row { gap: 7px; margin-bottom: 18px; }
    .hero-trust-pill {
      width: 100%;
      justify-content: flex-start;
      font-size: 11.5px;
    }

    /* Info banners — tighter on small phones */
    .hero-info-block {
      padding: 18px 16px 16px;
      border-radius: 16px;
    }
    .hero-info-block h3 { font-size: 18px; }
    .hero-info-icon { width: 40px; height: 40px; }
    .hero-info-icon svg { width: 20px; height: 20px; }
    .hero-slide-body p, .hero-slide-body li { font-size: 13.5px; }

    /* Section titles */
    .section-title em::after { height: 2px; }

    /* Steps section */
    .steps-section { padding: 72px 0; }
    .step-num { width: 42px; height: 42px; font-size: 17px; border-radius: 11px; }

    /* Demo card */
    .demo-section { padding: 72px 0; }
    .demo-card-hd, .demo-card-bd { padding: 20px; }

    /* Testimonials */
    .testimonials { padding: 72px 0; }
    .step-card, .quote { padding: 24px; }

    /* FAQ */
    .faq-section { padding: 72px 0; }
    details.faq summary { padding: 18px 20px; font-size: 15px; }
    .faq-body { padding: 0 20px 20px; font-size: 14px; }

    /* Final CTA */
    .final-cta { padding: 72px 0; }
    .final-cta h2 { font-size: 26px; letter-spacing: -0.5px; }
    .final-cta-card { padding: 40px 20px; border-radius: 18px; }
    .final-cta p { font-size: 15px; }
    .final-cta-actions { flex-direction: column; }
    .final-cta-actions .btn { width: 100%; }

    /* Footer */
    .footer { padding: 40px 16px 28px; }
    .footer-top { grid-template-columns: 1fr; gap: 24px; }
    .footer-bottom { flex-direction: column; text-align: center; gap: 8px; }
  }

  /* ── Extra-small phones  ≤ 380 px ────────────────────────────────────── */
  @media (max-width: 380px) {
    .hero-inner { padding: 16px 14px 40px; }
    .section-title { font-size: 26px; }
    .final-cta h2 { font-size: 22px; }
    .final-cta-card { padding: 32px 16px; }
  }

  /* =============================================
     FIRST-VISIT INTRO MODAL
  ============================================= */
  body.intro-open { overflow: hidden; }

  .intro-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .intro-modal:not([hidden]) { pointer-events: auto; }
  .intro-modal--visible { opacity: 1; }
  .intro-modal--closing { opacity: 0; }

  .intro-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(4, 6, 12, 0.82);
    backdrop-filter: blur(10px);
  }

  .intro-panel-wrap {
    position: relative;
    width: min(100%, 620px);
    z-index: 1;
    transform: translateY(18px) scale(0.98);
    transition: transform 0.34s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .intro-modal--visible .intro-panel-wrap { transform: translateY(0) scale(1); }
  .intro-modal--closing .intro-panel-wrap { transform: translateY(12px) scale(0.98); }

  .intro-panel {
    position: relative;
    background: linear-gradient(180deg, rgba(15, 23, 54, 0.96), rgba(11, 16, 34, 0.98));
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
    display: flex;
    flex-direction: column;
    max-height: min(90vh, 760px);
  }

  .intro-panel-accent {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #28E1FF, #A78BFA, #FBBF24);
    z-index: 2;
  }

  .intro-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px 0;
    gap: 16px;
  }

  .intro-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .intro-header .geneorx-brand-name { font-size: 15px; }

  .intro-skip {
    border: 1px solid rgba(255, 255, 255, 0.10);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    padding: 8px 14px;
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }
  .intro-skip:hover {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.06);
  }

  .intro-progress {
    display: flex;
    gap: 6px;
    padding: 18px 24px 0;
  }
  .intro-progress-seg {
    flex: 1;
    height: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
    position: relative;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .intro-progress-seg::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: scaleX(0);
    transform-origin: left center;
    background: linear-gradient(90deg, #1E9BB8, #28E1FF);
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .intro-progress-seg.active::after,
  .intro-progress-seg.done::after { transform: scaleX(1); }
  .intro-progress-seg.done::after { opacity: 0.45; }


  .intro-viewport {
    overflow: hidden;
    padding: 20px 24px 0;
    flex: 1;
    min-height: 260px;
    touch-action: pan-y;
    width: 100%;
  }

  .intro-track {
    display: flex;
    width: 100%;
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  .intro-slide {
    flex: 0 0 100%;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding-right: 2px;
  }

  .intro-slide-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    color: #070A12;
    background: linear-gradient(135deg, #28E1FF, #1E9BB8);
    box-shadow: 0 8px 20px rgba(40, 225, 255, 0.16);
  }
  .intro-slide-icon svg { width: 26px; height: 26px; }
  .intro-slide--blue .intro-slide-icon { background: linear-gradient(135deg, #5EEBFF, #2B7A9B); }
  .intro-slide--violet .intro-slide-icon { background: linear-gradient(135deg, #A78BFA, #6B5B95); color: #fff; }
  .intro-slide--amber .intro-slide-icon { background: linear-gradient(135deg, #FBBF24, #C17D3A); }

  .intro-slide-tag {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.9px;
    text-transform: uppercase;
    color: var(--teal-light);
    background: rgba(40, 225, 255, 0.10);
    border: 1px solid rgba(40, 225, 255, 0.18);
    margin-bottom: 12px;
  }

  .intro-slide-title {
    font-size: clamp(24px, 4vw, 30px);
    font-weight: 800;
    letter-spacing: -0.6px;
    line-height: 1.15;
    color: var(--text);
    margin: 0 0 14px;
  }

  .intro-slide-content p {
    font-size: 16px;
    line-height: 1.7;
    color: var(--text-soft);
    margin: 0 0 12px;
  }
  .intro-slide-content ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .intro-slide-content li {
    position: relative;
    padding-left: 20px;
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-soft);
  }
  .intro-slide-content li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--teal);
    box-shadow: 0 0 10px rgba(40, 225, 255, 0.35);
  }
  .intro-slide-content li strong { color: var(--text); font-weight: 600; }

  .intro-footer {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    padding: 20px 24px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    margin-top: 8px;
  }

  .intro-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 46px;
    padding: 0 18px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.18s ease;
    border: 1px solid transparent;
  }
  .intro-nav-btn--ghost {
    justify-self: start;
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.10);
    color: var(--text-soft);
  }
  .intro-nav-btn--ghost:hover:not(:disabled) {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.18);
  }
  .intro-nav-btn--ghost:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .intro-nav-btn--primary {
    justify-self: end;
    background: linear-gradient(135deg, rgba(40, 225, 255, 0.95), rgba(94, 235, 255, 0.88));
    color: #070A12;
    border: none;
    outline: none;
    box-shadow: 0 8px 24px rgba(40, 225, 255, 0.18);
  }
  .intro-nav-btn--primary:hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
  }
  .intro-nav-btn--primary:focus-visible {
    outline: 2px solid rgba(40, 225, 255, 0.45);
    outline-offset: 2px;
  }

  .intro-step-counter {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 620px) {
    .intro-modal { padding: 12px; align-items: flex-end; }
    .intro-panel-wrap { width: 100%; }
    .intro-panel { border-radius: 20px 20px 16px 16px; max-height: 92vh; }
    .intro-viewport { padding: 16px 16px 0; min-height: 240px; }
    .intro-header, .intro-progress, .intro-footer { padding-left: 16px; padding-right: 16px; }
    .intro-footer { grid-template-columns: 1fr 1fr; }
    .intro-step-counter { grid-column: 1 / -1; order: -1; margin-bottom: 4px; }
    .intro-nav-btn--ghost { justify-self: stretch; }
    .intro-nav-btn--primary { justify-self: stretch; grid-column: 1 / -1; width: 100%; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <div class="nav-shell">
    <div class="nav-intro">
      <p class="nav-tagline" data-i18n="hero.eyebrow">Personal medication intelligence</p>
      <p class="nav-lead" data-i18n="portal.sub">Your trusted health companion for smarter medication, symptom, and nutrient support</p>
    </div>

    <div class="nav-inner">
      <div class="nav-brand-wrap">
        @include('partials.geneorx-brand', ['size' => 36, 'href' => route('home')])
      </div>

      <div class="nav-cta">
        @include('partials.language-selector')
        @auth
          <a href="{{ route('treatments') }}" class="btn btn-primary" data-i18n="nav.dashboard">Open dashboard</a>
        @else
          <a href="{{ route('guest') }}"    class="btn btn-ghost nav-cta-extra" data-i18n="nav.guest">Guest login</a>
          <a href="{{ route('login') }}"    class="btn btn-outline nav-cta-extra" data-i18n="nav.signin">Sign in</a>
          <a href="{{ route('register') }}" class="btn btn-primary" data-i18n="nav.register">Create account</a>
        @endauth
      </div>

      <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  <div class="mobile-menu" id="mobileMenu">
    <div class="mobile-menu-intro">
      <p class="nav-tagline" data-i18n="hero.eyebrow">Personal medication intelligence</p>
      <p class="nav-lead" data-i18n="portal.sub">Your trusted health companion for smarter medication, symptom, and nutrient support</p>
    </div>
    <div class="mobile-menu-lang">
      @include('partials.language-selector')
    </div>
    <div class="mobile-menu-cta">
      @auth
        <a href="{{ route('treatments') }}" class="btn btn-primary" data-i18n="nav.dashboard">Open dashboard</a>
      @else
        <a href="{{ route('guest') }}"    class="btn btn-ghost" data-i18n="nav.guest">Guest login</a>
        <a href="{{ route('login') }}"    class="btn btn-outline" data-i18n="nav.signin">Sign in</a>
        <a href="{{ route('register') }}" class="btn btn-primary" data-i18n="nav.register">Create account</a>
      @endauth
    </div>
  </div>
</nav>

@include('partials.intro-slides-data')

<!-- HERO -->
<header class="hero" id="heroSection">
  <div class="hero-orbits"></div>
  <div class="hero-logo-float" aria-hidden="true"></div>
  <div class="hero-dots"><span></span><span></span><span></span><span></span><span></span></div>
  <div class="hero-inner">
    <div class="hero-content">

      <div class="hero-info-banners">
        @foreach ($introSlides as $i => $slide)
          @include('partials.hero-slide-block', [
            'slide' => $slide,
            'index' => $i,
          ])
        @endforeach
      </div>
    </div>
  </div>
</header>

<!-- FINAL CTA -->
<section class="final-cta">
  <div class="final-cta-inner">
    <div class="final-cta-card reveal">
      <div class="final-cta-content">
        <h2 data-i18n="cta.heading">Ready for a clearer picture of your health?</h2>
        <p data-i18n="cta.sub">Join people who use GeneoRx to turn their medications and symptoms into something useful.</p>
        <div class="final-cta-actions">
          <a href="{{ route('register') }}" class="btn btn-light btn-lg" data-i18n="cta.register">Create your free account</a>
          <a href="{{ route('guest') }}" class="btn btn-on-dark btn-lg" data-i18n="cta.guest">Try as guest</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand-area">
        <div class="footer-brand">
          @include('partials.geneorx-brand', ['size' => 30, 'href' => route('home')])
        </div>
        <p class="footer-tagline">
          Personal medication intelligence. Helping you connect the dots between medications, symptoms, and nutrition.
        </p>
      </div>

      <div class="footer-col">
        <h4>Product</h4>
        <ul>
          <li><a href="{{ route('treatments') }}">Open dashboard</a></li>
          <li><a href="#" id="replayIntro">Replay intro</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Account</h4>
        <ul>
          @auth
            @if(session('is_web_guest'))
              <li><a href="{{ route('login') }}">Sign in to your account</a></li>
              <li><a href="{{ route('register') }}">Create account</a></li>
            @else
              <li><a href="{{ route('treatments') }}">Open dashboard</a></li>
            @endif
          @else
            <li><a href="{{ route('login') }}">Sign in</a></li>
            <li><a href="{{ route('register') }}">Create account</a></li>
            <li><a href="{{ route('guest') }}">Try as guest</a></li>
          @endauth
        </ul>
      </div>

      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="mailto:info@geneorx.com">Contact</a></li>
          <li><a href="{{ route('legal.privacy') }}">Privacy Policy</a></li>
          <li><a href="{{ route('legal.terms') }}">Terms of Service</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom"> 
      <span>&copy; {{ date('Y') }} GeneoRx. Educational guidance only  not medical advice.</span>
      <span>Made with care for healthier conversations.</span>
    </div>
  </div>
</footer>

@include('partials.intro-modal')

<script src="{{ asset('js/intro-modal.js') }}"></script>
<script>
  // Mobile menu
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  reveals.forEach(el => io.observe(el));
</script>
</body>
</html>
