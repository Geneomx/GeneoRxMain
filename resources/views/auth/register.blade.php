@extends('layouts.app')

@push('styles')
<style>
  .social-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 8px 0;
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
  .social-btns {
    display: flex; flex-direction: column; gap: 10px;
  }
  .social-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 10px;
    height: 44px; padding: 0 16px;
    border-radius: 8px;
    font-size: 14.5px; font-weight: 600;
    font-family: var(--sans);
    cursor: pointer; text-decoration: none;
    border: 1px solid var(--border);
    transition: background 0.15s, border-color 0.15s;
  }
  .social-btn.google {
    background: #fff; color: #3c4043;
    border-color: #dadce0;
  }
  .social-btn.google:hover { background: #f8f9fa; border-color: #c8cacf; }
  .social-btn.apple {
    background: #000; color: #fff;
    border-color: #000;
  }
  .social-btn.apple:hover { background: #1a1a1a; }
  .social-btn svg { flex-shrink: 0; }
</style>
@endpush

@section('content')
<div class="auth-shell">
  <div class="auth-intro">
    <div class="auth-logo">
      <img src="{{ asset('logo.svg') }}" alt="GeneoRx">
      <span>GeneoRx</span>
    </div>
    <span class="eyebrow">Get started</span>
    <h1>Create your free account.</h1>
    <p class="sub">Save your medications, symptoms, routine, check-ins, and doctor summary across devices.</p>
    <div class="trust-row">
      <span>Free to start</span>
      <span>Email verification</span>
      <span>Weekly check-ins</span>
    </div>
  </div>

  <div class="auth-card">
    <div class="hd">
      <div>
        <h2>Account details</h2>
        <p class="desc">This lets GeneoRx keep your progress connected. Phone is optional and used for reminders when enabled.</p>
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

  <form method="POST" action="{{ route('register') }}" class="auth-form">
    @csrf

    <div>
      <label for="name">Full name</label>
      <input
        type="text"
        id="name"
        name="name"
        value="{{ old('name') }}"
        required
        placeholder="John Doe"
      >
    </div>

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
      <label for="phone">Phone number <span class="fineprint">(optional)</span></label>
      <input
        type="tel"
        id="phone"
        name="phone"
        value="{{ old('phone') }}"
        placeholder="+1 555 000 0000"
      >
      <small class="hint">Used only for reminders or support if you enable those features.</small>
    </div>

    <div>
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        required
        placeholder="••••••••"
        minlength="6"
      >
      <small class="hint">At least 6 characters.</small>
    </div>

    <div>
      <label for="password_confirmation">Confirm password</label>
      <input
        type="password"
        id="password_confirmation"
        name="password_confirmation"
        required
        placeholder="••••••••"
        minlength="6"
      >
    </div>

    <button type="submit" class="primary">
      Create free account
    </button>
  </form>

  {{-- ── Social sign-up ───────────────────────────────────────────────────── --}}
  <div class="social-divider" style="margin-top:18px;"><span>or sign up with</span></div>
  <div class="social-btns">
    <a href="{{ route('auth.google') }}" class="social-btn google">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </a>
    <a href="{{ route('auth.apple') }}" class="social-btn apple">
      <svg width="17" height="20" viewBox="0 0 17 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M13.87 10.56c-.02-2.14 1.75-3.17 1.83-3.22-1-1.46-2.56-1.66-3.11-1.68-1.32-.13-2.58.78-3.25.78-.67 0-1.7-.76-2.8-.74-1.44.02-2.77.84-3.51 2.12-1.5 2.6-.38 6.44 1.07 8.54.72 1.03 1.57 2.18 2.69 2.14 1.08-.04 1.49-.7 2.79-.7 1.3 0 1.67.7 2.81.68 1.16-.02 1.89-1.05 2.6-2.09.82-1.19 1.16-2.35 1.18-2.41-.02-.01-2.28-.87-2.3-3.42zM11.61 3.64C12.18 2.96 12.57 2 12.43.91c-.86.05-1.9.57-2.51 1.29-.55.64-1.03 1.65-.9 2.62.95.07 1.93-.47 2.59-1.18z"/>
      </svg>
      Continue with Apple
    </a>
  </div>

      <div class="auth-actions">
        <a href="{{ route('login') }}">Already have an account? Sign in</a>
      </div>

      {{-- Guest demo CTA --}}
      <div style="margin-top:12px; text-align:center;">
        <a href="{{ route('guest') }}" style="font-size:13.5px; color:var(--text-muted); font-weight:500; display:inline-flex; align-items:center; gap:5px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Try the demo first   no account needed
        </a>
      </div>

      <p class="fineprint" style="margin-top:10px;">After registration, GeneoRx sends a 6-digit email code to protect your account.</p>
    </div>
  </div>
</div>
@endsection
