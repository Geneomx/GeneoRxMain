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
    --teal:        #0E7C66;
    --teal-dark:   #075F4F;
    --teal-deeper: #053D33;
    --teal-light:  #3FB39A;
    --teal-50:     #ECF6F3;
    --teal-100:    #D7EDE7;
    --teal-200:    #B0DCD0;

    --cream:       #FBF8F4;
    --cream-soft:  #F5F0E8;

    --bg:          #FFFFFF;
    --bg-soft:     #F7FAF9;
    --bg-muted:    #F1F5F4;
    --bg-warm:     #FBF9F5;

    --text:        #0F1F1B;
    --text-soft:   #3C4F4A;
    --text-muted:  #6B7B77;
    --text-dim:    #9CA8A4;

    --border:      #DDE6E3;
    --border-soft: #E8EDEC;
    --border-warm: #ECE5D8;

    --shadow-xs: 0 1px 2px rgba(15, 31, 27, 0.04);
    --shadow-sm: 0 2px 6px rgba(15, 31, 27, 0.05);
    --shadow:    0 6px 24px rgba(15, 31, 27, 0.07);
    --shadow-lg: 0 18px 48px rgba(15, 31, 27, 0.12);
    --shadow-xl: 0 30px 80px rgba(7, 95, 79, 0.18);

    --hero-accent: #0E7C66;
    --hero-accent-dark: #075F4F;
    --hero-accent-rgb: 14, 124, 102;
    --hero-accent-light-rgb: 63, 179, 154;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--text);
    background: var(--bg);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  a { color: inherit; text-decoration: none; }

  ::selection { background: var(--teal-100); color: var(--teal-deeper); }

  /* =============================================
     NAV
  ============================================= */
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: saturate(180%) blur(16px);
    -webkit-backdrop-filter: saturate(180%) blur(16px);
    border-bottom: 1px solid rgba(221, 230, 227, 0.55);
  }
  .nav-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 12px 28px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: auto;
  }
  .nav-logo { width: 34px; height: 34px; }
  .nav-name {
    font-size: 16.5px;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: var(--text);
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
  .nav-link:hover { color: var(--teal-dark); }
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
    background: var(--bg);
    border-bottom: 1px solid var(--border-soft);
    padding: 16px 28px 24px;
    z-index: 99;
    box-shadow: var(--shadow);
  }
  .mobile-menu.open { display: block; }
  .mobile-menu ul { list-style: none; display: flex; flex-direction: column; gap: 2px; margin-bottom: 16px; }
  .mobile-menu li a {
    display: flex;
    align-items: center;
    padding: 14px 14px;
    min-height: 50px;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-soft);
    border-radius: 10px;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .mobile-menu li a:hover { background: var(--bg-muted); color: var(--text); }
  .mobile-menu-cta {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding-top: 16px;
    border-top: 1px solid var(--border-soft);
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
    color: #fff;
    box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 6px 18px rgba(14, 124, 102, 0.25);
  }
  .btn-primary:hover  {
    background: var(--teal-dark);
    transform: translateY(-1px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 10px 24px rgba(14, 124, 102, 0.35);
  }
  .btn-outline {
    background: transparent;
    color: var(--text);
    border-color: var(--border);
  }
  .btn-outline:hover {
    border-color: var(--teal);
    color: var(--teal-dark);
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
    background:
      radial-gradient(900px 500px at 85% 18%, rgba(63, 179, 154, 0.14), transparent 60%),
      radial-gradient(700px 400px at 10% 90%, rgba(14, 124, 102, 0.08), transparent 60%),
      radial-gradient(500px 350px at 50% 60%, rgba(14, 124, 102, 0.04), transparent 70%),
      linear-gradient(180deg, var(--bg) 0%, var(--bg-warm) 100%);
    transition: background 0.7s ease;
  }
  /* Mobile hero gets a cleaner, brighter gradient */
  @media (max-width: 520px) {
    .hero {
      background:
        radial-gradient(600px 400px at 80% 0%, rgba(14, 124, 102, 0.10), transparent 60%),
        radial-gradient(500px 300px at 10% 100%, rgba(14, 124, 102, 0.06), transparent 60%),
        linear-gradient(180deg, #FAFCFB 0%, #F0F7F5 100%);
    }
  }
  .hero::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 24% 28%, rgba(63, 179, 154, 0.12), transparent 24%),
      radial-gradient(circle at 72% 42%, rgba(14, 124, 102, 0.10), transparent 28%),
      linear-gradient(90deg, transparent 0%, var(--teal-200) 50%, transparent 100%);
    background-size: 120% 120%, 130% 130%, 100% 1px;
    background-position: 0% 40%, 100% 50%, 0 100%;
    background-repeat: no-repeat;
    opacity: 0.5;
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
    mix-blend-mode: multiply;
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
    border: 1px solid rgba(14, 124, 102, 0.06);
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
    border-color: rgba(14, 124, 102, 0.08);
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
    padding: 54px 28px 80px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 9px;
    padding: 6px 16px 6px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid var(--teal-100);
    box-shadow: 0 2px 8px rgba(14, 124, 102, 0.08);
    margin-bottom: 28px;
    backdrop-filter: blur(8px);
    animation: heroBlockIn 0.5s ease forwards;
    opacity: 0;
    transform: translateY(16px);
  }
  .hero-eyebrow-dot {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    box-shadow: 0 2px 8px rgba(14, 124, 102, 0.30);
    flex-shrink: 0;
    overflow: hidden;
    padding: 6px;
  }
  .hero-eyebrow-dot img { filter: brightness(0) invert(1); }
  .hero-eyebrow-text {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-soft);
    letter-spacing: 0.15px;
  }

  .hero-title {
    max-width: 680px;
    font-size: clamp(42px, 7vw, 76px);
    line-height: 0.96;
    letter-spacing: -3.2px;
    color: var(--text);
    font-weight: 900;
    margin: 0 0 18px;
    animation: heroBlockIn 0.55s ease 0.08s forwards;
    opacity: 0;
    transform: translateY(16px);
  }
  .hero-title em {
    position: relative;
    display: inline-block;
    font-family: 'Source Serif 4', serif;
    font-weight: 400;
    color: var(--teal-dark);
  }
  .hero-title em::after {
    content: '';
    position: absolute;
    left: 2%;
    right: 2%;
    bottom: 7px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(63, 179, 154, 0.28), rgba(14, 124, 102, 0.12));
    z-index: -1;
  }
  .hero-subtitle {
    max-width: 620px;
    font-size: 18px;
    line-height: 1.72;
    color: var(--text-soft);
    margin-bottom: 24px;
    animation: heroBlockIn 0.55s ease 0.16s forwards;
    opacity: 0;
    transform: translateY(16px);
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
    margin-top: 8px;
    padding-top: 10px;
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

  /* HERO INFO — attractive carousel */
  .hero-info-slider {
    margin-top: 0;
    width: 100%;
    --slide-accent: var(--hero-accent);
    --slide-accent-dark: var(--hero-accent-dark);
    --slide-accent-rgb: var(--hero-accent-rgb);
    --slide-accent-light-rgb: var(--hero-accent-light-rgb);
    animation: heroBlockIn 0.6s ease 0.32s forwards;
    opacity: 0;
    transform: translateY(16px);
    transition: color 0.35s ease;
  }

  .hero-info-stage {
    position: relative;
  }

  .hero-info-glow {
    position: absolute;
    inset: -8% -6% 8%;
    background:
      radial-gradient(circle at 12% 20%, rgba(var(--slide-accent-light-rgb), 0.34), transparent 48%),
      radial-gradient(circle at 82% 72%, rgba(var(--slide-accent-rgb), 0.20), transparent 50%),
      radial-gradient(circle at 52% 0%, rgba(255, 255, 255, 0.95), transparent 36%);
    filter: blur(30px);
    pointer-events: none;
    z-index: 0;
    animation: heroSlideGlow 10s ease-in-out infinite alternate;
    transition: background 0.55s ease;
  }

  @keyframes heroSlideGlow {
    0% { transform: translate3d(-12px, 8px, 0) scale(0.98); opacity: 0.72; }
    100% { transform: translate3d(18px, -12px, 0) scale(1.04); opacity: 1; }
  }

  .hero-info-card-wrap {
    position: relative;
    z-index: 1;
    background: transparent;
    border-radius: 0;
    overflow: visible;
    box-shadow: none;
    border: none;
    outline: none;
    backdrop-filter: none;
  }
  .hero-info-card-wrap::before {
    content: none;
  }
  .hero-info-card-wrap::after {
    content: none;
  }

  .hero-info-progress {
    position: relative;
    z-index: 2;
    height: 4px;
    background: rgba(var(--slide-accent-rgb), 0.09);
    border-radius: 999px;
    max-width: 72%;
    margin: 0 auto 10px;
    overflow: hidden;
  }
  .hero-info-progress-fill {
    height: 100%;
    width: 50%;
    background: linear-gradient(90deg, var(--slide-accent-dark), var(--slide-accent));
    border-radius: 0 2px 2px 0;
    transition: width 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hero-info-viewport {
    position: relative;
    min-height: 330px;
    z-index: 2;
  }

  .hero-info-block {
    position: absolute;
    inset: 0;
    padding: 34px 72px;
    border-radius: 0;
    background: transparent;
    border: none;
    box-shadow: none;
    opacity: 0;
    visibility: hidden;
    transform: translateX(28px) scale(0.975);
    transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                visibility 0.5s;
    pointer-events: none;
    overflow: hidden;
  }
  .hero-info-block::before {
    content: none;
  }
  .hero-info-block.active {
    opacity: 1;
    visibility: visible;
    transform: translateX(0) scale(1);
    pointer-events: auto;
  }
  .hero-info-block.active h3 { animation: infoItemIn 0.45s ease 0.05s forwards; opacity: 0; }
  .hero-info-block.active p  { animation: infoItemIn 0.45s ease 0.12s forwards; opacity: 0; }
  .hero-info-block.active ul  { animation: infoItemIn 0.45s ease 0.18s forwards; opacity: 0; }
  @keyframes infoItemIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .hero-info-num {
    position: absolute;
    top: 24px;
    right: 26px;
    font-size: 13px;
    font-weight: 800;
    color: var(--teal-dark);
    letter-spacing: 0.5px;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(var(--slide-accent-rgb), 0.09);
    border: none;
    box-shadow: 0 8px 22px rgba(14, 124, 102, 0.07);
  }

  .hero-info-block h3 {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text);
    letter-spacing: -0.2px;
    padding-right: 64px;
  }
  .hero-info-icon {
    width: 52px; height: 52px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    box-shadow: 0 12px 28px rgba(14, 124, 102, 0.22);
  }
  .hero-info-icon svg { width: 23px; height: 23px; }
  .hero-info-block p {
    font-size: 15.5px;
    color: var(--text-soft);
    line-height: 1.65;
    margin: 0;
    padding-left: 64px;
  }
  .hero-info-block p + p { margin-top: 10px; }
  .hero-info-block ul {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    padding-left: 64px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .hero-info-block li {
    position: relative;
    padding-left: 18px;
    font-size: 15px;
    color: var(--text-soft);
    line-height: 1.55;
  }
  .hero-info-block li::before {
    content: '';
    position: absolute;
    left: 0; top: 9px;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--slide-accent);
    opacity: 0.55;
  }
  .hero-info-block li strong { color: var(--text); font-weight: 600; }

  .hero-info-teal .hero-info-icon   { background: linear-gradient(135deg, var(--teal), var(--teal-dark)); }
  .hero-info-blue .hero-info-icon   { background: linear-gradient(135deg, #2B7A9B, #1E5A73); }
  .hero-info-violet .hero-info-icon { background: linear-gradient(135deg, #6B5B95, #4E4170); }
  .hero-info-amber .hero-info-icon  { background: linear-gradient(135deg, #C17D3A, #9A5E22); }

  .hero-info-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgba(176, 220, 208, 0.6);
    background: rgba(255, 255, 255, 0.78);
    color: var(--text-soft);
    opacity: 0.36;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(15, 31, 27, 0.08);
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .hero-info-stage:hover .hero-info-arrow,
  .hero-info-arrow:focus-visible {
    opacity: 1;
  }
  .hero-info-arrow:hover {
    color: var(--slide-accent-dark);
    box-shadow: 0 8px 24px rgba(var(--slide-accent-rgb), 0.18);
    transform: translateY(-50%) scale(1.05);
  }
  .hero-info-arrow:disabled {
    opacity: 0.35;
    cursor: default;
    transform: translateY(-50%);
    box-shadow: none;
  }
  .hero-info-arrow--prev { left: 0; }
  .hero-info-arrow--next { right: 0; }

  /* ── Step selector ── */
  .hero-info-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin-top: 22px;
    padding: 6px;
    border-radius: 18px;
    background: transparent;
    border: none;
    box-shadow: none;
    backdrop-filter: none;
  }
  .hero-info-dot {
    flex: 1;
    min-height: 50px;
    border-radius: 13px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 8px 10px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .hero-info-dot:hover {
    color: var(--slide-accent-dark);
    background: rgba(var(--slide-accent-rgb), 0.09);
  }
  .hero-info-dot.active {
    background: linear-gradient(135deg, var(--slide-accent), var(--slide-accent-dark));
    color: #fff;
    box-shadow: 0 12px 28px rgba(var(--slide-accent-rgb), 0.18);
  }
  .hero-info-tab-num {
    font-size: 10px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.5px;
    opacity: 0.72;
  }
  .hero-info-tab-label {
    font-size: 12px;
    line-height: 1.2;
    font-weight: 800;
  }

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
    background: var(--bg-warm);
    border-top: 1px solid var(--border-soft);
  }
  .final-cta-inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 28px;
  }
  .final-cta-card {
    background:
      radial-gradient(circle at 75% 25%, rgba(63, 179, 154, 0.25), transparent 60%),
      linear-gradient(135deg, var(--teal-dark), var(--teal-deeper));
    color: #fff;
    border-radius: 24px;
    padding: 72px 56px;
    position: relative;
    overflow: hidden;
    text-align: center;
    box-shadow:
      0 34px 90px rgba(5, 61, 51, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
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
    background: #fff;
    color: var(--text);
  }
  .btn-light:hover {
    background: var(--cream);
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.20);
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
  .footer-col a:hover { color: var(--teal-dark); }

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
     MOBILE HERO BRAND  (logo + name, shown only on mobile)
  ============================================= */
  .mob-hero-brand {
    display: none;
  }

  /* =============================================
     RESPONSIVE
  ============================================= */

  @media (max-width: 980px) {

    .hero-inner {
      padding: 40px 24px 64px;
      max-width: 100%;
    }
    .hero-orbits { display: none !important; }

    .mob-hero-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 26px;
    }
    .mob-hero-logo { width: 52px; height: 52px; }
    .mob-hero-name {
      font-size: 30px; font-weight: 800;
      letter-spacing: -0.7px; color: var(--text); line-height: 1;
    }
    .mob-hero-tagline {
      font-size: 13px; font-weight: 500;
      color: var(--text-muted); letter-spacing: 0.1px; margin-top: 3px;
    }

    .hero-eyebrow {
      margin-bottom: 22px;
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }
    .hero-title,
    .hero-subtitle,
    .hero-trust-row,
    .hero-info-slider {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }
    .hero-title {
      font-size: clamp(34px, 10vw, 52px);
      letter-spacing: -1.8px;
      line-height: 1;
    }
    .hero-subtitle {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .hero-trust-row { margin-bottom: 24px; }
    .hero-trust-pill {
      min-height: 34px;
      padding: 7px 11px;
      font-size: 12px;
    }
    .hero-eyebrow-dot { padding: 6px; }
    .hero-eyebrow-dot img { width: 14px; height: 14px; }

    .hero-info-viewport { min-height: 330px; }
    .hero-info-block { padding: 28px 56px; }
    .hero-info-arrow--prev { left: 0; }
    .hero-info-arrow--next { right: 0; }
    .hero-info-block h3 { font-size: 16px; padding-right: 48px; }
    .hero-info-icon { width: 38px; height: 38px; }
    .hero-info-icon svg { width: 18px; height: 18px; }
    .hero-info-block p { font-size: 14px; padding-left: 50px; }
    .hero-info-block ul { padding-left: 50px; }
    .hero-info-block li { font-size: 13.5px; }
    .hero-info-tab-label { font-size: 10.5px; }

    .hero-actions { margin-top: 28px; gap: 12px; }

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
    .hero-info-viewport { min-height: 286px; }
    .hero-info-block { padding: 22px 22px; }
    .hero-info-arrow { display: none; }
    .hero-info-arrow--prev { left: 0; }
    .hero-info-arrow--next { right: 0; }
    .hero-info-dots { border-radius: 16px; padding: 5px; }
    .hero-info-dot { min-height: 44px; padding: 7px 4px; }
    .hero-info-tab-num { font-size: 9px; }
    .hero-info-tab-label { font-size: 9.5px; }

    /* CTA full-width on small screens */
    .hero-actions { flex-direction: column; gap: 10px; }
    .hero-actions .btn { width: 100%; justify-content: center; }
  }

  /* ── Phone  ≤ 520 px ──────────────────────────────────────────────────── */
  @media (max-width: 520px) {
    .hero { padding: 48px 0 0; }
    .hero-inner { padding: 24px 16px 48px; }

    /* Brand header tighter */
    .mob-hero-logo { width: 44px; height: 44px; }
    .mob-hero-name { font-size: 26px; }
    .mob-hero-brand { margin-bottom: 20px; }

    /* Eyebrow tighter */
    .hero-eyebrow { padding: 5px 12px 5px 7px; gap: 7px; margin-bottom: 18px; }
    .hero-eyebrow-dot { width: 24px; height: 24px; padding: 5px; }
    .hero-eyebrow-dot img { width: 13px; height: 13px; }
    .hero-eyebrow-text { font-size: 11.5px; }
    .hero-title {
      font-size: 34px;
      letter-spacing: -1.1px;
      margin-bottom: 12px;
    }
    .hero-title em::after {
      bottom: 3px;
      height: 7px;
    }
    .hero-subtitle {
      font-size: 14.5px;
      line-height: 1.62;
      margin-bottom: 16px;
    }
    .hero-trust-row { gap: 7px; margin-bottom: 18px; }
    .hero-trust-pill {
      width: 100%;
      justify-content: flex-start;
      font-size: 11.5px;
    }

    /* Info carousel — tighter on small phones */
    .hero-info-viewport { min-height: 260px; }
    .hero-info-block { padding: 18px 16px; }
    .hero-info-block h3 { font-size: 14.5px; margin-bottom: 6px; }
    .hero-info-icon { width: 34px; height: 34px; border-radius: 9px; }
    .hero-info-icon svg { width: 17px; height: 17px; }
    .hero-info-num { font-size: 12px; top: 12px; right: 14px; }
    .hero-info-block p { font-size: 13px; padding-left: 44px; }
    .hero-info-block ul { padding-left: 44px; gap: 5px; }
    .hero-info-block li { font-size: 13px; padding-left: 20px; }
    .hero-info-dots { margin-top: 16px; }

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
    .hero-inner { padding: 20px 14px 40px; }
    .mob-hero-name { font-size: 24px; }
    .mob-hero-logo { width: 40px; height: 40px; }
    .hero-info-block p, .hero-info-block ul { padding-left: 0; }
    .hero-info-block h3 { font-size: 14px; }
    .hero-info-block p, .hero-info-block li { font-size: 12.5px; }
    .hero-info-num { font-size: 11px; }
    .hero-eyebrow-text { font-size: 10.5px; }
    .section-title { font-size: 26px; }
    .final-cta h2 { font-size: 22px; }
    .final-cta-card { padding: 32px 16px; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <div class="nav-inner">
    <a href="{{ route('home') }}" class="nav-brand">
      <img src="{{ asset('logo.svg') }}" alt="GeneoRx" class="nav-logo">
      <span class="nav-name">GeneoRx</span>
    </a>

    <div class="nav-links">
      <a href="#how" class="nav-link">How it works</a>
      <a href="#demo" class="nav-link">Demo</a>
      <a href="#faq" class="nav-link">FAQ</a>
    </div>

    <div class="nav-cta">
      @auth
        <a href="{{ route('treatments') }}" class="btn btn-primary">Open dashboard</a>
      @else
        <a href="{{ route('guest') }}"    class="btn btn-ghost nav-cta-extra">Guest login</a>
        <a href="{{ route('login') }}"    class="btn btn-outline nav-cta-extra">Sign in</a>
        <a href="{{ route('register') }}" class="btn btn-primary">Create account</a>
      @endauth
    </div>

    <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>

  <!-- Mobile menu -->
  <div class="mobile-menu" id="mobileMenu">
    <ul>
      <li><a href="#how">How it works</a></li>
      <li><a href="#demo">Demo</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
    <div class="mobile-menu-cta">
      @auth
        <a href="{{ route('treatments') }}" class="btn btn-primary">Open dashboard</a>
      @else
        <a href="{{ route('guest') }}"    class="btn btn-ghost">Guest login</a>
        <a href="{{ route('login') }}"    class="btn btn-outline">Sign in</a>
        <a href="{{ route('register') }}" class="btn btn-primary">Create account</a>
      @endauth
    </div>
  </div>
</nav>

<!-- HERO -->
<header class="hero" id="heroSection">
  <div class="hero-orbits"></div>
  <div class="hero-logo-float" aria-hidden="true"></div>
  <div class="hero-dots"><span></span><span></span><span></span><span></span><span></span></div>
  <div class="hero-inner">
    <div class="hero-content">

      {{-- Mobile-only brand header: actual logo + name ─ hidden on desktop --}}
      <div class="mob-hero-brand">
        <img src="{{ asset('logo.svg') }}" alt="GeneoRx" class="mob-hero-logo">
        <div>
          <div class="mob-hero-name">GeneoRx</div>
          <div class="mob-hero-tagline">Personal medication intelligence</div>
        </div>
      </div>

      <div class="hero-info-slider">
        <div class="hero-info-stage">
          <div class="hero-info-glow" aria-hidden="true"></div>

          <button type="button" class="hero-info-arrow hero-info-arrow--prev" id="heroInfoPrev" aria-label="Previous slide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div class="hero-info-card-wrap">
            <div class="hero-info-progress" aria-hidden="true">
              <div class="hero-info-progress-fill" id="heroInfoProgress"></div>
            </div>
            <div class="hero-info-viewport" id="heroInfoTrack">
              <div class="hero-info-block hero-info-teal active">
                <span class="hero-info-num">01</span>
                <h3>
                  <span class="hero-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </span>
                  What is GeneoRx?
                </h3>
                <p>GeneoRx is your personal medication intelligence platform connecting medications, symptoms, and nutrient levels to help you understand what's really going on in your body giving you a clearer picture of your health.</p>
              </div>
              <div class="hero-info-block hero-info-blue">
                <span class="hero-info-num">02</span>
                <h3>
                  <span class="hero-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                  </span>
                  How does it work?
                </h3>
                <p>GeneoRx analyzes:</p>
                <ul>
                  <li>Your medications</li>
                  <li>Your symptoms over time</li>
                  <li>Known drug–nutrient interactions</li>
                </ul>
                <p>As you check in regularly, it builds a personalized profile, spotting patterns and improving accuracy over time.</p>
              </div>
              <div class="hero-info-block hero-info-violet">
                <span class="hero-info-num">03</span>
                <h3>
                  <span class="hero-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </span>
                  How does it help you?
                </h3>
                <ul>
                  <li><strong>Explains symptoms</strong> – Understand possible links to medications or nutrient imbalances</li>
                  <li><strong>Finds root causes</strong> – Highlights what may be driving issues like fatigue or brain fog</li>
                  <li><strong>Tracks progress</strong> – Monitors changes over time</li>
                  <li><strong>Prepares you for doctor visits</strong> – Provides a quick health summary for your doctor</li>
                </ul>
              </div>
              <div class="hero-info-block hero-info-amber">
                <span class="hero-info-num">04</span>
                <h3>
                  <span class="hero-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </span>
                  In short
                </h3>
                <p>GeneoRx helps you connect the dots between your medications, symptoms, and nutrition so you can make smarter health decisions.</p>
              </div>
            </div>
          </div>

          <button type="button" class="hero-info-arrow hero-info-arrow--next" id="heroInfoNext" aria-label="Next slide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="hero-info-dots" id="heroInfoTabs" aria-label="Slide navigation">
          <button type="button" class="hero-info-dot" data-slide="0" aria-label="What is GeneoRx?">
            <span class="hero-info-tab-num">01</span>
            <span class="hero-info-tab-label">What</span>
          </button>
          <button type="button" class="hero-info-dot active" data-slide="1" aria-label="How does it work?">
            <span class="hero-info-tab-num">02</span>
            <span class="hero-info-tab-label">How</span>
          </button>
          <button type="button" class="hero-info-dot" data-slide="2" aria-label="How does it help you?">
            <span class="hero-info-tab-num">03</span>
            <span class="hero-info-tab-label">Help</span>
          </button>
          <button type="button" class="hero-info-dot" data-slide="3" aria-label="In short">
            <span class="hero-info-tab-num">04</span>
            <span class="hero-info-tab-label">Summary</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</header>

<!-- HOW IT WORKS -->
<section class="steps-section" id="how">
  <div class="steps-inner">
    <div class="steps-head reveal">
      <div class="section-tag">How it works</div>
      <h2 class="section-title">Three steps to your<br><em>first insight</em>.</h2>
      <p class="section-desc">No long forms. No medical jargon. Just thoughtful questions and a personalized response.</p>
    </div>

    <div class="steps-flow">
      <div class="step-card reveal">
        <div class="step-num">i</div>
        <h3>Add your medications or symptoms</h3>
        <p>Tell GeneoRx what you take and how you feel. We support commonly prescribed medications and their known nutrient interactions.</p>
      </div>
      <div class="step-card reveal">
        <div class="step-num">ii</div>
        <h3>Log your check-ins</h3>
        <p>Weekly check-ins build a personal profile that spots patterns over time, tracking energy, mood, sleep, and focus.</p>
      </div>
      <div class="step-card reveal">
        <div class="step-num">iii</div>
        <h3>Get your insight</h3>
        <p>Receive a plain-language explanation of possible connections plus specific questions to bring to your doctor.</p>
      </div>
    </div>
  </div>
</section>

<!-- DEMO -->
<section class="demo-section" id="demo">
  <div class="demo">
    <div class="demo-head reveal">
      <div class="section-tag">Quick check</div>
      <h2 class="section-title">See it for <em>yourself</em>.</h2>
      <p class="section-desc">No account required. Pick a medication and a symptom to see a sample insight.</p>
    </div>

    <div class="demo-card reveal">
      <div class="demo-card-hd">
        <h3>Medication &amp; symptom pattern check</h3>
        <p>This is a guided sample. Sign up to build your full profile.</p>
      </div>
      <div class="demo-card-bd">
        <div class="field">
          <label for="medication">Your medication</label>
          <select id="medication">
            <option value="">None or unsure</option>
            <option value="metformin">Metformin (for diabetes)</option>
            <option value="statin">Statin (for cholesterol)</option>
            <option value="ppi">Omeprazole or PPI (for acid reflux)</option>
            <option value="birthcontrol">Birth control or hormonal</option>
            <option value="antidepressant">Antidepressant or SSRI</option>
          </select>
        </div>
        <div class="field">
          <label for="symptom">Your main symptom</label>
          <select id="symptom">
            <option value="">Select a symptom</option>
            <option value="fatigue">Fatigue or low energy</option>
            <option value="brainfog">Brain fog or poor concentration</option>
            <option value="musclepain">Muscle pain or weakness</option>
            <option value="dizziness">Dizziness or lightheadedness</option>
            <option value="sleep">Sleep problems</option>
            <option value="digestive">Digestive issues</option>
          </select>
        </div>
        <button class="demo-submit" onclick="generateInsight()">See my insight</button>

        <div class="result" id="resultBox">
          <div class="result-title">Your GeneoRx insight</div>
          <div class="result-block">
            <h4>What GeneoRx sees</h4>
            <p id="insight"></p>
          </div>
          <div class="result-block">
            <h4>What this may mean</h4>
            <p id="meaning"></p>
          </div>
          <div class="result-block">
            <h4>Questions for your doctor</h4>
            <p id="doctor"></p>
          </div>
          <p class="result-note"> 
            Educational guidance only  this is not medical advice. Always discuss persistent symptoms and medication concerns with your healthcare provider.
          </p>
          <div class="result-cta">
            <a href="{{ route('register') }}" class="btn btn-primary">Save my profile</a>
            <a href="{{ route('login') }}" class="btn btn-outline">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="testimonials">
  <div class="testimonials-inner">
    <div class="testimonials-head reveal">
      <div class="section-tag">What people say</div>
      <h2 class="section-title">Built for those who want <em>real answers</em>.</h2>
      <p class="section-desc">Educational guidance that helps people prepare for better conversations with their doctors.</p>
    </div>

    <div class="testimonials-grid">
      <div class="quote reveal">
        <div class="quote-mark">"</div>
        <p class="quote-text"> 
          I had been on Metformin for years and constantly felt drained. GeneoRx suggested I ask about B12  turned out my levels were genuinely low. Game changer.
        </p>
        <div class="quote-author">
          <div class="quote-avatar">SR</div>
          <div class="quote-meta">
            <div class="quote-name">Sarah R.</div>
            <div class="quote-role">Type 2 diabetes patient</div>
          </div>
        </div>
      </div>

      <div class="quote reveal">
        <div class="quote-mark">"</div>
        <p class="quote-text">
          The doctor summary feature alone is worth it. I walk into appointments organized for the first time in years.
        </p>
        <div class="quote-author">
          <div class="quote-avatar">MK</div>
          <div class="quote-meta">
            <div class="quote-name">Michael K.</div>
            <div class="quote-role">Multiple medications</div>
          </div>
        </div>
      </div>

      <div class="quote reveal">
        <div class="quote-mark">"</div>
        <p class="quote-text">
          I finally have a clear picture of what is going on. The weekly check-ins are quick and the trends are eye-opening.
        </p>
        <div class="quote-author">
          <div class="quote-avatar">JL</div>
          <div class="quote-meta">
            <div class="quote-name">Jenna L.</div>
            <div class="quote-role">Long-term PPI user</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="faq-section" id="faq">
  <div class="faq-inner">
    <div class="faq-head reveal">
      <div class="section-tag">FAQ</div>
      <h2 class="section-title">Frequently asked <em>questions</em>.</h2>
    </div>

    <div class="faq-list">
      <details class="faq reveal">
        <summary>Is GeneoRx a substitute for medical advice?</summary>
        <div class="faq-body"> 
          No. GeneoRx is educational guidance only  it surfaces possible patterns from your medications and symptoms and prepares you to have better conversations with your doctor. It does not diagnose, treat, or replace professional medical care.
        </div>
      </details>

      <details class="faq reveal">
        <summary>How does GeneoRx use my data?</summary>
        <div class="faq-body">
          Your data stays private. We use it solely to surface your personal insights and never sell or share it with third parties. Data is encrypted in transit and at rest. You can request deletion at any time.
        </div>
      </details>

      <details class="faq reveal">
        <summary>Which medications are supported?</summary>
        <div class="faq-body">
          GeneoRx supports commonly prescribed medications with well-documented nutrient and symptom interactions, including Metformin, statins, PPIs, hormonal contraceptives, and SSRIs. We add new medications based on user demand and clinical evidence.
        </div>
      </details>

      <details class="faq reveal">
        <summary>How often should I check in?</summary>
        <div class="faq-body">
          Weekly check-ins work best. They take less than two minutes and let GeneoRx build a meaningful profile of how you are feeling over time, which improves the accuracy of your insights.
        </div>
      </details>

    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="final-cta">
  <div class="final-cta-inner">
    <div class="final-cta-card reveal">
      <div class="final-cta-content">
        <h2>Ready for a <em>clearer picture</em> of your health?</h2>
        <p>Join people who use GeneoRx to turn their medications and symptoms into something useful.</p>
        <div class="final-cta-actions">
          <a href="{{ route('register') }}" class="btn btn-light btn-lg">Create your free account</a>
          <a href="{{ route('guest') }}" class="btn btn-on-dark btn-lg">Try as guest</a>
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
          <img src="{{ asset('logo.svg') }}" alt="GeneoRx">
          <span class="footer-brand-name">GeneoRx</span>
        </div>
        <p class="footer-tagline">
          Personal medication intelligence. Helping you connect the dots between medications, symptoms, and nutrition.
        </p>
      </div>

      <div class="footer-col">
        <h4>Product</h4>
        <ul>
          <li><a href="#how">How it works</a></li>
          <li><a href="#demo">Demo</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Account</h4>
        <ul>
          <li><a href="{{ route('login') }}">Sign in</a></li>
          <li><a href="{{ route('register') }}">Create account</a></li>
          <li><a href="#faq">FAQ</a></li>
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

<script>
  const insights = {
    'metformin-fatigue': {
      i: 'Fatigue selected in a long-term Metformin user.',
      m: 'Metformin can reduce absorption of Vitamin B12 over time in some individuals. Fatigue, especially with tingling or mood changes, may sometimes relate to this pattern.',
      d: 'Ask whether Vitamin B12 testing is appropriate, how long you have been on Metformin, and whether levels have been checked recently.',
    },
    'statin-musclepain': {
      i: 'Muscle discomfort selected in a statin user.',
      m: 'Statins can sometimes affect CoQ10 levels, which plays a role in muscle energy. Muscle symptoms in statin users are worth tracking and discussing with your prescriber.',
      d: 'Discuss the timing of muscle symptoms relative to starting the statin, whether dose adjustment or CoQ10 support might be relevant.',
    },
    'ppi-fatigue': {
      i: 'Fatigue selected in a proton pump inhibitor user.',
      m: 'Long-term PPI use can sometimes be associated with lower magnesium and B12 levels. Both are linked to energy and overall wellbeing.',
      d: 'Ask whether magnesium or B12 testing is appropriate, and review the duration and necessity of your PPI use.',
    },
    'ppi-digestive': {
      i: 'Digestive issues selected in a PPI user.',
      m: 'PPIs reduce stomach acid, which can sometimes affect digestion and gut microbiome balance.',
      d: 'Discuss whether your current PPI dose and duration are still appropriate.',
    },
    'antidepressant-sleep': {
      i: 'Sleep problems selected in an antidepressant user.',
      m: 'Some antidepressants can affect sleep architecture, particularly when starting or adjusting dose.',
      d: 'Discuss the timing of sleep changes relative to your medication and whether dose timing might help.',
    },
    'brainfog': {
      i: 'Brain fog selected as a primary symptom.',
      m: 'Brain fog can overlap with medication side effects, sleep disruption, nutrient gaps (B12, magnesium, iron), and stress.',
      d: 'Discuss when it started, whether any medication or lifestyle changes happened around the same time, and whether basic nutrient screening would be useful.',
    },
    'fatigue': {
      i: 'Fatigue selected without a specific medication pattern.',
      m: 'Fatigue is common and can relate to nutrition, sleep, stress, thyroid function, or other factors.',
      d: 'Ask about nutrient testing (B12, iron, vitamin D), thyroid function, and recent lifestyle changes.',
    },
    'default': {
      i: 'A possible medication–symptom pattern has been detected.',
      m: 'Tracking your symptoms over time helps clarify whether a medication, nutrient pattern, or other factor is contributing.',
      d: 'Bring persistent symptoms, their timing, and your full medication list to your healthcare provider.',
    },
  };

  function generateInsight() {
    const med = document.getElementById('medication').value;
    const symptom = document.getElementById('symptom').value;
    if (!symptom) { alert('Please select a symptom.'); return; }

    const key = insights[med + '-' + symptom] ? med + '-' + symptom
              : insights[symptom]              ? symptom
              :                                  'default';
    const data = insights[key];

    document.getElementById('insight').textContent = data.i;
    document.getElementById('meaning').textContent = data.m;
    document.getElementById('doctor').textContent  = data.d;
    const box = document.getElementById('resultBox');
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

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

  // Nav scroll-spy — highlight the active section link
  (function () {
    const spySections = [
      { id: 'how',     href: '#how'     },
      { id: 'demo',    href: '#demo'    },
      { id: 'faq',     href: '#faq'     },
    ];
    const navLinkEls = document.querySelectorAll('.nav-links .nav-link');

    function setActive(href) {
      navLinkEls.forEach(el => el.classList.toggle('active', el.getAttribute('href') === href));
    }

    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const match = spySections.find(s => s.id === entry.target.id);
          if (match) setActive(match.href);
        }
      });
    }, { threshold: 0, rootMargin: '-30% 0px -65% 0px' });

    spySections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) spyObserver.observe(el);
    });

    // Clear active when scrolled back to top (hero)
    const heroObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setActive('');
    }, { threshold: 0.4 });
    const hero = document.querySelector('.hero');
    if (hero) heroObserver.observe(hero);
  })();

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

  // Hero info carousel — starts on "How does it work?"
  (function () {
    const viewport = document.getElementById('heroInfoTrack');
    const hero = document.getElementById('heroSection');
    const slider = document.querySelector('.hero-info-slider');
    const dots = document.querySelectorAll('.hero-info-dot');
    const prevBtn = document.getElementById('heroInfoPrev');
    const nextBtn = document.getElementById('heroInfoNext');
    const progress = document.getElementById('heroInfoProgress');
    if (!viewport) return;

    const slides = Array.from(viewport.querySelectorAll('.hero-info-block'));
    if (!slides.length) return;

    const SLIDE_DURATION = 6000;
    let current = 1;
    let timer = null;
    let touchStartX = 0;
    const slideThemes = [
      { accent: '#0E7C66', dark: '#075F4F', rgb: '14, 124, 102', lightRgb: '63, 179, 154' },
      { accent: '#2B7A9B', dark: '#1E5A73', rgb: '43, 122, 155', lightRgb: '92, 173, 205' },
      { accent: '#6B5B95', dark: '#4E4170', rgb: '107, 91, 149', lightRgb: '164, 145, 206' },
      { accent: '#C17D3A', dark: '#9A5E22', rgb: '193, 125, 58', lightRgb: '229, 174, 112' },
    ];

    function applySlideTheme(theme) {
      if (!theme) return;
      [hero, slider].forEach((element) => {
        if (!element) return;
        element.style.setProperty('--hero-accent', theme.accent);
        element.style.setProperty('--hero-accent-dark', theme.dark);
        element.style.setProperty('--hero-accent-rgb', theme.rgb);
        element.style.setProperty('--hero-accent-light-rgb', theme.lightRgb);
        element.style.setProperty('--slide-accent', theme.accent);
        element.style.setProperty('--slide-accent-dark', theme.dark);
        element.style.setProperty('--slide-accent-rgb', theme.rgb);
        element.style.setProperty('--slide-accent-light-rgb', theme.lightRgb);
      });
    }

    function goToSlide(idx) {
      current = ((idx % slides.length) + slides.length) % slides.length;
      applySlideTheme(slideThemes[current]);
      slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
      if (progress) progress.style.width = `${((current + 1) / slides.length) * 100}%`;
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }

    function startAutoplay() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        goToSlide(current >= slides.length - 1 ? 0 : current + 1);
      }, SLIDE_DURATION);
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        goToSlide(idx);
        startAutoplay();
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToSlide(current - 1);
        startAutoplay();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToSlide(current + 1);
        startAutoplay();
      });
    }

    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      if (timer) clearInterval(timer);
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      const delta = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(delta) > 50) {
        goToSlide(delta < 0 ? current + 1 : current - 1);
      }
      startAutoplay();
    }, { passive: true });

    goToSlide(1);
    startAutoplay();
  })();
</script>
</body>
</html>
