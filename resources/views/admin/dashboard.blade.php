@extends('admin.layout')
@section('title', 'Dashboard')

@section('content')
<div class="page-header">
  <div>
    <h1>Dashboard</h1>
    <p>Platform overview, updated in real time.</p>
  </div>
  <a href="{{ route('admin.users') }}" class="btn btn-ghost">View all users</a>
</div>

<!-- STAT CARDS -->
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-label">Total users</div>
    <div class="stat-value teal">{{ number_format($stats['total_users']) }}</div>
    <div class="stat-sub">+{{ $stats['new_users_week'] }} in the last 7 days</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Verified emails</div>
    <div class="stat-value">{{ number_format($stats['verified_users']) }}</div>
    <div class="stat-sub">{{ $stats['total_users'] > 0 ? round($stats['verified_users'] / $stats['total_users'] * 100) : 0 }}% of users</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Plus subscribers</div>
    <div class="stat-value teal">{{ number_format($stats['plus_users']) }}</div>
    <div class="stat-sub">Active and overridden</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Free users</div>
    <div class="stat-value">{{ number_format($stats['free_users']) }}</div>
    <div class="stat-sub">Potential upgrades</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Total check-ins</div>
    <div class="stat-value">{{ number_format($stats['total_checkins']) }}</div>
    <div class="stat-sub">{{ $stats['checkins_week'] }} in last 7 days</div>
  </div>
</div>

<!-- RECENT USERS -->
<div class="admin-card">
  <div class="admin-card-hd">
    <div>
      <h2>Recent registrations</h2>
      <p>The 10 most recently registered users.</p>
    </div>
    <a href="{{ route('admin.users') }}" class="btn btn-ghost btn-sm">See all</a>
  </div>
  <div class="admin-table-wrap">
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Email</th>
          <th>Verified</th>
          <th>Plan</th>
          <th>Joined</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @foreach($recent as $row)
          @php $u = $row['user']; @endphp
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="avatar-sq">{{ strtoupper(substr($u->name, 0, 1)) }}</div>
                <div>
                  <div style="font-weight:600;">{{ $u->name }}</div>
                  @if($u->is_admin)<span class="pill pill-admin" style="margin-top:2px;">Admin</span>@endif
                </div>
              </div>
            </td>
            <td style="color:var(--text-muted);">{{ $u->email }}</td>
            <td>
              @if($u->email_verified_at)
                <span class="pill pill-verified">Verified</span>
              @else
                <span class="pill pill-unverified">Pending</span>
              @endif
            </td>
            <td>
              @if($row['isPlus'])
                <span class="pill pill-plus">Plus</span>
              @else
                <span class="pill pill-free">Free</span>
              @endif
            </td>
            <td style="color:var(--text-muted);white-space:nowrap;">{{ $u->created_at->format('M j, Y') }}</td>
            <td>
              <a href="{{ route('admin.user-detail', $u) }}" class="btn btn-ghost btn-sm">View</a>
            </td>
          </tr>
        @endforeach
        @if($recent->isEmpty())
          <tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">No users yet.</td></tr>
        @endif
      </tbody>
    </table>
  </div>
</div>

<!-- QUICK LINKS -->
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
  <div class="admin-card" style="margin-bottom:0;">
    <div class="admin-card-bd">
      <div style="font-weight:700;font-size:15px;margin-bottom:5px;">Manage Users</div>
      <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:14px;line-height:1.55;">View, search, edit, and delete registered users.</div>
      <a href="{{ route('admin.users') }}" class="btn btn-primary" style="width:100%;">Open users</a>
    </div>
  </div>
  <div class="admin-card" style="margin-bottom:0;">
    <div class="admin-card-bd">
      <div style="font-weight:700;font-size:15px;margin-bottom:5px;">Medications catalog</div>
      <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:14px;line-height:1.55;">Add, edit, or deactivate medications shown in the app.</div>
      <a href="{{ route('admin.medications') }}" class="btn btn-primary" style="width:100%;">Manage medications</a>
    </div>
  </div>
  <div class="admin-card" style="margin-bottom:0;">
    <div class="admin-card-bd">
      <div style="font-weight:700;font-size:15px;margin-bottom:5px;">Grant Plus access</div>
      <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:14px;line-height:1.55;">Search for a user and grant admin-override Plus subscription.</div>
      <a href="{{ route('admin.users') }}?plan=free" class="btn btn-ghost" style="width:100%;">Find free users</a>
    </div>
  </div>
</div>
@endsection
