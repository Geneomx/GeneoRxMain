@extends('admin.layout')
@section('title', 'User   ' . $user->name)

@section('content')

<div class="page-header">
  <div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
      <a href="{{ route('admin.users') }}" style="font-size:13px;color:var(--text-muted);display:inline-flex;align-items:center;gap:5px;">
        ← All users
      </a>
    </div>
    <h1>{{ $user->name }}</h1>
    <p>{{ $user->email }}</p>
  </div>

  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
    @if($isPlus)
      <span class="pill pill-plus" style="padding:6px 12px;font-size:13px;">Plus</span>
    @else
      <span class="pill pill-free" style="padding:6px 12px;font-size:13px;">Free</span>
    @endif

    @if($user->email_verified_at)
      <span class="pill pill-verified" style="padding:6px 12px;font-size:13px;">Email verified</span>
    @else
      <span class="pill pill-unverified" style="padding:6px 12px;font-size:13px;">Email unverified</span>
    @endif

    @if($user->is_admin)
      <span class="pill pill-admin" style="padding:6px 12px;font-size:13px;">Admin</span>
    @endif
  </div>
</div>

<!-- USER INFO + EDIT -->
<div class="admin-card">
  <div class="admin-card-hd">
    <div><h2>Account Details</h2></div>
    <button class="btn btn-ghost btn-sm" type="button"
            onclick="document.getElementById('editForm').classList.toggle('hidden')">Edit</button>
  </div>
  <div class="admin-card-bd">
    <div class="info-grid">
      <div class="info-item"><div class="info-label">User ID</div><div class="info-value muted">#{{ $user->id }}</div></div>
      <div class="info-item"><div class="info-label">Name</div><div class="info-value">{{ $user->name }}</div></div>
      <div class="info-item"><div class="info-label">Email</div><div class="info-value">{{ $user->email }}</div></div>
      <div class="info-item">
        <div class="info-label">Email Verified</div>
        <div class="info-value">
          @if($user->email_verified_at)
            <span style="color:#166534;">✓ {{ $user->email_verified_at->format('M j, Y') }}</span>
          @else
            <span style="color:#92400E;">Not verified</span>
          @endif
        </div>
      </div>
      <div class="info-item"><div class="info-label">Joined</div><div class="info-value muted">{{ $user->created_at->format('M j, Y') }}</div></div>
      <div class="info-item"><div class="info-label">Check-ins</div><div class="info-value">{{ $user->checkIns->count() }}</div></div>
      @if($user->profile)
        <div class="info-item"><div class="info-label">Phone</div><div class="info-value muted">{{ $user->profile->phone ?? '—' }}</div></div>
      @endif
    </div>

    {{-- Inline edit form --}}
    <div id="editForm" class="ud-hidden" style="border-top:1px solid var(--border-soft);margin-top:18px;padding-top:18px;">
      <form method="POST" action="{{ route('admin.update-user', $user) }}">
        @csrf @method('PUT')
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
          <div class="field-group" style="margin-bottom:0;">
            <label class="field-label">Full name</label>
            <input type="text" name="name" value="{{ old('name', $user->name) }}" required style="width:100%;">
          </div>
          <div class="field-group" style="margin-bottom:0;">
            <label class="field-label">Email address</label>
            <input type="email" name="email" value="{{ old('email', $user->email) }}" required style="width:100%;">
            <div class="field-hint">Changing email clears email verification.</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;">
          <button type="submit" class="btn btn-primary btn-sm">Save changes</button>
          <button type="button" class="btn btn-ghost btn-sm"
                  onclick="document.getElementById('editForm').classList.add('ud-hidden')">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- QUICK ACTIONS -->
<div class="admin-card">
  <div class="admin-card-hd"><div><h2>Quick actions</h2></div></div>
  <div class="admin-card-bd">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">

      <form method="POST" action="{{ route('admin.send-reset', $user) }}">
        @csrf
        <button type="submit" class="btn btn-ghost btn-sm">Send password reset email</button>
      </form>

      @if($user->id !== auth()->id())
        <form method="POST" action="{{ route('admin.toggle-admin', $user) }}">
          @csrf
          <button type="submit" class="btn btn-ghost btn-sm"
                  onclick="return confirm('{{ $user->is_admin ? 'Remove admin access from' : 'Grant admin access to' }} {{ addslashes($user->name) }}?')">
            {{ $user->is_admin ? 'Remove admin access' : 'Make admin' }}
          </button>
        </form>
      @endif

      @if($user->id !== auth()->id())
        <form method="POST" action="{{ route('admin.delete-user', $user) }}"
              onsubmit="return confirm('Permanently delete {{ addslashes($user->name) }} and ALL their data?\nThis cannot be undone.')">
          @csrf @method('DELETE')
          <button type="submit" class="btn btn-danger btn-sm">Delete user permanently</button>
        </form>
      @endif

    </div>
  </div>
</div>
<style>.ud-hidden { display:none !important; }</style>

<!-- SUBSCRIPTION -->
<div class="admin-card">
  <div class="admin-card-hd">
    <div>
      <h2>Subscription</h2>
      <p>Current plan and billing status.</p>
    </div>
  </div>
  <div class="admin-card-bd">
    <div class="info-grid" style="margin-bottom:18px;">
      <div class="info-item">
        <div class="info-label">Plan</div>
        <div class="info-value">{{ ucfirst($subscription->plan ?? 'free') }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value">{{ ucfirst($subscription->status ?? 'free') }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Admin Override Until</div>
        <div class="info-value">
          @if($subscription->admin_override_ends_at && $subscription->admin_override_ends_at->isFuture())
            <span style="color:var(--teal);">{{ $subscription->admin_override_ends_at->format('M j, Y') }}</span>
          @else
            <span style="color:var(--text-muted);"> </span>
          @endif
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Override Reason</div>
        <div class="info-value muted">{{ $subscription->admin_override_reason ?? ' ' }}</div>
      </div>
      @if($subscription->current_period_ends_at)
        <div class="info-item">
          <div class="info-label">Billing Period Ends</div>
          <div class="info-value muted">{{ $subscription->current_period_ends_at->format('M j, Y') }}</div>
        </div>
      @endif
      @if($subscription->canceled_at)
        <div class="info-item">
          <div class="info-label">Canceled At</div>
          <div class="info-value muted">{{ $subscription->canceled_at->format('M j, Y') }}</div>
        </div>
      @endif
    </div>

    <!-- GRANT / REVOKE -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.08);padding-top:16px;">
      @if(!$isPlus || !($subscription->admin_override_ends_at && $subscription->admin_override_ends_at->isFuture()))
        <form method="POST" action="{{ route('admin.grant-plus', $user) }}">
          @csrf
          <button type="submit" class="btn btn-primary">Grant Plus (1 year)</button>
        </form>
      @endif

      @if($subscription->admin_override_ends_at && $subscription->admin_override_ends_at->isFuture())
        <form method="POST" action="{{ route('admin.revoke-plus', $user) }}">
          @csrf
          @method('DELETE')
          <button type="submit" class="btn btn-danger" onclick="return confirm('Remove admin override for {{ addslashes($user->name) }}?')">
            Remove Override
          </button>
        </form>
      @endif
    </div>
  </div>
</div>

<!-- SET PASSWORD -->
<div class="admin-card">
  <div class="admin-card-hd">
    <div><h2>Set Password</h2><p>Directly update this user's password without sending an email.</p></div>
  </div>
  <div class="admin-card-bd">
    <form method="POST" action="{{ route('admin.set-password', $user) }}">
      @csrf
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">New password</label>
          <input type="password" name="new_password" placeholder="Min 8 characters" required style="width:100%;">
          @error('new_password')
            <div class="field-hint" style="color:#B91C1C;">{{ $message }}</div>
          @enderror
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label">Confirm password</label>
          <input type="password" name="new_password_confirmation" placeholder="Repeat password" required style="width:100%;">
        </div>
      </div>
      <button type="submit" class="btn btn-ghost btn-sm"
              onclick="return confirm('Set a new password for {{ addslashes($user->name) }}?')">
        Update password
      </button>
    </form>
  </div>
</div>

<!-- EMAIL VERIFICATION ACTION -->
<div class="admin-card">
  <div class="admin-card-hd">
    <h2>Email Verification</h2>
  </div>
  <div class="admin-card-bd" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
    <div>
      <p style="font-size:14px;color:var(--text-muted);">
        Current status:
        <strong style="color:{{ $user->email_verified_at ? 'var(--green)' : 'var(--amber)' }}">
          {{ $user->email_verified_at ? 'Verified' : 'Not verified' }}
        </strong>
        @if($user->email_verified_at)
          ({{ $user->email_verified_at->format('M j, Y') }})
        @endif
      </p>
    </div>
    <form method="POST" action="{{ route('admin.verify-email', $user) }}">
      @csrf
      <button type="submit" class="btn {{ $user->email_verified_at ? 'btn-danger' : 'btn-primary' }}">
        {{ $user->email_verified_at ? 'Mark as Unverified' : 'Mark as Verified' }}
      </button>
    </form>
  </div>
</div>

<!-- RECENT CHECK-INS -->
@if($user->checkIns->isNotEmpty())
  <div class="admin-card">
    <div class="admin-card-hd">
      <div>
        <h2>Recent Check-ins</h2>
        <p>Last {{ $user->checkIns->count() }} check-ins (most recent first).</p>
      </div>
    </div>
    <div class="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Medications</th>
            <th>Symptoms</th>
            <th>Adherence</th>
          </tr>
        </thead>
        <tbody>
          @foreach($user->checkIns as $ci)
            <tr>
              <td style="white-space:nowrap;color:var(--text-muted);">{{ $ci->created_at->format('M j, Y') }}</td>
              <td>
                <span class="pill {{ $ci->status === 'complete' ? 'pill-verified' : 'pill-free' }}">
                  {{ ucfirst($ci->status ?? 'draft') }}
                </span>
              </td>
              <td style="color:var(--text-muted);font-size:12.5px;">
                {{ is_array($ci->medications) ? implode(', ', array_slice($ci->medications, 0, 3)) : ' ' }}
                @if(is_array($ci->medications) && count($ci->medications) > 3)
                  <span style="color:var(--text-muted);"> +{{ count($ci->medications) - 3 }}</span>
                @endif
              </td>
              <td style="color:var(--text-muted);font-size:12.5px;">
                {{ is_array($ci->symptoms) ? implode(', ', array_slice($ci->symptoms, 0, 3)) : ' ' }}
                @if(is_array($ci->symptoms) && count($ci->symptoms) > 3)
                  <span style="color:var(--text-muted);"> +{{ count($ci->symptoms) - 3 }}</span>
                @endif
              </td>
              <td style="color:var(--text-muted);">
                {{ $ci->adherence_percentage !== null ? $ci->adherence_percentage . '%' : ' ' }}
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>
  </div>
@else
  <div class="admin-card">
    <div class="admin-card-bd" style="text-align:center;padding:28px;color:var(--text-muted);">
      No check-ins recorded yet.
    </div>
  </div>
@endif

@endsection
