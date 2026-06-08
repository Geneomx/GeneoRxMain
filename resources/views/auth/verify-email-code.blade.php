@extends('layouts.auth')

@section('title', 'Verify email — GeneoRx')

@section('content')
<div class="auth-shell auth-shell-single">
  <div class="auth-card">
    <div class="hd">
      <div>
        <h2>Verify your email</h2>
        <p class="desc">We sent a 6-digit code to <strong>{{ $email }}</strong>. Verification keeps your GeneoRx progress connected across devices.</p>
      </div>
    </div>
    <div class="bd">
      <div class="tagline">
        <strong>Why this matters</strong><br>
        You can explore GeneoRx now, but verifying your email protects account recovery and sync.
      </div>

      @if ($errors->any())
        <div class="banner">
          @foreach ($errors->all() as $error)
            <div>{{ $error }}</div>
          @endforeach
        </div>
      @endif

      @if (session('success'))
        <div class="tagline">{{ session('success') }}</div>
      @endif

      <form method="POST" action="{{ route('email.otp.verify') }}" class="auth-form">
        @csrf
        <div>
          <label for="code">Verification code</label>
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]{6}"
            maxlength="6"
            id="code"
            name="code"
            required
            placeholder="123456"
            class="otp-field"
          >
          <small class="hint">The code expires in 10 minutes. Check spam or resend if it does not arrive.</small>
        </div>

        <button type="submit" class="primary">Verify and continue</button>
      </form>

      <div class="auth-actions">
        <form method="POST" action="{{ route('email.otp.resend') }}">
          @csrf
          <button type="submit" class="ghost">Resend code</button>
        </form>
        <a href="{{ route('treatments') }}">Skip for now</a>
      </div>
      <p class="fineprint" style="margin-top:10px;">Skipping does not delete your account. You can verify later from the banner at the top of GeneoRx.</p>
    </div>
  </div>
</div>
@endsection

@push('styles')
<style>
  .otp-field { letter-spacing: 0.18em; font-size: 18px; text-align: center; font-weight: 700; }
  .hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; display: block; line-height: 1.45; }
  .ghost {
    display: inline-flex; align-items: center; justify-content: center;
    height: 40px; padding: 0 14px; border-radius: 10px;
    border: 1px solid var(--border); background: rgba(7, 10, 18, 0.35);
    color: var(--text-soft); font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.18); }
</style>
@endpush
