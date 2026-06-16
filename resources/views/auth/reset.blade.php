@extends('layouts.auth')

@section('title', 'Reset password — GeneoRx')

@section('content')
<div class="auth-shell">
  <div class="auth-intro">
    @include('partials.geneorx-brand', ['variant' => 'full', 'logoSize' => 'hero', 'showName' => false])
    <span class="eyebrow">Account recovery</span>
    <h1>Choose a new password.</h1>
    <p class="sub">Pick something secure you have not used before. Your email address will remain the same.</p>
    <div class="trust-row">
      <span>8+ characters</span>
      <span>Stored securely (hashed)</span>
      <span>Link used only once</span>
    </div>
  </div>

  <div class="auth-card">
    <div class="hd">
      <div>
        <h2>Reset password</h2>
        <p class="desc">Enter a new password for <strong>{{ $email }}</strong>. You will be signed in after resetting.</p>
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

      <form method="POST" action="{{ route('password.update') }}" class="auth-form">
        @csrf

        <input type="hidden" name="token" value="{{ $token }}">
        <input type="hidden" name="email" value="{{ $email }}">

        <div>
          <label for="password">New password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autofocus
            placeholder="••••••••"
          >
        </div>

        <div>
          <label for="password_confirmation">Confirm new password</label>
          <input
            type="password"
            id="password_confirmation"
            name="password_confirmation"
            required
            placeholder="••••••••"
          >
        </div>

        <button type="submit" class="primary">Reset password</button>
      </form>

      <div class="auth-actions">
        <a href="{{ route('login') }}">Back to sign in</a>
      </div>
    </div>
  </div>
</div>
@endsection
