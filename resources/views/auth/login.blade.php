@extends('layouts.auth')

@section('title', 'Sign in — GeneoRx')

@section('content')
<div class="auth-shell">
  <div class="auth-intro">
    @include('partials.geneorx-brand', ['size' => 40])
    <span class="eyebrow">Welcome back</span>
    <h1>Sign in to your account.</h1>
    <p class="sub">Continue your GeneoRx setup, review insights, log check-ins, and prepare a doctor summary.</p>
    <div class="trust-row">
      <span>Private by design</span>
      <span>Guided setup</span>
      <span>Doctor-ready summary</span>
    </div>
  </div>

  <div class="auth-card">
    <div class="hd">
      <div>
        <h2>Sign in</h2>
        <p class="desc">Use the email and password you created for GeneoRx.</p>
      </div>
    </div>
    <div class="bd">

  @if ($errors->any())
    <div class="banner">
      @foreach ($errors->all() as $error)
        <div>{{ $error }}</div>
      @endforeach
    </div>
  @endif

  @if (session('success'))
    <div class="tagline">
      {{ session('success') }}
    </div>
  @endif

  <form method="POST" action="{{ route('login') }}" class="auth-form">
    @csrf

    <div>
      <label for="email">Email address</label>
      <input
        type="email"
        id="email"
        name="email"
        value="{{ old('email') }}"
        required
        placeholder="you@example.com"
      >
    </div>

    <div>
      <div class="form-label-row">
        <label for="password">Password</label>
        <a class="mailto" href="{{ route('password.request') }}">Forgot password?</a>
      </div>
      <input
        type="password"
        id="password"
        name="password"
        required
        placeholder="••••••••"
      >
    </div>

    <button type="submit" class="primary">
      Sign in to dashboard
    </button>
  </form>

  {{-- ── Social sign-in ──────────────────────────────────────────────────── --}}
  <div class="social-divider" style="margin-top:18px;"><span>or continue with</span></div>
  <div class="social-btns">
    {{-- Google --}}
    <a href="{{ route('auth.google') }}" class="social-btn">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </a>

    {{-- Apple --}}
    <a href="{{ route('auth.apple') }}" class="social-btn">
      <svg width="17" height="20" viewBox="0 0 17 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M13.87 10.56c-.02-2.14 1.75-3.17 1.83-3.22-1-1.46-2.56-1.66-3.11-1.68-1.32-.13-2.58.78-3.25.78-.67 0-1.7-.76-2.8-.74-1.44.02-2.77.84-3.51 2.12-1.5 2.6-.38 6.44 1.07 8.54.72 1.03 1.57 2.18 2.69 2.14 1.08-.04 1.49-.7 2.79-.7 1.3 0 1.67.7 2.81.68 1.16-.02 1.89-1.05 2.6-2.09.82-1.19 1.16-2.35 1.18-2.41-.02-.01-2.28-.87-2.3-3.42zM11.61 3.64C12.18 2.96 12.57 2 12.43.91c-.86.05-1.9.57-2.51 1.29-.55.64-1.03 1.65-.9 2.62.95.07 1.93-.47 2.59-1.18z"/>
      </svg>
      Continue with Apple
    </a>
  </div>

      <div class="auth-actions">
        <a href="{{ route('register') }}">Create a free account</a>
      </div>

      {{-- Guest demo CTA --}}
      <div style="margin-top:12px; text-align:center;">
        <a href="{{ route('guest') }}" style="font-size:13.5px;color:var(--text-muted);font-weight:500;display:inline-flex;align-items:center;gap:5px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Try the demo   no account needed
        </a>
      </div>

      <p class="fineprint" style="margin-top:10px;">GeneoRx is educational support only and does not replace medical advice.</p>
    </div>
  </div>
</div>
@endsection
