@extends('admin.layout')
@section('title', 'Users')

@section('content')
<div class="page-header">
  <div>
    <h1>Users</h1>
    <p>{{ $users->total() }} total {{ Str::plural('user', $users->total()) }} registered.</p>
  </div>
  <div style="display:flex;gap:10px;">
    <a href="{{ route('admin.users.export', request()->only(['q','plan','verified'])) }}" class="btn btn-ghost">
      ↓ Export CSV
    </a>
    <a href="{{ route('admin.users.create') }}" class="btn btn-primary">+ New user</a>
  </div>
</div>

<!-- SEARCH & FILTER -->
<form method="GET" action="{{ route('admin.users') }}" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:flex-end;">
  <div style="flex:1;min-width:220px;">
    <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">Search</label>
    <input type="search" name="q" value="{{ request('q') }}" placeholder="Name or email…" style="width:100%;">
  </div>
  <div>
    <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">Plan</label>
    <select name="plan">
      <option value="">All plans</option>
      <option value="plus" {{ request('plan') === 'plus' ? 'selected' : '' }}>Plus</option>
      <option value="free" {{ request('plan') === 'free' ? 'selected' : '' }}>Free</option>
    </select>
  </div>
  <div>
    <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">Verified</label>
    <select name="verified">
      <option value="">All</option>
      <option value="yes" {{ request('verified') === 'yes' ? 'selected' : '' }}>Verified</option>
      <option value="no"  {{ request('verified') === 'no'  ? 'selected' : '' }}>Unverified</option>
    </select>
  </div>
  <div style="display:flex;gap:8px;">
    <button type="submit" class="btn btn-primary">Filter</button>
    @if(request('q') || request('plan') || request('verified'))
      <a href="{{ route('admin.users') }}" class="btn btn-ghost">Clear</a>
    @endif
  </div>
</form>

<!-- USERS TABLE -->
<div class="admin-card">
  <div class="admin-table-wrap">
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Email</th>
          <th>Verified</th>
          <th>Plan</th>
          <th>Check-ins</th>
          <th>Joined</th>
          <th style="text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        @foreach($users as $row)
          @php $u = $row['user']; @endphp
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="avatar-sq">
                  {{ strtoupper(substr($u->name, 0, 1)) }}
                </div>
                <div>
                  <div style="font-weight:600;font-size:13px;">{{ $u->name }}</div>
                  @if($u->is_admin)<span class="pill pill-admin" style="margin-top:2px;">Admin</span>@endif
                </div>
              </div>
            </td>
            <td style="color:var(--text-muted);font-size:13px;">{{ $u->email }}</td>
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
            <td style="color:var(--text-muted);font-size:13px;">{{ $row['checkinCount'] }}</td>
            <td style="color:var(--text-muted);font-size:12.5px;white-space:nowrap;">{{ $u->created_at->format('M j, Y') }}</td>
            <td style="text-align:right;">
              <a href="{{ route('admin.user-detail', $u) }}" class="btn btn-ghost btn-sm">Manage →</a>
            </td>
          </tr>
        @endforeach
        @if($users->isEmpty())
          <tr>
            <td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">
              No users found{{ request('q') ? ' for "' . request('q') . '"' : '' }}.
            </td>
          </tr>
        @endif
      </tbody>
    </table>
  </div>
</div>

<!-- PAGINATION -->
@if($users->hasPages())
  <div class="pagination">
    @if($users->onFirstPage())
      <span class="disabled">‹</span>
    @else
      <a href="{{ $users->previousPageUrl() }}">‹</a>
    @endif

    @foreach($users->getUrlRange(max(1, $users->currentPage() - 2), min($users->lastPage(), $users->currentPage() + 2)) as $page => $url)
      @if($page == $users->currentPage())
        <span class="active">{{ $page }}</span>
      @else
        <a href="{{ $url }}">{{ $page }}</a>
      @endif
    @endforeach

    @if($users->hasMorePages())
      <a href="{{ $users->nextPageUrl() }}">›</a>
    @else
      <span class="disabled">›</span>
    @endif
  </div>
  <div style="font-size:12.5px;color:var(--text-muted);margin-top:8px;">
    Showing {{ $users->firstItem() }}–{{ $users->lastItem() }} of {{ $users->total() }} users
  </div>
@endif
@endsection
