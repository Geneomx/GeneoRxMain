@extends('layouts.app')

@section('title', 'Account settings · GeneoRx')

@section('content')
<style>
  .settings-wrap {
    max-width: 680px; margin: 40px auto; padding: 0 24px 80px;
  }
  .settings-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 34px;
  }
  .settings-page-title {
    font-size: 26px; font-weight: 800; letter-spacing: -0.4px; margin-bottom: 6px;
  }
  .settings-page-sub {
    font-size: 14.5px; color: var(--text-muted);
  }

  .settings-card {
    background: var(--bg);
    border: 1px solid var(--border-soft);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  .settings-card-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-soft);
    display: flex; align-items: center; gap: 12px;
  }
  .settings-card-icon {
    width: 36px; height: 36px;
    background: var(--teal-50);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .settings-card-icon svg { color: var(--teal); }
  .settings-card-title { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
  .settings-card-desc { font-size: 13px; color: var(--text-muted); }
  .settings-card-body { padding: 22px 24px; }

  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .field:last-of-type { margin-bottom: 0; }
  .field label { font-size: 13.5px; font-weight: 600; color: var(--text-soft); }
  .field input[type=password], .field input[type=text] {
    height: 42px;
    padding: 0 14px;
    border: 1px solid var(--border);
    border-radius: 9px;
    font-size: 14.5px;
    font-family: inherit;
    color: var(--text);
    background: var(--bg);
    transition: border-color 0.15s;
    outline: none;
  }
  .field input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(14,124,102,0.1); }
  .field .hint { font-size: 12.5px; color: var(--text-dim); }

  .btn { display: inline-flex; align-items: center; height: 40px; padding: 0 20px; font-size: 14px; font-weight: 600; border-radius: 9px; border: 1px solid transparent; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .btn-primary { background: var(--teal); color: #fff; }
  .btn-primary:hover { background: var(--teal-dark); }
  .btn-danger { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
  .btn-danger:hover { background: #DC2626; color: #fff; border-color: #DC2626; }

  .alert-success {
    background: var(--teal-50); border-left: 3px solid var(--teal);
    border-radius: 0 8px 8px 0; padding: 12px 16px;
    font-size: 14px; color: var(--text-soft); margin-bottom: 20px;
  }
  .alert-error {
    background: #FEF2F2; border-left: 3px solid #DC2626;
    border-radius: 0 8px 8px 0; padding: 12px 16px;
    font-size: 14px; color: #7F1D1D; margin-bottom: 20px;
  }

  /* Danger zone */
  .danger-zone {
    background: #FFFBFB;
    border: 1px solid #FEE2E2;
    border-radius: 14px;
    padding: 24px;
  }
  .danger-zone h3 { font-size: 15px; font-weight: 700; color: #DC2626; margin-bottom: 8px; }
  .danger-zone p { font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 20px; }
  .danger-zone details summary {
    cursor: pointer; font-size: 14px; font-weight: 600; color: #DC2626;
    list-style: none; display: flex; align-items: center; gap: 8px;
    user-select: none;
  }
  .danger-zone details summary::-webkit-details-marker { display: none; }
  .danger-zone details[open] summary { margin-bottom: 20px; }
  .danger-confirm-form { display: flex; flex-direction: column; gap: 12px; }
  .danger-confirm-form label { font-size: 13.5px; font-weight: 600; color: #374151; }
  .danger-confirm-form input {
    height: 42px; padding: 0 14px;
    border: 1px solid #FCA5A5;
    border-radius: 9px; font-size: 14.5px;
    font-family: inherit; color: var(--text);
    background: #fff; outline: none;
    transition: border-color 0.15s;
  }
  .danger-confirm-form input:focus { border-color: #DC2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
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
