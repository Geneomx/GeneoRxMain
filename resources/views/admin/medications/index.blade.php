@extends('admin.layout')
@section('title', 'Medications')

@section('content')
<div class="page-header">
  <div>
    <h1>Medications</h1>
    <p>{{ $medications->total() }} {{ Str::plural('medication', $medications->total()) }} in the catalog.</p>
  </div>
  <a href="{{ route('admin.medications.create') }}" class="btn btn-primary">+ Add medication with evidence</a>
</div>

{{-- SEARCH / FILTER --}}
<form method="GET" action="{{ route('admin.medications') }}"
      style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:flex-end;">
  <div style="flex:1;min-width:220px;">
    <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">Search</label>
    <input type="search" name="q" value="{{ request('q') }}" placeholder="Name or slug…" style="width:100%;">
  </div>
  <div>
    <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">Status</label>
    <select name="status">
      <option value="">All</option>
      <option value="active"   {{ request('status') === 'active'   ? 'selected' : '' }}>Active</option>
      <option value="inactive" {{ request('status') === 'inactive' ? 'selected' : '' }}>Inactive</option>
    </select>
  </div>
  <div style="display:flex;gap:8px;">
    <button type="submit" class="btn btn-primary">Filter</button>
    @if(request('q') || request('status'))
      <a href="{{ route('admin.medications') }}" class="btn btn-ghost">Clear</a>
    @endif
  </div>
</form>

{{-- TABLE --}}
<div class="admin-card">
  <div class="admin-table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:32px;">#</th>
          <th>Name</th>
          <th>Slug (ID)</th>
          <th>Claims</th>
          <th>Symptoms</th>
          <th>Status</th>
          <th style="text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        @foreach($medications as $med)
          <tr style="{{ $med->is_active ? '' : 'opacity:.55;' }}">
            <td style="color:var(--text-muted);font-size:12px;">{{ $med->sort_order ?: $med->id }}</td>
            <td>
              <div style="font-weight:600;font-size:13px;">{{ $med->name }}</div>
              @if($med->description)
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">{{ Str::limit($med->description, 60) }}</div>
              @endif
            </td>
            <td style="font-family:monospace;font-size:12px;color:var(--text-muted);">{{ $med->slug }}</td>
            <td style="font-size:12.5px;">
              @php
                $claims = $med->claims ?? [];
                $totalCitations = collect($claims)->sum(fn ($c) => count($c['citations'] ?? []));
              @endphp
              @if(count($claims))
                @foreach(array_slice($claims, 0, 3) as $cl)
                  @php
                    $q = $cl['source_quality'] ?? 'Moderate';
                    $qBg = $q === 'High' ? '#F0FDF4' : ($q === 'Low' ? 'var(--bg-muted)' : '#FFFBEB');
                    $qColor = $q === 'High' ? '#166534' : ($q === 'Low' ? 'var(--text-muted)' : '#92400E');
                    $citeN = count($cl['citations'] ?? []);
                  @endphp
                  <span style="display:inline-flex;align-items:center;gap:4px;background:{{ $qBg }};color:{{ $qColor }};border-radius:999px;padding:2px 9px;font-size:11.5px;font-weight:600;margin:2px 2px 2px 0;">
                    {{ $cl['nutrient'] ?? '—' }}
                    @if($citeN)
                      <span style="opacity:.75;font-weight:500;">{{ $citeN }} {{ Str::plural('cite', $citeN) }}</span>
                    @endif
                  </span>
                @endforeach
                @if(count($claims) > 3)
                  <span style="font-size:11px;color:var(--text-muted);">+{{ count($claims) - 3 }} more</span>
                @endif
                @if($totalCitations)
                  <div style="font-size:11px;color:var(--text-dim);margin-top:3px;">{{ $totalCitations }} total {{ Str::plural('citation', $totalCitations) }}</div>
                @endif
              @else
                <span style="color:var(--text-muted);font-size:12px;">No evidence</span>
              @endif
            </td>
            <td style="font-size:12px;color:var(--text-muted);">
              {{ count($med->symptom_chips ?? []) }} chips
            </td>
            <td>
              @if($med->is_active)
                <span class="pill pill-verified">Active</span>
              @else
                <span class="pill pill-unverified">Inactive</span>
              @endif
            </td>
            <td style="text-align:right;">
              <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;">
                <a href="{{ route('admin.medications.edit', $med) }}" class="btn btn-ghost btn-sm">Edit</a>

                <form method="POST" action="{{ route('admin.medications.toggle', $med) }}">
                  @csrf
                  <button class="btn btn-ghost btn-sm" type="submit">
                    {{ $med->is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                </form>

                <form method="POST" action="{{ route('admin.medications.destroy', $med) }}"
                      onsubmit="return confirm('Delete {{ addslashes($med->name) }}? This cannot be undone.')">
                  @csrf @method('DELETE')
                  <button class="btn btn-danger btn-sm" type="submit">Delete</button>
                </form>
              </div>
            </td>
          </tr>
        @endforeach
        @if($medications->isEmpty())
          <tr>
            <td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">
              No medications found. <a href="{{ route('admin.medications.create') }}" style="color:var(--teal);">Add the first one.</a>
            </td>
          </tr>
        @endif
      </tbody>
    </table>
  </div>
</div>

{{-- PAGINATION --}}
@if($medications->hasPages())
  <div class="pagination">
    @if($medications->onFirstPage())
      <span class="disabled">‹</span>
    @else
      <a href="{{ $medications->previousPageUrl() }}">‹</a>
    @endif
    @foreach($medications->getUrlRange(max(1, $medications->currentPage()-2), min($medications->lastPage(), $medications->currentPage()+2)) as $page => $url)
      @if($page == $medications->currentPage())
        <span class="active">{{ $page }}</span>
      @else
        <a href="{{ $url }}">{{ $page }}</a>
      @endif
    @endforeach
    @if($medications->hasMorePages())
      <a href="{{ $medications->nextPageUrl() }}">›</a>
    @else
      <span class="disabled">›</span>
    @endif
  </div>
  <div style="font-size:12.5px;color:var(--text-muted);margin-top:8px;">
    Showing {{ $medications->firstItem() }}–{{ $medications->lastItem() }} of {{ $medications->total() }}
  </div>
@endif
@endsection
