@extends('admin.layout')
@section('title', 'Analytics')

@section('content')
<style>
  .an-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .an-stat {
    background: var(--bg); border: 1px solid var(--border-soft);
    border-radius: 12px; padding: 18px 20px;
  }
  .an-stat-label { font-size: 12px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
  .an-stat-value { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
  .an-stat-sub { font-size: 12.5px; color: var(--text-dim); margin-top: 4px; }

  .an-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }

  .an-card {
    background: var(--bg); border: 1px solid var(--border-soft);
    border-radius: 12px; overflow: hidden;
  }
  .an-card-head {
    padding: 16px 20px 14px;
    border-bottom: 1px solid var(--border-soft);
    display: flex; align-items: center; justify-content: space-between;
  }
  .an-card-title { font-size: 14px; font-weight: 700; color: var(--text); }
  .an-card-sub { font-size: 12.5px; color: var(--text-muted); }

  /* Daily chart bars */
  .chart-wrap { padding: 20px; }
  .chart-bars {
    display: flex; align-items: flex-end; gap: 4px;
    height: 100px; overflow-x: auto;
  }
  .chart-bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 22px; }
  .chart-bar {
    width: 100%; background: var(--teal-100); border-radius: 4px 4px 0 0;
    transition: background 0.2s;
    position: relative;
  }
  .chart-bar:hover { background: var(--teal); }
  .chart-bar-label { font-size: 9px; color: var(--text-dim); transform: rotate(-45deg); white-space: nowrap; }

  /* Top events table */
  .an-table { width: 100%; border-collapse: collapse; }
  .an-table th {
    text-align: left; font-size: 11.5px; font-weight: 700;
    color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px;
    padding: 12px 16px 10px; background: var(--bg-soft);
    border-bottom: 1px solid var(--border-soft);
  }
  .an-table td { padding: 11px 16px; font-size: 14px; border-bottom: 1px solid var(--border-soft); }
  .an-table tr:last-child td { border-bottom: none; }
  .an-table tr:hover td { background: var(--bg-soft); }

  /* Bar fill in table */
  .bar-wrap { display: flex; align-items: center; gap: 10px; }
  .bar-fill { height: 8px; background: var(--teal-100); border-radius: 4px; min-width: 4px; }
  .bar-count { font-size: 12.5px; font-weight: 600; color: var(--text-muted); white-space: nowrap; }

  /* Recent events */
  .event-row { display: flex; align-items: baseline; gap: 10px; padding: 10px 20px; border-bottom: 1px solid var(--border-soft); }
  .event-row:last-child { border-bottom: none; }
  .event-name { font-size: 14px; font-weight: 600; color: var(--text); flex: 1; }
  .event-user { font-size: 12.5px; color: var(--text-muted); }
  .event-time { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
  .event-props { font-size: 11.5px; color: var(--text-dim); font-family: monospace; }

  @media (max-width: 800px) {
    .an-stats { grid-template-columns: 1fr 1fr; }
    .an-grid { grid-template-columns: 1fr; }
  }
</style>

<div class="page-head">
  <div>
    <h1>Analytics</h1>
    <p class="sub">Event tracking   last 30 days</p>
  </div>
</div>

{{-- ── Stat strip ──────────────────────────────────────────────────── --}}
<div class="an-stats">
  <div class="an-stat">
    <div class="an-stat-label">Total events</div>
    <div class="an-stat-value">{{ number_format($totalEvents) }}</div>
    <div class="an-stat-sub">All time</div>
  </div>
  <div class="an-stat">
    <div class="an-stat-label">Events this week</div>
    <div class="an-stat-value">{{ number_format($eventsWeek) }}</div>
    <div class="an-stat-sub">Last 7 days</div>
  </div>
  <div class="an-stat">
    <div class="an-stat-label">Unique users</div>
    <div class="an-stat-value">{{ number_format($uniqueUsers30d) }}</div>
    <div class="an-stat-sub">Last 30 days</div>
  </div>
  <div class="an-stat">
    <div class="an-stat-label">Event types</div>
    <div class="an-stat-value">{{ $topEvents->count() }}</div>
    <div class="an-stat-sub">Distinct names</div>
  </div>
</div>

{{-- ── Charts & top events ─────────────────────────────────────────── --}}
<div class="an-grid">

  {{-- Daily event chart --}}
  <div class="an-card">
    <div class="an-card-head">
      <div class="an-card-title">Daily events</div>
      <div class="an-card-sub">Last 30 days</div>
    </div>
    <div class="chart-wrap">
      @php
        $maxCount = $dailyCounts->max('count') ?: 1;
      @endphp
      @if ($dailyCounts->isEmpty())
        <p style="font-size:13.5px;color:var(--text-muted);text-align:center;padding:20px 0;">No events in the last 30 days.</p>
      @else
        <div class="chart-bars">
          @foreach ($dailyCounts as $day)
            @php $pct = round(($day->count / $maxCount) * 100); @endphp
            <div class="chart-bar-col" title="{{ $day->date }}: {{ $day->count }} events">
              <div class="chart-bar" style="height: {{ max($pct, 4) }}%;"></div>
              <div class="chart-bar-label">{{ \Illuminate\Support\Carbon::parse($day->date)->format('M d') }}</div>
            </div>
          @endforeach
        </div>
      @endif
    </div>
  </div>

  {{-- Top events table --}}
  <div class="an-card">
    <div class="an-card-head">
      <div class="an-card-title">Top events</div>
      <div class="an-card-sub">By total count</div>
    </div>
    @if ($topEvents->isEmpty())
      <p style="padding:20px;font-size:13.5px;color:var(--text-muted);">No events tracked yet.</p>
    @else
      @php $topMax = $topEvents->first()->count ?: 1; @endphp
      <table class="an-table">
        <thead>
          <tr>
            <th>Event</th>
            <th style="width:160px;">Count</th>
          </tr>
        </thead>
        <tbody>
          @foreach ($topEvents as $ev)
            <tr>
              <td><code style="font-size:13px;">{{ $ev->name }}</code></td>
              <td>
                <div class="bar-wrap">
                  <div class="bar-fill" style="width: {{ round(($ev->count / $topMax) * 120) }}px;"></div>
                  <span class="bar-count">{{ number_format($ev->count) }}</span>
                </div>
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    @endif
  </div>
</div>

{{-- ── Recent events ───────────────────────────────────────────────── --}}
<div class="an-card" style="margin-bottom:0;">
  <div class="an-card-head">
    <div class="an-card-title">Recent events</div>
    <div class="an-card-sub">Latest 50</div>
  </div>
  @if ($recentEvents->isEmpty())
    <p style="padding:20px;font-size:13.5px;color:var(--text-muted);">No events tracked yet.</p>
  @else
    @foreach ($recentEvents as $event)
      <div class="event-row">
        <div class="event-name">{{ $event->name }}</div>
        <div class="event-user">
          {{ $event->user?->name ?? 'Guest' }}
          @if ($event->user?->email)
            <span style="color:var(--text-dim);">· {{ $event->user->email }}</span>
          @endif
        </div>
        @if ($event->properties)
          <div class="event-props">{{ Str::limit(json_encode($event->properties), 60) }}</div>
        @endif
        <div class="event-time">{{ $event->created_at->diffForHumans() }}</div>
      </div>
    @endforeach
  @endif
</div>
@endsection
