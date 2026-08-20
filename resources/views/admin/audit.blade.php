@extends('admin.layout')
@section('title', 'Audit log')

@section('content')
<div class="page-header">
  <div>
    <h1>Audit log</h1>
    <p>A permanent record of sensitive admin actions   who did what, and when.</p>
  </div>
</div>

{{-- Filters --}}
<div class="admin-card" style="margin-bottom:20px;">
  <form method="GET" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;padding:18px;">
    <div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Action</label>
      <select name="action" style="min-width:190px;">
        <option value="">All actions</option>
        @foreach ($actions as $action)
          <option value="{{ $action }}" @selected(request('action') === $action)>{{ $action }}</option>
        @endforeach
      </select>
    </div>
    <div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Admin</label>
      <select name="admin" style="min-width:180px;">
        <option value="">All admins</option>
        @foreach ($admins as $admin)
          <option value="{{ $admin->id }}" @selected(request('admin') == $admin->id)>{{ $admin->name }}</option>
        @endforeach
      </select>
    </div>
    <button type="submit" class="btn btn-primary">Filter</button>
    @if (request('action') || request('admin'))
      <a href="{{ route('admin.audit') }}" class="btn btn-ghost">Clear</a>
    @endif
  </form>
</div>

<div class="admin-card">
  <div class="admin-card-hd">
    <div>
      <h2>Activity</h2>
      <p>{{ $logs->total() }} recorded {{ Str::plural('action', $logs->total()) }}</p>
    </div>
  </div>
  <div class="admin-table-wrap">
    <table>
      <thead>
        <tr>
          <th>When</th>
          <th>Admin</th>
          <th>Action</th>
          <th>Target</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        @forelse ($logs as $log)
          <tr>
            <td style="font-size:12.5px;color:var(--text-muted);white-space:nowrap;">
              {{ $log->created_at->format('M j, Y H:i') }}
              <div style="font-size:11.5px;color:var(--text-dim);">{{ $log->created_at->diffForHumans() }}</div>
            </td>
            <td style="font-size:13px;">
              {{ $log->admin?->name ?? '(deleted admin)' }}
              <div style="font-size:11.5px;color:var(--text-muted);">{{ $log->admin_email }}</div>
            </td>
            <td>
              @php
                $destructive = in_array($log->action, ['user.delete', 'user.set-password', 'user.toggle-admin', 'medication.delete'], true);
              @endphp
              <span class="pill {{ $destructive ? 'pill-unverified' : 'pill-free' }}" style="font-family:ui-monospace,monospace;font-size:11.5px;">
                {{ $log->action }}
              </span>
            </td>
            <td style="font-size:13px;">
              {{ $log->target_label ?? '' }}
              @if ($log->target_type)
                <div style="font-size:11.5px;color:var(--text-dim);">{{ $log->target_type }} #{{ $log->target_id }}</div>
              @endif
            </td>
            <td style="font-size:12px;color:var(--text-muted);max-width:280px;">
              @if ($log->meta)
                <code style="font-size:11.5px;word-break:break-word;">{{ Str::limit(json_encode($log->meta), 120) }}</code>
              @else
                <span style="color:var(--text-dim);"></span>
              @endif
            </td>
          </tr>
        @empty
          <tr>
            <td colspan="5" style="text-align:center;padding:38px;color:var(--text-muted);">
              No admin actions recorded yet.
            </td>
          </tr>
        @endforelse
      </tbody>
    </table>
  </div>
</div>

@if ($logs->hasPages())
  <div class="pagination">
    @if ($logs->onFirstPage())
      <span class="disabled">‹</span>
    @else
      <a href="{{ $logs->previousPageUrl() }}">‹</a>
    @endif
    @foreach ($logs->getUrlRange(max(1, $logs->currentPage() - 2), min($logs->lastPage(), $logs->currentPage() + 2)) as $page => $url)
      @if ($page == $logs->currentPage())
        <span class="active">{{ $page }}</span>
      @else
        <a href="{{ $url }}">{{ $page }}</a>
      @endif
    @endforeach
    @if ($logs->hasMorePages())
      <a href="{{ $logs->nextPageUrl() }}">›</a>
    @else
      <span class="disabled">›</span>
    @endif
  </div>
@endif
@endsection
