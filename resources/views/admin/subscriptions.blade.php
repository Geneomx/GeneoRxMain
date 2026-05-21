@extends('admin.layout')
@section('title', 'Subscriptions')

@section('content')
<div class="page-header">
  <div>
    <h1>Subscriptions</h1>
    <p>All active Plus subscribers and admin overrides.</p>
  </div>
</div>

{{-- Stat strip --}}
<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);">
  <div class="stat-card">
    <div class="stat-label">Total Plus</div>
    <div class="stat-value teal">{{ number_format($stats['total_plus']) }}</div>
    <div class="stat-sub">Active &amp; trialing</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Stripe active</div>
    <div class="stat-value">{{ number_format($stats['stripe_active']) }}</div>
    <div class="stat-sub">Paid via Stripe</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Admin overrides</div>
    <div class="stat-value">{{ number_format($stats['admin_overrides']) }}</div>
    <div class="stat-sub">Manually granted</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Expiring ≤ 30 days</div>
    <div class="stat-value {{ $stats['expiring_soon'] > 0 ? 'teal' : '' }}">{{ number_format($stats['expiring_soon']) }}</div>
    <div class="stat-sub">Override renewals needed</div>
  </div>
</div>

{{-- Expiring soon banner --}}
@if($expiringOverrides->isNotEmpty())
<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:13.5px;color:#92400E;">
  <strong>⚠ Overrides expiring soon:</strong>
  @foreach($expiringOverrides as $sub)
    <span style="margin-left:10px;">{{ $sub->user?->name ?? '—' }} ({{ $sub->admin_override_ends_at->format('M j') }})</span>@if(!$loop->last),@endif
  @endforeach
</div>
@endif

{{-- Active subscriptions table --}}
<div class="admin-card">
  <div class="admin-card-hd">
    <div>
      <h2>Active subscribers</h2>
      <p>{{ $active->total() }} total</p>
    </div>
  </div>
  <div class="admin-table-wrap">
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Plan</th>
          <th>Status</th>
          <th>Provider</th>
          <th>Override ends</th>
          <th>Period ends</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @foreach($active as $sub)
          @php $u = $sub->user; @endphp
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="avatar-sq">{{ $u ? strtoupper(substr($u->name,0,1)) : '?' }}</div>
                <div>
                  <div style="font-weight:600;font-size:13px;">{{ $u?->name ?? '(deleted)' }}</div>
                  <div style="font-size:12px;color:var(--text-muted);">{{ $u?->email }}</div>
                </div>
              </div>
            </td>
            <td><span class="pill pill-plus">{{ ucfirst($sub->plan ?? 'plus') }}</span></td>
            <td>
              <span class="pill {{ $sub->status === 'active' ? 'pill-verified' : 'pill-unverified' }}">
                {{ ucfirst($sub->status ?? '—') }}
              </span>
            </td>
            <td style="color:var(--text-muted);font-size:12.5px;">
              {{ $sub->provider ?? ($sub->stripe_id ? 'Stripe' : 'Admin') }}
            </td>
            <td style="font-size:13px;">
              @if($sub->admin_override_ends_at)
                @if($sub->admin_override_ends_at->isPast())
                  <span style="color:#B91C1C;">Expired {{ $sub->admin_override_ends_at->format('M j, Y') }}</span>
                @elseif($sub->admin_override_ends_at->lte(now()->addDays(30)))
                  <span style="color:#92400E;">{{ $sub->admin_override_ends_at->format('M j, Y') }}</span>
                @else
                  <span style="color:var(--teal);">{{ $sub->admin_override_ends_at->format('M j, Y') }}</span>
                @endif
              @else
                <span style="color:var(--text-dim);">—</span>
              @endif
            </td>
            <td style="color:var(--text-muted);font-size:13px;">
              {{ $sub->current_period_ends_at?->format('M j, Y') ?? '—' }}
            </td>
            <td>
              @if($u)
                <a href="{{ route('admin.user-detail', $u) }}" class="btn btn-ghost btn-sm">Manage →</a>
              @endif
            </td>
          </tr>
        @endforeach
        @if($active->isEmpty())
          <tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">No active subscribers.</td></tr>
        @endif
      </tbody>
    </table>
  </div>
</div>

{{-- Pagination --}}
@if($active->hasPages())
  <div class="pagination">
    @if($active->onFirstPage())
      <span class="disabled">‹</span>
    @else
      <a href="{{ $active->previousPageUrl() }}">‹</a>
    @endif
    @foreach($active->getUrlRange(max(1,$active->currentPage()-2), min($active->lastPage(),$active->currentPage()+2)) as $page => $url)
      @if($page == $active->currentPage())
        <span class="active">{{ $page }}</span>
      @else
        <a href="{{ $url }}">{{ $page }}</a>
      @endif
    @endforeach
    @if($active->hasMorePages())
      <a href="{{ $active->nextPageUrl() }}">›</a>
    @else
      <span class="disabled">›</span>
    @endif
  </div>
@endif
@endsection
