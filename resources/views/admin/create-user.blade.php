@extends('admin.layout')
@section('title', 'Create User')

@section('content')
<div class="page-header">
  <div>
    <div style="margin-bottom:6px;">
      <a href="{{ route('admin.users') }}" style="font-size:13px;color:var(--text-muted);">← All users</a>
    </div>
    <h1>Create User</h1>
    <p>Add a new user account directly from the admin panel.</p>
  </div>
</div>

<div class="admin-card" style="max-width:640px;">
  <div class="admin-card-hd">
    <div><h2>Account details</h2></div>
  </div>
  <div class="admin-card-bd">
    <form method="POST" action="{{ route('admin.users.store') }}" novalidate>
      @csrf

      {{-- Name --}}
      <div class="field-group">
        <label class="field-label">Full name <span style="color:#B91C1C;">*</span></label>
        <input type="text" name="name" value="{{ old('name') }}" required
               placeholder="Jane Smith" style="width:100%;">
        @error('name')
          <div class="field-hint" style="color:#B91C1C;">{{ $message }}</div>
        @enderror
      </div>

      {{-- Email --}}
      <div class="field-group">
        <label class="field-label">Email address <span style="color:#B91C1C;">*</span></label>
        <input type="email" name="email" value="{{ old('email') }}" required
               placeholder="jane@example.com" style="width:100%;">
        @error('email')
          <div class="field-hint" style="color:#B91C1C;">{{ $message }}</div>
        @enderror
      </div>

      {{-- Password --}}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;" class="field-group">
        <div>
          <label class="field-label">Password <span style="color:#B91C1C;">*</span></label>
          <input type="password" name="password" required placeholder="Min 8 characters" style="width:100%;">
          @error('password')
            <div class="field-hint" style="color:#B91C1C;">{{ $message }}</div>
          @enderror
        </div>
        <div>
          <label class="field-label">Confirm password <span style="color:#B91C1C;">*</span></label>
          <input type="password" name="password_confirmation" required placeholder="Repeat password" style="width:100%;">
        </div>
      </div>

      {{-- Options --}}
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;padding:16px;background:var(--bg-soft);border:1px solid var(--border-soft);border-radius:8px;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
          <input type="checkbox" name="verified" value="1" {{ old('verified') ? 'checked' : '' }}
                 style="width:16px;height:16px;accent-color:var(--teal);flex-shrink:0;">
          <span>
            <strong style="font-size:13.5px;color:var(--text);">Mark email as verified</strong>
            <div class="field-hint" style="margin-top:1px;">Skip the email confirmation step.</div>
          </span>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
          <input type="checkbox" name="is_admin" value="1" {{ old('is_admin') ? 'checked' : '' }}
                 style="width:16px;height:16px;accent-color:var(--teal);flex-shrink:0;">
          <span>
            <strong style="font-size:13.5px;color:var(--text);">Grant admin access</strong>
            <div class="field-hint" style="margin-top:1px;">This user can manage users and medications in the admin panel.</div>
          </span>
        </label>
      </div>

      <div style="display:flex;gap:10px;">
        <button type="submit" class="btn btn-primary">Create user</button>
        <a href="{{ route('admin.users') }}" class="btn btn-ghost">Cancel</a>
      </div>
    </form>
  </div>
</div>
@endsection
