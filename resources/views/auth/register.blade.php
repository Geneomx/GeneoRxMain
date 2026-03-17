@extends('layouts.app')

@section('content')
<div class="auth-container" style="max-width: 400px; margin: 60px auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 28px; margin: 0 0 8px 0; color: #fff;">GeneoRx</h1>
    <p style="color: #aaa; margin: 0;">Create your account</p>
  </div>

  @if ($errors->any())
    <div style="background: #fee; border: 1px solid #f88; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #c33;">
      @foreach ($errors->all() as $error)
        <div>{{ $error }}</div>
      @endforeach
    </div>
  @endif

  @if (session('success'))
    <div style="background: #efe; border: 1px solid #8f8; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #3a3;">
      {{ session('success') }}
    </div>
  @endif

  <form method="POST" action="{{ route('register') }}" style="display: flex; flex-direction: column; gap: 16px;">
    @csrf

    <div>
      <label for="name" style="display: block; font-size: 14px; font-weight: 600; color: #ddd; margin-bottom: 6px;">Full Name</label>
      <input
        type="text"
        id="name"
        name="name"
        value="{{ old('name') }}"
        required
        placeholder="John Doe"
        style="width: 100%; padding: 10px; border: 1px solid #2a3f5f; border-radius: 6px; background: #0B1022; color: #fff; font-size: 14px; box-sizing: border-box;"
      >
    </div>

    <div>
      <label for="email" style="display: block; font-size: 14px; font-weight: 600; color: #ddd; margin-bottom: 6px;">Email Address</label>
      <input
        type="email"
        id="email"
        name="email"
        value="{{ old('email') }}"
        required
        placeholder="you@example.com"
        style="width: 100%; padding: 10px; border: 1px solid #2a3f5f; border-radius: 6px; background: #0B1022; color: #fff; font-size: 14px; box-sizing: border-box;"
      >
    </div>

    <div>
      <label for="password" style="display: block; font-size: 14px; font-weight: 600; color: #ddd; margin-bottom: 6px;">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        required
        placeholder="••••••••"
        minlength="6"
        style="width: 100%; padding: 10px; border: 1px solid #2a3f5f; border-radius: 6px; background: #0B1022; color: #fff; font-size: 14px; box-sizing: border-box;"
      >
      <small style="color: #999; font-size: 12px; display: block; margin-top: 6px;">At least 6 characters</small>
    </div>

    <div>
      <label for="password_confirmation" style="display: block; font-size: 14px; font-weight: 600; color: #ddd; margin-bottom: 6px;">Confirm Password</label>
      <input
        type="password"
        id="password_confirmation"
        name="password_confirmation"
        required
        placeholder="••••••••"
        minlength="6"
        style="width: 100%; padding: 10px; border: 1px solid #2a3f5f; border-radius: 6px; background: #0B1022; color: #fff; font-size: 14px; box-sizing: border-box;"
      >
    </div>

    <button type="submit" style="padding: 12px; background: linear-gradient(135deg, #1abc9c, #16a085); color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
      Create Account
    </button>
  </form>

  <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #2a3f5f;">
    <p style="color: #aaa; margin: 0; font-size: 14px;">
      Already have an account? <a href="{{ route('login') }}" style="color: #1abc9c; text-decoration: none; font-weight: 600;">Sign in</a>
    </p>
  </div>
</div>
@endsection
