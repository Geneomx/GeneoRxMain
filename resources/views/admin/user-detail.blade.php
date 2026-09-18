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
    @if($user->email_verified_at)
      <span class="pill pill-verified" style="padding:6px 12px;font-size:13px;">Email verified</span>
    @else
      <span class="pill pill-unverified" style="padding:6px 12px;font-size:13px;">Email unverified</span>
    @endif

    @if($user->is_admin)
      <span class="pill pill-admin" style="padding:6px 12px;font-size:13px;">{{ ucfirst($user->adminRole()) }}</span>
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
            <span style="color:var(--success);">✓ {{ $user->email_verified_at->format('M j, Y') }}</span>
          @else
            <span style="color:var(--warn);">Not verified</span>
          @endif
        </div>
      </div>
      <div class="info-item"><div class="info-label">Joined</div><div class="info-value muted">{{ $user->created_at->format('M j, Y') }}</div></div>
      <div class="info-item"><div class="info-label">Check-ins</div><div class="info-value">{{ $user->check_ins_count }}</div></div>
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

      @if($user->id !== auth()->id() && auth()->user()->canManageAccounts())
        <form method="POST" action="{{ route('admin.delete-user', $user) }}"
              onsubmit="return confirm('Permanently delete {{ addslashes($user->name) }} and ALL their data?\nThis cannot be undone.')">
          @csrf @method('DELETE')
          <button type="submit" class="btn btn-danger btn-sm">Delete user permanently</button>
        </form>
      @endif

    </div>

    {{-- Admin role tier — owners only --}}
    @if($user->is_admin && $user->id !== auth()->id() && auth()->user()->canManageAccounts())
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">Admin role</div>
        <form method="POST" action="{{ route('admin.set-role', $user) }}" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          @csrf
          <select name="role" style="min-width:170px;">
            <option value="owner"   @selected($user->adminRole() === 'owner')>Owner   full control</option>
            <option value="admin"   @selected($user->adminRole() === 'admin')>Admin   day-to-day</option>
            <option value="support" @selected($user->adminRole() === 'support')>Support   read-only</option>
          </select>
          <button type="submit" class="btn btn-ghost btn-sm">Update role</button>
          <span style="font-size:12px;color:var(--text-dim);">Owners can delete users, manage admins and set passwords.</span>
        </form>
      </div>
    @endif
  </div>
</div>
<style>.ud-hidden { display:none !important; }</style>

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
            <div class="field-hint" style="color:var(--danger);">{{ $message }}</div>
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

<!-- TRACKED MEDICATIONS -->
<div class="admin-card">
  <div class="admin-card-hd">
    <div>
      <h2>Tracked Medications</h2>
      <p>This patient's current active list (separate from the admin medication catalog).</p>
    </div>
  </div>
  @if($trackedMedications->isNotEmpty())
    <div class="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          @foreach($trackedMedications as $m)
            <tr>
              <td>{{ $m['name'] }}</td>
              <td style="color:var(--text-muted);">{{ $m['dosage'] ?: '—' }}</td>
              <td style="color:var(--text-muted);">{{ $m['durationMonths'] ? $m['durationMonths'] . ' mo' : '—' }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>
  @else
    <div class="admin-card-bd" style="text-align:center;padding:28px;color:var(--text-muted);">
      No medications tracked yet.
    </div>
  @endif
</div>

<!-- RECENT CHECK-INS -->
<div class="admin-card">
    <div class="admin-card-hd"><h3>Reminders &amp; access</h3></div>
    <div class="admin-card-bd">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Weekly reminders</div>
          <div class="info-value">
            <span class="pill {{ $reminderEnabled ? 'pill-verified' : 'pill-free' }}">
              {{ $reminderEnabled ? 'On' : 'Off' }}
            </span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Registered devices</div>
          {{-- The preference is per account, tokens are per device. Reminders on
               with zero devices means the Sunday cron has nothing to send to —
               exactly the silent failure this is here to surface. --}}
          <div class="info-value">
            {{ $pushTokens->whereNull('disabled_at')->count() }}
            @if($pushTokens->whereNotNull('disabled_at')->count())
              <span class="muted" style="font-size:12px;">({{ $pushTokens->whereNotNull('disabled_at')->count() }} disabled)</span>
            @endif
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Will receive reminders</div>
          @php $willReceive = $reminderEnabled && $pushTokens->whereNull('disabled_at')->count() > 0; @endphp
          <div class="info-value">
            <span class="pill {{ $willReceive ? 'pill-verified' : 'pill-free' }}">
              {{ $willReceive ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Subscription</div>
          <div class="info-value">
            @if($user->subscription)
              <span class="pill {{ $user->isSubscribed() ? 'pill-verified' : 'pill-free' }}">
                {{ $user->isSubscribed() ? 'Entitled' : 'Not entitled' }}
              </span>
              <span class="muted" style="font-size:12px;">
                {{ ucfirst($user->subscription->plan ?? 'free') }} &middot; {{ $user->subscription->status }}
                @if($user->subscription->admin_override_ends_at && $user->subscription->admin_override_ends_at->isFuture())
                  &middot; admin override
                @endif
              </span>
            @else
              <span class="muted">None</span>
            @endif
          </div>
        </div>
      </div>
    </div>
  </div>

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
            <th>Supplements</th>
            <th>Symptoms</th>
            <th>Adherence</th>
            <th>Wellbeing</th>
            <th>Body systems</th>
            <th>Monthly check</th>
          </tr>
        </thead>
        <tbody>
          @foreach($user->checkIns as $ci)
            @php
              // The client stores the full check-in payload in `data`; the top-level
              // medications/symptoms columns are never written by saveProfile().
              $ciSupplements = data_get($ci->data, 'supplementsTaken', []);
              $ciSymptoms = array_column(data_get($ci->data, 'symptoms.items', []), 'symptom');

              // v3 fields. Every rating is `number|null` where null means the
              // question was not answered — it must render as a dash, never 0,
              // or support would read "not asked" as "worst possible score".
              $ciPlanned = data_get($ci->data, 'supplementsPlanned');
              $rate = function ($key) use ($ci) {
                  $v = data_get($ci->data, 'wellbeing.' . $key);
                  return (is_numeric($v) && is_finite((float) $v)) ? (int) $v : null;
              };
              $ciCore = ['energy' => $rate('energy'), 'mood' => $rate('mood'),
                         'sleep' => $rate('sleep'), 'focus' => $rate('focus')];
              $ciSystems = ['digestive' => $rate('digestive'), 'circulation' => $rate('circulation'),
                            'immunity' => $rate('immunity')];
              $fmtRates = fn (array $r) => implode(' / ', array_map(
                  fn ($v) => $v === null ? '—' : $v, $r));
              $ciAnswered = count(array_filter($ciCore + $ciSystems, fn ($v) => $v !== null));

              // Tri-state: 'yes' | 'no' | 'unsure' | null. 'unsure' is a real
              // answer and must not be shown as a failure.
              $ciCompletion = data_get($ci->data, 'completion');
              $tri = function ($v) {
                  return match ($v) {
                      'yes' => 'Yes',
                      'no' => 'No',
                      'unsure' => 'Unsure',
                      default => null,
                  };
              };
            @endphp
            <tr>
              <td style="white-space:nowrap;color:var(--text-muted);">{{ $ci->created_at->format('M j, Y') }}</td>
              <td>
                @php
                  // A saved check-in is stored with status "active"; treat that
                  // (and the legacy "complete") as a finished record so the pill
                  // is not permanently stuck on the grey "draft" branch.
                  $ciDone = in_array($ci->status, ['active', 'complete'], true);
                @endphp
                <span class="pill {{ $ciDone ? 'pill-verified' : 'pill-free' }}">
                  {{ $ciDone ? 'Complete' : ucfirst($ci->status ?? 'draft') }}
                </span>
              </td>
              <td style="color:var(--text-muted);font-size:12.5px;">
                {{-- Taken alone is unreadable: 3 taken means nothing without the
                     plan size. supplementsPlanned is absent on pre-v3 rows. --}}
                @if(is_array($ciPlanned) && count($ciPlanned))
                  <strong style="color:var(--text);">{{ count($ciSupplements) }}/{{ count($ciPlanned) }}</strong>
                @else
                  <strong style="color:var(--text);">{{ count($ciSupplements) }}</strong>
                @endif
                @if(count($ciSupplements))
                  <div>{{ implode(', ', array_slice($ciSupplements, 0, 2)) }}@if(count($ciSupplements) > 2) +{{ count($ciSupplements) - 2 }}@endif</div>
                @endif
              </td>
              <td style="color:var(--text-muted);font-size:12.5px;">
                {{ implode(', ', array_slice($ciSymptoms, 0, 3)) ?: '—' }}
                @if(count($ciSymptoms) > 3)
                  <span style="color:var(--text-muted);"> +{{ count($ciSymptoms) - 3 }}</span>
                @endif
              </td>
              <td style="color:var(--text-muted);">
                {{ $ci->adherence_percentage !== null ? $ci->adherence_percentage . '%' : '—' }}
              </td>

              <td style="color:var(--text-muted);font-size:12.5px;white-space:nowrap;"
                  title="Energy / Mood / Sleep / Focus, 0-10">
                {{ $fmtRates($ciCore) }}
              </td>

              <td style="color:var(--text-muted);font-size:12.5px;white-space:nowrap;"
                  title="Digestive / Circulation / Immunity, 0-10. A dash means the user did not answer.">
                {{ $fmtRates($ciSystems) }}
                <div style="font-size:11px;">{{ $ciAnswered }}/7 answered</div>
              </td>

              <td style="color:var(--text-muted);font-size:12.5px;">
                @if($ciCompletion)
                  <div>Labs: <strong style="color:var(--text);">{{ $tri(data_get($ciCompletion, 'labs')) ?? 'not asked' }}</strong></div>
                  <div>Prescriber: <strong style="color:var(--text);">{{ $tri(data_get($ciCompletion, 'prescriber')) ?? 'not asked' }}</strong></div>
                  @php
                    $life = array_filter((array) data_get($ciCompletion, 'lifestyle', []), fn ($v) => $v === 'yes');
                  @endphp
                  <div style="font-size:11px;">Lifestyle: {{ count($life) }} yes</div>
                @else
                  <span>—</span>
                @endif
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
