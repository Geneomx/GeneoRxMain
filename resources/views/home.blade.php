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
    width: 40px; height: 40px;
    border: 1px solid var(--border);
    background: var(--bg);
    border-radius: 8px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    padding: 0;
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
    display: block;
    padding: 12px 14px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-soft);
    border-radius: 8px;
    transition: background 0.15s;
  }
  .mobile-menu li a:hover { background: var(--bg-muted); color: var(--text); }
  .mobile-menu-cta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border-soft);
  }
  .mobile-menu-cta .btn { width: 100%; height: 46px; }

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
  }
  .hero::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--teal-200) 50%, transparent 100%);
    opacity: 0.5;
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
  }
  .hero-orbits::after {
    width: 540px; height: 540px;
    right: -110px; top: -60px;
    border-color: rgba(14, 124, 102, 0.08);
    animation-delay: 3s;
  }
  @keyframes orbitPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.04); opacity: 0.6; }
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
  }
  .hero-dots span:nth-child(1) { top: 15%; left: 8%; width: 8px; height: 8px; opacity: 0.08; }
  .hero-dots span:nth-child(2) { top: 35%; left: 3%; width: 5px; height: 5px; opacity: 0.12; }
  .hero-dots span:nth-child(3) { bottom: 20%; left: 12%; opacity: 0.07; }
  .hero-dots span:nth-child(4) { top: 10%; right: 15%; width: 4px; height: 4px; opacity: 0.10; }
  .hero-dots span:nth-child(5) { bottom: 30%; right: 5%; width: 7px; height: 7px; opacity: 0.06; }

  .hero-inner {
    position: relative;
    max-width: 1180px;
    margin: 0 auto;
    padding: 56px 28px 100px;
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    gap: 64px;
    align-items: center;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
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
    width: 24px; height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    box-shadow: 0 2px 8px rgba(14, 124, 102, 0.30);
  }
  .hero-eyebrow-text {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-soft);
    letter-spacing: 0.15px;
  }

  .hero h1 {
    font-size: 64px;
    line-height: 1.04;
    font-weight: 800;
    letter-spacing: -1.8px;
    color: var(--text);
    margin-bottom: 22px;
  }
  .hero h1 em {
    font-family: 'Source Serif 4', serif;
    font-style: italic;
    font-weight: 400;
    color: var(--teal-dark);
    letter-spacing: -1px;
    position: relative;
  }
  .hero h1 em::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, var(--teal), var(--teal-light));
    border-radius: 2px;
    opacity: 0.35;
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

  /* HERO INFO — about blocks inside hero */
  .hero-info {
    margin-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .hero-info-block {
    padding: 22px 24px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid var(--border-soft);
    border-left: 3px solid var(--teal-200);
    backdrop-filter: blur(6px);
    transition: all 0.25s ease;
    opacity: 0;
    transform: translateY(16px);
    animation: heroBlockIn 0.6s ease forwards;
  }
  .hero-info-block:nth-child(1) { animation-delay: 0.15s; }
  .hero-info-block:nth-child(2) { animation-delay: 0.30s; }
  .hero-info-block:nth-child(3) { animation-delay: 0.45s; }
  .hero-info-block:nth-child(4) { animation-delay: 0.60s; }
  @keyframes heroBlockIn {
    to { opacity: 1; transform: translateY(0); }
  }
  .hero-info-block:hover {
    border-left-color: var(--teal);
    box-shadow: 0 8px 28px rgba(14, 124, 102, 0.10);
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.92);
  }
  .hero-info-block h3 {
    font-size: 15.5px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .hero-info-icon {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: var(--teal-50);
    color: var(--teal-dark);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .hero-info-icon svg { width: 15px; height: 15px; }
  .hero-info-block p {
    font-size: 14px;
    color: var(--text-soft);
    line-height: 1.65;
    margin: 0;
    padding-left: 37px;
  }
  .hero-info-block p + p { margin-top: 8px; }
  .hero-info-block ul {
    list-style: none;
    padding: 0;
    margin: 8px 0;
    padding-left: 37px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .hero-info-block li {
    position: relative;
    padding-left: 24px;
    font-size: 14px;
    color: var(--text-soft);
    line-height: 1.55;
  }
  .hero-info-block li::before {
    content: '';
    position: absolute;
    left: 0; top: 5px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--teal);
    opacity: 0.12;
  }
  .hero-info-block li::after {
    content: '';
    position: absolute;
    left: 4px; top: 9px;
    width: 6px; height: 3px;
    border-left: 1.5px solid var(--teal);
    border-bottom: 1.5px solid var(--teal);
    transform: rotate(-45deg);
    opacity: 0.7;
  }
  .hero-info-block li strong { color: var(--text); font-weight: 600; }
  .hero-info-highlight {
    background: linear-gradient(135deg, rgba(14, 124, 102, 0.06) 0%, rgba(63, 179, 154, 0.04) 100%);
    border: 1px solid var(--teal-100);
    border-left: 3px solid var(--teal);
    border-radius: 14px;
  }
  .hero-info-highlight:hover {
    background: linear-gradient(135deg, rgba(14, 124, 102, 0.10) 0%, rgba(63, 179, 154, 0.06) 100%);
    border-left-color: var(--teal-dark);
  }
  .hero-info-highlight h3 { color: var(--teal-dark); }

  /* HERO VISUAL  GIF/Demo player */
  .hero-visual {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 480px;
  }

  /* Browser mockup frame */
  .demo-frame {
    position: relative;
    width: 100%;
    max-width: 520px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(14, 124, 102, 0.12),
      0 24px 64px rgba(14, 124, 102, 0.18),
      0 4px 16px rgba(0,0,0,0.08);
    background: #fff;
    animation: demoFloat 7s ease-in-out infinite;
  }

  /* Browser chrome bar */
  .demo-frame-bar {
    height: 38px;
    background: linear-gradient(180deg, #F7F8F9 0%, #F0F1F2 100%);
    border-bottom: 1px solid rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    padding: 0 14px;
    gap: 8px;
    flex-shrink: 0;
  }
  .demo-frame-dot {
    width: 11px; height: 11px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .demo-frame-dot.red    { background: #FF5F57; }
  .demo-frame-dot.yellow { background: #FEBC2E; }
  .demo-frame-dot.green  { background: #28C840; }
  .demo-frame-url {
    flex: 1;
    height: 22px;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.10);
    border-radius: 5px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    font-size: 11px;
    color: #6B7B77;
    font-family: monospace;
    letter-spacing: -0.2px;
    margin: 0 8px;
    gap: 5px;
    overflow: hidden;
    white-space: nowrap;
  }
  .demo-frame-lock {
    width: 8px; height: 8px; flex-shrink: 0;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230E7C66'%3E%3Cpath d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'/%3E%3C/svg%3E") no-repeat center/contain;
  }

  /* The GIF itself */
  .demo-frame-gif {
    display: block;
    width: 100%;
    height: auto;
    min-height: 300px;
    object-fit: cover;
    background: var(--bg-soft);
    position: relative;
  }

  /* Floating badge on the frame */
  .demo-badge {
    position: absolute;
    z-index: 4;
    background: var(--bg);
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    padding: 10px 14px;
    box-shadow: 0 8px 24px rgba(14,124,102,0.14);
    font-size: 12.5px;
    display: flex;
    align-items: center;
    gap: 9px;
    white-space: nowrap;
    animation: chipFloat 5s ease-in-out infinite;
  }
  .demo-badge-icon {
    width: 26px; height: 26px;
    border-radius: 7px;
    background: var(--teal-50);
    color: var(--teal-dark);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .demo-badge-label { font-size: 10.5px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  .demo-badge-value { font-weight: 700; font-size: 13px; color: var(--text); }
  .demo-badge.b1 { bottom: -16px; left: -18px; animation-delay: 0s; }
  .demo-badge.b2 { top: 60px;     right: -22px; animation-delay: 1.8s; }

  @keyframes demoFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes chipFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-7px); }
  }

  /* =============================================
     ANIMATED APP DEMO (hero placeholder)
  ============================================= */
  .anim-demo {
    position: relative;
    background: var(--bg-soft);
    min-height: 380px;
    overflow: hidden;
  }
  .anim-screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    opacity: 0;
  }
  .anim-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 8px;
    border-bottom: 1px solid var(--border-soft);
    background: #fff;
    flex-shrink: 0;
  }
  .anim-back { font-size: 13px; color: var(--teal); min-width: 20px; }
  .anim-screen-title { font-size: 13.5px; font-weight: 700; color: var(--text); }
  .anim-step-lbl { font-size: 11px; color: var(--text-muted); min-width: 30px; text-align: right; }
  .anim-prog { height: 3px; background: var(--border-soft); flex-shrink: 0; }
  .anim-prog-fill { height: 100%; background: var(--teal); border-radius: 0 2px 2px 0; transition: width .4s; }
  .anim-body {
    flex: 1;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
  }
  .anim-q { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  /* med rows */
  .anim-med-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px;
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    background: #fff;
  }
  .anim-med-row.on { border-color: var(--teal); background: var(--teal-50); }
  .anim-chk {
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--teal); color: #fff;
    font-size: 9px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .anim-chk-e {
    width: 20px; height: 20px; border-radius: 50%;
    border: 1.5px solid var(--border);
    flex-shrink: 0;
  }
  .anim-med-nm { font-size: 13px; font-weight: 500; color: var(--text); }
  .anim-med-mg { font-size: 11.5px; color: var(--text-muted); margin-left: 4px; font-weight: 400; }
  /* chips */
  .anim-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 2px; }
  .anim-chip {
    padding: 5px 11px;
    border: 1.5px solid var(--border);
    border-radius: 999px;
    font-size: 12px; font-weight: 500;
    color: var(--text-muted); background: #fff;
  }
  .anim-chip.on {
    border-color: var(--teal); background: var(--teal-50);
    color: var(--teal-dark); font-weight: 600;
  }
  /* insight */
  .anim-ins-hd {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 12px;
    background: #fff;
    border: 1px solid var(--teal-100); border-radius: 10px;
  }
  .anim-ins-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: var(--teal); color: #fff;
    font-size: 11px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .anim-ins-title { font-size: 13px; font-weight: 700; color: var(--text); }
  .anim-ins-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .anim-ins-txt {
    font-size: 12.5px; line-height: 1.6; color: var(--text-soft);
    padding: 10px 12px;
    background: #fff; border: 1px solid var(--border-soft); border-radius: 8px;
  }
  .anim-ask {
    padding: 10px 12px;
    background: var(--teal-50); border: 1px solid var(--teal-100); border-radius: 8px;
  }
  .anim-ask-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--teal-dark); margin-bottom: 3px; }
  .anim-ask-q { font-size: 12.5px; font-weight: 600; font-style: italic; color: var(--text); }
  /* footer btn */
  .anim-btn-row { padding: 10px 16px 14px; flex-shrink: 0; }
  .anim-cta-btn {
    display: block; width: 100%; padding: 11px;
    background: var(--teal); color: #fff;
    border-radius: 9px; font-size: 13px; font-weight: 700;
    text-align: center; letter-spacing: .1px;
  }
  .anim-cta-btn.dark { background: var(--teal-dark); }
  /* slide animations — 15 s loop */
  .anim-s1 { animation: animS1 15s ease-in-out infinite; }
  .anim-s2 { animation: animS2 15s ease-in-out infinite; }
  .anim-s3 { animation: animS3 15s ease-in-out infinite; }

  @keyframes animS1 {
    0%   { opacity:1; transform:translateX(0); }
    28%  { opacity:1; transform:translateX(0); }
    33%  { opacity:0; transform:translateX(-22px); }
    100% { opacity:0; transform:translateX(-22px); }
  }
  @keyframes animS2 {
    0%   { opacity:0; transform:translateX(22px); }
    33%  { opacity:0; transform:translateX(22px); }
    38%  { opacity:1; transform:translateX(0); }
    61%  { opacity:1; transform:translateX(0); }
    66%  { opacity:0; transform:translateX(-22px); }
    100% { opacity:0; transform:translateX(-22px); }
  }
  @keyframes animS3 {
    0%   { opacity:0; transform:translateX(22px); }
    66%  { opacity:0; transform:translateX(22px); }
    71%  { opacity:1; transform:translateX(0); }
    96%  { opacity:1; transform:translateX(0); }
    100% { opacity:0; transform:translateX(22px); }
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
    background: var(--bg);
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    padding: 32px 28px;
    position: relative;
    transition: all 0.28s ease;
  }
  .step-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 48px rgba(14, 124, 102, 0.12);
    border-color: var(--teal-100);
  }
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
    font-size: 19px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.3px;
    margin-bottom: 10px;
  }
  .step-card p {
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
    background: var(--bg);
    border: 1px solid var(--border-soft);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .demo-card-hd {
    padding: 28px 32px;
    border-bottom: 1px solid var(--border-soft);
    background: linear-gradient(180deg, var(--bg-soft), var(--bg));
  }
  .demo-card-hd h3 {
    font-size: 19px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 5px;
    letter-spacing: -0.3px;
  }
  .demo-card-hd p { font-size: 14px; color: var(--text-muted); }
  .demo-card-bd { padding: 32px; }

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
    border-radius: 10px;
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
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .field select:focus {
    border-color: var(--teal);
    box-shadow: 0 0 0 4px rgba(14, 124, 102, 0.10);
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 16px;
    padding: 32px;
    backdrop-filter: blur(8px);
    transition: all 0.28s ease;
  }
  .quote:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.20);
  }
  .quote-mark {
    font-family: 'Source Serif 4', serif;
    font-size: 56px;
    line-height: 0.8;
    color: var(--teal-light);
    height: 22px;
    margin-bottom: 14px;
  }
  .quote-text {
    font-size: 16px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.88);
    margin-bottom: 22px;
  }
  .quote-author {
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
    background: var(--bg);
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    transition: all 0.22s ease;
  }
  details.faq:hover {
    border-color: var(--teal-200);
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
     RESPONSIVE
  ============================================= */
  @media (max-width: 980px) {
    .hero-inner {
      grid-template-columns: 1fr;
      gap: 48px;
      padding: 40px 24px 80px;
    }
    .hero-visual { order: -1; min-height: 360px; }
    .demo-frame { max-width: 100%; }
    .demo-badge.b1 { bottom: -10px; left: -8px; }
    .demo-badge.b2 { top: 48px; right: -8px; }
    .hero h1 { font-size: 46px; letter-spacing: -1.2px; }

    /* Hero info cards — tablet */
    .hero-info { gap: 12px; }
    .hero-info-block { padding: 20px 22px; }

    /* Hide decorative dots on tablet and below */
    .hero-dots { display: none; }

    .testimonials-grid { grid-template-columns: 1fr; }
    .steps-flow { grid-template-columns: 1fr; }
    .section-title { font-size: 32px; }
    .final-cta h2 { font-size: 34px; }
    .final-cta-card { padding: 56px 32px; }
    .footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
    .nav-links { display: none; }
    .nav-cta .nav-cta-extra { display: none; }
    .nav-toggle { display: inline-flex; }
  }
  @media (max-width: 520px) {
    .hero { padding: 60px 0 0; }
    .hero h1 { font-size: 34px; letter-spacing: -1px; }
    .hero h1 em::after { height: 2px; bottom: 1px; }

    /* Hero info cards — mobile */
    .hero-info { gap: 10px; margin-top: 24px; }
    .hero-info-block {
      padding: 16px 16px;
      border-radius: 12px;
      border-left-width: 3px;
    }
    .hero-info-block h3 { font-size: 14.5px; gap: 8px; }
    .hero-info-icon { width: 24px; height: 24px; border-radius: 6px; }
    .hero-info-icon svg { width: 13px; height: 13px; }
    .hero-info-block p { font-size: 13.5px; padding-left: 32px; }
    .hero-info-block ul { padding-left: 32px; gap: 6px; }
    .hero-info-block li { font-size: 13.5px; padding-left: 22px; }
    .hero-info-block li::before { width: 12px; height: 12px; top: 4px; }
    .hero-info-block li::after { left: 3px; top: 8px; width: 5px; height: 2.5px; }
    .hero-info-highlight { padding: 16px 16px !important; }

    /* CTA full width on mobile */
    .hero-actions { flex-direction: column; gap: 10px; }
    .hero-actions .btn { width: 100%; }

    /* Eyebrow smaller */
    .hero-eyebrow { padding: 5px 12px 5px 6px; gap: 7px; }
    .hero-eyebrow-dot { width: 20px; height: 20px; font-size: 10px; }
    .hero-eyebrow-text { font-size: 11.5px; }

    /* Section titles — smaller underline */
    .section-title em::after { height: 2px; }

    /* Steps section */
    .steps-section { padding: 80px 0; }
    .step-num { width: 42px; height: 42px; font-size: 17px; border-radius: 11px; }

    /* Demo card */
    .demo-section { padding: 80px 0; }
    .demo-card-hd, .demo-card-bd { padding: 22px; }

    /* Testimonials */
    .testimonials { padding: 80px 0; }
    .step-card, .quote { padding: 26px; }

    /* FAQ */
    .faq-section { padding: 80px 0; }
    details.faq summary { padding: 18px 20px; font-size: 15px; }
    .faq-body { padding: 0 20px 20px; font-size: 14px; }

    /* Final CTA */
    .final-cta { padding: 80px 0; }
    .final-cta h2 { font-size: 28px; }
    .final-cta-card { padding: 44px 24px; border-radius: 18px; }
    .final-cta p { font-size: 15px; }
    .final-cta-actions { flex-direction: column; }
    .final-cta-actions .btn { width: 100%; }

    /* Footer */
    .footer { padding: 40px 20px 28px; }
    .footer-top { grid-template-columns: 1fr; gap: 28px; }
    .footer-bottom { flex-direction: column; text-align: center; gap: 8px; }
  }

  /* Extra small phones */
  @media (max-width: 380px) {
    .hero h1 { font-size: 30px; }
    .hero-info-block p, .hero-info-block ul { padding-left: 0; }
    .hero-info-block h3 { font-size: 14px; }
    .hero-info-block p, .hero-info-block li { font-size: 13px; }
    .hero-eyebrow-text { font-size: 11px; }
    .section-title { font-size: 28px; }
    .final-cta h2 { font-size: 24px; }
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
<header class="hero">
  <div class="hero-orbits"></div>
  <div class="hero-dots"><span></span><span></span><span></span><span></span><span></span></div>
  <div class="hero-inner">
    <div class="hero-content">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow-dot">Rx</span>
        <span class="hero-eyebrow-text">Personal medication intelligence platform</span>
      </div>
      <h1>The <em>clarity</em> behind<br>your medications.</h1>

      <div class="hero-info">
        <div class="hero-info-block">
          <h3>
            <span class="hero-info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            What is GeneoRx?
          </h3>
          <p>GeneoRx is your personal medication intelligence platform connecting medications, symptoms, and nutrient levels to help you understand what's really going on in your body giving you a clearer picture of your health.</p>
        </div>
        <div class="hero-info-block">
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
        <div class="hero-info-block">
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
        <div class="hero-info-block hero-info-highlight">
          <h3>
            <span class="hero-info-icon" style="background:var(--teal);color:#fff;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </span>
            In short
          </h3>
          <p>GeneoRx helps you connect the dots between your medications, symptoms, and nutrition so you can make smarter health decisions.</p>
        </div>
      </div>

      <div class="hero-actions">
        <a href="{{ route('register') }}" class="btn btn-dark btn-lg">Create your free account</a>
        <a href="{{ route('guest') }}" class="btn btn-outline btn-lg">Try as guest</a>
      </div>
    </div>

    <div class="hero-visual">
      <div class="demo-frame">
        <div class="demo-frame-bar">
          <div class="demo-frame-dot red"></div>
          <div class="demo-frame-dot yellow"></div>
          <div class="demo-frame-dot green"></div>
          <div class="demo-frame-url">
            <div class="demo-frame-lock"></div>
            app.geneorx.com/treatments
          </div>
        </div>
        @if(file_exists(public_path('demo.gif')))
          <img src="{{ asset('demo.gif') }}" alt="GeneoRx app demo" class="demo-frame-gif">
        @else
          {{-- CSS-animated app walkthrough ─ loops every 15 s --}}
          <div class="anim-demo">

            {{-- Screen 1: Medications --}}
            <div class="anim-screen anim-s1">
              <div class="anim-topbar">
                <span class="anim-back">←</span>
                <span class="anim-screen-title">Check-in</span>
                <span class="anim-step-lbl">1 / 3</span>
              </div>
              <div class="anim-prog"><div class="anim-prog-fill" style="width:33%"></div></div>
              <div class="anim-body">
                <div class="anim-q">Which medications are you taking?</div>
                <div class="anim-med-row on">
                  <div class="anim-chk">✓</div>
                  <div class="anim-med-nm">Metformin <span class="anim-med-mg">500 mg</span></div>
                </div>
                <div class="anim-med-row">
                  <div class="anim-chk-e"></div>
                  <div class="anim-med-nm">Omeprazole <span class="anim-med-mg">20 mg</span></div>
                </div>
                <div class="anim-med-row">
                  <div class="anim-chk-e"></div>
                  <div class="anim-med-nm">Atorvastatin <span class="anim-med-mg">10 mg</span></div>
                </div>
              </div>
              <div class="anim-btn-row">
                <div class="anim-cta-btn">Next →</div>
              </div>
            </div>

            {{-- Screen 2: Symptoms --}}
            <div class="anim-screen anim-s2">
              <div class="anim-topbar">
                <span class="anim-back">←</span>
                <span class="anim-screen-title">Symptoms</span>
                <span class="anim-step-lbl">2 / 3</span>
              </div>
              <div class="anim-prog"><div class="anim-prog-fill" style="width:66%"></div></div>
              <div class="anim-body">
                <div class="anim-q">How have you been feeling this week?</div>
                <div class="anim-chips">
                  <div class="anim-chip on">Fatigue</div>
                  <div class="anim-chip on">Brain fog</div>
                  <div class="anim-chip">Muscle aches</div>
                  <div class="anim-chip on">Low energy</div>
                  <div class="anim-chip">Headache</div>
                  <div class="anim-chip">Nausea</div>
                  <div class="anim-chip">Dizziness</div>
                  <div class="anim-chip">Tingling hands</div>
                </div>
              </div>
              <div class="anim-btn-row">
                <div class="anim-cta-btn">See my insight →</div>
              </div>
            </div>

            {{-- Screen 3: Insight --}}
            <div class="anim-screen anim-s3">
              <div class="anim-topbar">
                <span class="anim-back"></span>
                <span class="anim-screen-title">Your Insight</span>
                <span class="anim-step-lbl"></span>
              </div>
              <div class="anim-prog"><div class="anim-prog-fill" style="width:100%"></div></div>
              <div class="anim-body">
                <div class="anim-ins-hd">
                  <div class="anim-ins-icon">B12</div>
                  <div>
                    <div class="anim-ins-title">Vitamin B12 signal</div>
                    <div class="anim-ins-sub">Detected from Metformin + fatigue pattern</div>
                  </div>
                </div>
                <div class="anim-ins-txt">
                  Long-term Metformin use may reduce B12 absorption. Your fatigue and brain fog symptoms align with this pattern.
                </div>
                <div class="anim-ask">
                  <div class="anim-ask-lbl">Ask your doctor</div>
                  <div class="anim-ask-q">"Should I check my B12 levels?"</div>
                </div>
              </div>
              <div class="anim-btn-row">
                <div class="anim-cta-btn dark">Save &amp; view full report →</div>
              </div>
            </div>

          </div>{{-- /.anim-demo --}}
        @endif
      </div>

      <div class="demo-badge b1">
        <div class="demo-badge-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
        <div>
          <div class="demo-badge-label">Top Signal</div>
          <div class="demo-badge-value">Vitamin B12</div>
        </div>
      </div>

      <div class="demo-badge b2">
        <div class="demo-badge-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div class="demo-badge-label">Adherence</div>
          <div class="demo-badge-value">92%</div>
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
</script>
</body>
</html>
