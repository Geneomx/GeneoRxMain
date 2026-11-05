@extends('layouts.app')

@section('title', 'Account settings · GeneoRx')

@section('content')
<style>
  .settings-wrap {
    max-width: 680px; margin: 24px auto; padding: 0 24px 80px;
  }
  .settings-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 28px;
  }
  .settings-page-title {
    font-size: 34px; font-weight: 700; letter-spacing: -0.9px; margin-bottom: 6px; line-height: 1.12;
  }
  .settings-page-sub {
    font-size: 14.5px; color: var(--text-muted);
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .settings-wrap { margin: 0; padding: 0 0 80px; }
    .settings-head { margin-bottom: 20px; }
    .settings-page-title { font-size: 22px; }
    .settings-card-header { padding: 14px 16px; }
    .settings-card-body { padding: 16px; }
    .danger-zone { padding: 18px 16px; }
    .settings-head .btn { width: 100%; justify-content: center; }
  }

  .settings-card {
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: 28px;
    box-shadow: var(--shadow);
    overflow: hidden;
    margin-bottom: 24px;
  }
  .settings-card-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-soft);
    display: flex; align-items: center; gap: 12px;
  }
  .settings-card-icon {
    width: 40px; height: 40px;
    background: var(--teal-50);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .settings-card-icon svg { color: var(--teal); }
  .settings-card-title { font-size: 19px; font-weight: 700; margin-bottom: 2px; letter-spacing: -0.3px; }
  .settings-card-desc { font-size: 14px; color: var(--text-muted); }
  .settings-card-body { padding: 24px 28px 28px; }

  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .field:last-of-type { margin-bottom: 0; }
  .field label { font-size: 14px; font-weight: 600; color: var(--pine); }
  .field input[type=password], .field input[type=text] {
    height: 50px;
    padding: 0 18px;
    border: 1.5px solid #8E8E93;
    border-radius: 20px;
    font-size: 16px;
    font-family: inherit;
    color: var(--text);
    background: var(--bg);
    transition: border-color 0.15s;
    outline: none;
  }
  .field input:focus { border-color: var(--teal); box-shadow: 0 0 0 4px rgba(207,224,207,0.85); }
  .field .hint { font-size: 12.5px; color: var(--text-dim); }

  .btn { display: inline-flex; align-items: center; height: 48px; padding: 0 26px; font-size: 15px; font-weight: 700; border-radius: 999px; border: 1px solid transparent; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .btn-primary { background: var(--coral); color: #fff; box-shadow: 0 12px 22px -12px rgba(0,113,227,.7); }
  .btn-primary:hover { background: var(--coral-dark); }
  .btn-danger { background: #FDECEA; color: #A63A27; border-color: #F5C6C0; }
  .btn-danger:hover { background: #B8402C; color: #fff; border-color: #B8402C; }

  .alert-success {
    background: var(--teal-50); border-left: 3px solid var(--teal);
    border-radius: 0 16px 16px 0; padding: 14px 18px;
    font-size: 14.5px; color: var(--text-soft); margin-bottom: 20px;
  }
  .alert-error {
    background: #FDECEA; border-left: 3px solid #B8402C;
    border-radius: 0 16px 16px 0; padding: 14px 18px;
    font-size: 14.5px; color: #7F2A1B; margin-bottom: 20px;
  }

  /* Danger zone */
  .danger-zone {
    background: #FBEDE8;
    border: 1.5px solid #F5C6C0;
    border-radius: 28px;
    padding: 28px;
  }
  .danger-zone h3 { font-size: 20px; font-weight: 700; color: #A63A27; margin-bottom: 8px; font-family: var(--serif); }
  .danger-zone p { font-size: 15px; color: #5B3A37; line-height: 1.6; margin-bottom: 20px; }
  .danger-zone details summary {
    cursor: pointer; font-size: 15px; font-weight: 700; color: #A63A27;
    list-style: none; display: flex; align-items: center; gap: 8px;
    user-select: none;
  }
  .danger-zone details summary::-webkit-details-marker { display: none; }
  .danger-zone details[open] summary { margin-bottom: 20px; }
  .danger-confirm-form { display: flex; flex-direction: column; gap: 12px; }
  .danger-confirm-form label { font-size: 13.5px; font-weight: 600; color: #374151; }
  .danger-confirm-form input {
    height: 50px; padding: 0 18px;
    border: 1.5px solid #D98F7F;
    border-radius: 20px; font-size: 16px;
    font-family: inherit; color: var(--text);
    background: #fff; outline: none;
    transition: border-color 0.15s;
  }
  .danger-confirm-form input:focus { border-color: #B8402C; box-shadow: 0 0 0 4px rgba(184,64,44,0.14); }
</style>

<div class="settings-wrap">
  <div class="settings-head">
    <div>
      <h1 class="settings-page-title">Account settings</h1>
      <p class="settings-page-sub">Manage your password and account data.</p>
    </div>
    <a href="{{ route('treatments') }}" class="btn btn-outline">Back to dashboard</a>
  </div>

  {{-- Success / error flash --}}
  @if (session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif
  @if (session('error'))
    <div class="alert-error">{{ session('error') }}</div>
  @endif

  {{-- ── Account info ────────────────────────────────────────────── --}}
  <div class="settings-card">
    <div class="settings-card-header">
      <div class="settings-card-icon">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      </div>
      <div>
        <div class="settings-card-title">Account information</div>
        <div class="settings-card-desc">Your registered name and email address.</div>
      </div>
    </div>
    <div class="settings-card-body">
      <div class="field">
        <label>Name</label>
        <input type="text" value="{{ $user->name }}" disabled style="background:var(--bg-soft);color:var(--text-muted);">
      </div>
      <div class="field">
        <label>Email address</label>
        <input type="text" value="{{ $user->email }}" disabled style="background:var(--bg-soft);color:var(--text-muted);">
        <span class="hint">To change your email, contact <a href="mailto:info@geneorx.com" style="color:var(--teal);">info@geneorx.com</a>.</span>
      </div>
    </div>
  </div>

  {{-- ── Change password ─────────────────────────────────────────── --}}
  <div class="settings-card">
    <div class="settings-card-header">
      <div class="settings-card-icon">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div>
        <div class="settings-card-title">Change password</div>
        <div class="settings-card-desc">Choose a new password for your account.</div>
      </div>
    </div>
    <div class="settings-card-body">
      @if ($errors->hasBag('default') && $errors->getBag('default')->has('current_password'))
        <div class="alert-error">{{ $errors->first('current_password') }}</div>
      @endif
      @if ($errors->has('password'))
        <div class="alert-error">{{ $errors->first('password') }}</div>
      @endif

      <form method="POST" action="{{ route('account.password') }}">
        @csrf @method('PUT')
        <div class="field">
          <label for="current_password">Current password</label>
          <input type="password" id="current_password" name="current_password" required placeholder="Your current password">
        </div>
        <div class="field">
          <label for="password">New password</label>
          <input type="password" id="password" name="password" required placeholder="At least 8 characters" minlength="8">
        </div>
        <div class="field">
          <label for="password_confirmation">Confirm new password</label>
          <input type="password" id="password_confirmation" name="password_confirmation" required placeholder="Repeat your new password">
        </div>
        <button type="submit" class="btn btn-primary">Update password</button>
      </form>
    </div>
  </div>

  {{-- ── Danger zone ─────────────────────────────────────────────── --}}
  <div class="danger-zone">
    <h3>Danger zone</h3>
    <p>Deleting your account is <strong>permanent and cannot be undone</strong>. All your medications, check-ins, symptoms, and health notes will be immediately and irreversibly removed from our servers.</p>

    <details>
      <summary>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        Delete my account permanently
      </summary>

      <form method="POST" action="{{ route('account.delete') }}" class="danger-confirm-form"
            onsubmit="return confirm('Last chance: this will delete your account and all data permanently. Proceed?')">
        @csrf @method('DELETE')

        @if ($errors->has('confirmation'))
          <div class="alert-error" style="margin:0 0 8px;">{{ $errors->first('confirmation') }}</div>
        @endif

        <label for="confirmation">
          Type <strong>DELETE</strong> in all caps to confirm:
        </label>
        <input
          type="text"
          id="confirmation"
          name="confirmation"
          placeholder="DELETE"
          autocomplete="off"
          spellcheck="false"
        >
        <button type="submit" class="btn btn-danger" style="align-self:flex-start;">
          Permanently delete account
        </button>
      </form>
    </details>
  </div>
</div>
@endsection
