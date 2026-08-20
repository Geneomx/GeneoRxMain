@extends('admin.layout')
@section('title', 'Feedback')

@section('content')
<div class="page-header">
  <div>
    <h1>Feedback</h1>
    <p>What users are telling us, from the app and the website.</p>
  </div>
</div>

{{-- Status strip --}}
<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
  <div class="stat-card">
    <div class="stat-label">New</div>
    <div class="stat-value {{ $counts['new'] > 0 ? 'teal' : '' }}">{{ number_format($counts['new']) }}</div>
    <div class="stat-sub">Awaiting review</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Reviewed</div>
    <div class="stat-value">{{ number_format($counts['reviewed']) }}</div>
    <div class="stat-sub">Seen, not yet closed</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Resolved</div>
    <div class="stat-value">{{ number_format($counts['resolved']) }}</div>
    <div class="stat-sub">Closed out</div>
  </div>
</div>

{{-- Filters --}}
<div class="admin-card" style="margin-bottom:20px;">
  <form method="GET" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;padding:18px;">
    <div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Status</label>
      <select name="status" style="min-width:150px;">
        <option value="">All statuses</option>
        @foreach (['new' => 'New', 'reviewed' => 'Reviewed', 'resolved' => 'Resolved'] as $val => $label)
          <option value="{{ $val }}" @selected(request('status') === $val)>{{ $label }}</option>
        @endforeach
      </select>
    </div>
    <div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Type</label>
      <select name="type" style="min-width:150px;">
        <option value="">All types</option>
        @foreach (['bug' => 'Bug', 'suggestion' => 'Suggestion', 'question' => 'Question', 'other' => 'Other'] as $val => $label)
          <option value="{{ $val }}" @selected(request('type') === $val)>{{ $label }}</option>
        @endforeach
      </select>
    </div>
    <button type="submit" class="btn btn-primary">Filter</button>
    @if (request('status') || request('type'))
      <a href="{{ route('admin.feedback') }}" class="btn btn-ghost">Clear</a>
    @endif
  </form>
</div>

{{-- List --}}
<div class="admin-card">
  <div class="admin-card-hd">
    <div>
      <h2>Messages</h2>
      <p>{{ $items->total() }} total</p>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;">
    @forelse ($items as $item)
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap;">
              <span class="pill {{ $item->type === 'bug' ? 'pill-unverified' : 'pill-plus' }}">{{ ucfirst($item->type) }}</span>
              <span class="pill {{ $item->status === 'new' ? 'pill-admin' : ($item->status === 'resolved' ? 'pill-verified' : 'pill-free') }}">
                {{ ucfirst($item->status) }}
              </span>
              <span style="font-size:12px;color:var(--text-muted);">{{ ucfirst($item->source) }}</span>
              <span style="font-size:12px;color:var(--text-dim);">· {{ $item->created_at->diffForHumans() }}</span>
            </div>

            <div style="font-size:14px;line-height:21px;color:var(--text);white-space:pre-wrap;margin-bottom:8px;">{{ $item->message }}</div>

            <div style="font-size:12.5px;color:var(--text-muted);">
              @if ($item->user)
                <a href="{{ route('admin.user-detail', $item->user) }}" style="color:var(--teal);">{{ $item->user->name }}</a>
                ({{ $item->user->email }})
              @else
                Guest{{ $item->contact_email ? ' · '.$item->contact_email : '' }}
              @endif
              @if ($item->can_contact)
                <span class="pill pill-verified" style="margin-left:6px;">OK to contact</span>
              @endif
            </div>
          </div>

          <form method="POST" action="{{ route('admin.feedback.status', $item) }}" style="display:flex;gap:6px;align-items:center;">
            @csrf
            <select name="status" style="min-width:120px;">
              @foreach (['new' => 'New', 'reviewed' => 'Reviewed', 'resolved' => 'Resolved'] as $val => $label)
                <option value="{{ $val }}" @selected($item->status === $val)>{{ $label }}</option>
              @endforeach
            </select>
            <button type="submit" class="btn btn-ghost btn-sm">Save</button>
          </form>
        </div>
      </div>
    @empty
      <div style="text-align:center;padding:44px;color:var(--text-muted);">
        No feedback yet.
      </div>
    @endforelse
  </div>
</div>

@if ($items->hasPages())
  <div class="pagination">
    @if ($items->onFirstPage())
      <span class="disabled">‹</span>
    @else
      <a href="{{ $items->previousPageUrl() }}">‹</a>
    @endif
    @foreach ($items->getUrlRange(max(1, $items->currentPage() - 2), min($items->lastPage(), $items->currentPage() + 2)) as $page => $url)
      @if ($page == $items->currentPage())
        <span class="active">{{ $page }}</span>
      @else
        <a href="{{ $url }}">{{ $page }}</a>
      @endif
    @endforeach
    @if ($items->hasMorePages())
      <a href="{{ $items->nextPageUrl() }}">›</a>
    @else
      <span class="disabled">›</span>
    @endif
  </div>
@endif
@endsection
