@extends('layouts.app')

@section('content')
<div class="auth-shell">
  <div class="auth-intro">
    <div class="auth-logo">
      <img src="{{ asset('logo.svg') }}" alt="GeneoRx">
      <span>GeneoRx</span>
    </div>
    <span class="eyebrow">Account recovery</span>
    <h1>Reset your password.</h1>
    <p class="sub">Enter the email address linked to your GeneoRx account and we will send you a secure reset link.</p>
    <div class="trust-row">
      <span>Link expires in 60 min</span>
      <span>Secure one-time link</span>
      <span>No account required to request</span>
    </div>
  </div>

  <div class="auth-card">
    <div class="hd">
      <div>
        <h2>Forgot password</h2>
        <p class="desc">We will email a one-time reset link. Check your spam folder if you do not see it within a couple of minutes.</p>
      </div>
    </div>
    <div class="bd">

      @if (session('status'))
        <div class="tagline" style="background:var(--teal-50);border-left:3px solid var(--teal);padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:22px;font-size:14.5px;color:var(--text-soft);">
          {{ session('status') }}
        </div>
      @endif

      @if ($errors->any())
        <div class="banner">
          @foreach ($errors->all() as $error)
            <div>{{ $error }}</div>
          @endforeach
        </div>
      @endif

      <form method="POST" action="{{ route('password.email') }}" class="auth-form">
        @csrf

        <div>
          <label for="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            value="{{ old('email') }}"
            required
            autofocus
            placeholder="you@example.com"
          >
        </div>

        <button type="submit" class="primary">
          Send reset link
        </button>
      </form>

      <div class="auth-actions">
        <a href="{{ route('login') }}">Back to sign in</a>
        <a href="{{ route('register') }}">Create a free account</a>
      </div>
      <p class="fineprint">GeneoRx is educational support only and does not replace medical advice.</p>
    </div>
  </div>
</div>
@endsection
