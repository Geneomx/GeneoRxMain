@extends('admin.layout')
@section('title', 'Consults')

@section('content')
<div class="page-header">
  <div>
    <h1>Consults</h1>
    <p>Questions waiting for a doctor&rsquo;s answer, and appointment requests waiting for a date.</p>
  </div>
</div>

<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
  <div class="stat-card">
    <div class="stat-label">Unanswered questions</div>
    <div class="stat-value {{ $counts['new'] > 0 ? 'teal' : '' }}">{{ number_format($counts['new']) }}</div>
    <div class="stat-sub">Patients are waiting</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Answered</div>
    <div class="stat-value">{{ number_format($counts['answered']) }}</div>
    <div class="stat-sub">Reply is visible in the app</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Open appointment requests</div>
    <div class="stat-value {{ $counts['requested'] > 0 ? 'teal' : '' }}">{{ number_format($counts['requested']) }}</div>
    <div class="stat-sub">No date agreed yet</div>
  </div>
</div>

@if ($doctors->isEmpty())
  <div class="admin-card" style="margin-bottom:20px;border-color:var(--warning,#B5730B);">
    <div style="padding:18px 22px;font-size:14px;">
      <strong>No active doctors.</strong> You can still answer questions, but the reply will have no
      clinician name attached to it. <a href="{{ route('admin.doctors') }}">Add a doctor</a> first.
    </div>
  </div>
@endif

{{-- ── Questions ───────────────────────────────────────────────────────────── --}}
<div class="admin-card" style="margin-bottom:20px;">
  <div class="admin-card-hd">
    <div>
      <h2>Questions</h2>
      <p>{{ $messages->total() }} total</p>
    </div>
    <form method="GET" style="display:flex;gap:8px;align-items:center;">
      <select name="status" style="min-width:140px;">
        <option value="">All</option>
        @foreach (['new' => 'Unanswered', 'answered' => 'Answered', 'closed' => 'Closed'] as $v => $l)
          <option value="{{ $v }}" @selected(request('status') === $v)>{{ $l }}</option>
        @endforeach
      </select>
      <button type="submit" class="btn btn-primary">Filter</button>
    </form>
  </div>

  <div style="display:flex;flex-direction:column;">
    @forelse ($messages as $m)
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <strong style="font-size:14px;">#{{ $m->id }}</strong>
          @if ($m->status === 'new')
            <span class="badge badge-warning">Unanswered</span>
          @elseif ($m->status === 'answered')
            <span class="badge badge-success">Answered</span>
          @else
            <span class="badge">Closed</span>
          @endif
          <span style="font-size:13px;color:var(--text-muted);">
            @if ($m->user)
              <a href="{{ route('admin.user-detail', $m->user) }}">{{ $m->user->email }}</a>
            @else
              deleted account
            @endif
          </span>
          <span style="font-size:13px;color:var(--text-muted);">&middot; {{ $m->created_at->diffForHumans() }}</span>
          @if ($m->doctor)
            <span style="font-size:13px;color:var(--text-muted);">&middot; for {{ $m->doctor->name }}</span>
          @else
            <span style="font-size:13px;color:var(--text-muted);">&middot; any doctor</span>
          @endif
          @if ($m->contact_mobile)
            <span style="font-size:13px;font-family:ui-monospace,monospace;">&middot; {{ $m->contact_mobile }}</span>
          @endif
        </div>

        <div style="font-size:14px;line-height:1.6;margin-top:10px;max-width:80ch;white-space:pre-wrap;">{{ $m->body }}</div>

        @if ($m->isAnswered())
          <div style="margin-top:12px;padding:12px 14px;border-left:3px solid var(--teal,#0D9488);
                      background:rgba(13,148,136,.06);border-radius:8px;max-width:80ch;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">
              Replied {{ $m->replied_at?->diffForHumans() }}
              @if ($m->doctor) as {{ $m->doctor->name }} @endif
              @if ($m->repliedBy) &middot; typed by {{ $m->repliedBy->email }} @endif
            </div>
            <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">{{ $m->reply_body }}</div>
          </div>
        @endif

        @if ($m->status !== 'closed')
          <details style="margin-top:12px;" @if($m->status === 'new') open @endif>
            <summary style="cursor:pointer;font-size:13px;color:var(--text-muted);">
              {{ $m->isAnswered() ? 'Edit the reply' : 'Write a reply' }}
            </summary>
            <form method="POST" action="{{ route('admin.consults.reply', $m) }}" style="margin-top:10px;">
              @csrf
              <textarea name="reply_body" rows="3" required maxlength="4000"
                        placeholder="The patient sees this exactly as written."
                        style="width:100%;">{{ $m->reply_body }}</textarea>
              <div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap;">
                <select name="doctor_id" style="min-width:200px;">
                  <option value="">Attribute to&hellip;</option>
                  @foreach ($doctors as $d)
                    <option value="{{ $d->id }}" @selected($m->doctor_id === $d->id)>
                      {{ $d->name }}@if ($d->specialty) &middot; {{ $d->specialty }}@endif
                    </option>
                  @endforeach
                </select>
                <button type="submit" class="btn btn-primary">Send reply</button>
              </div>
            </form>
            <form method="POST" action="{{ route('admin.consults.close', $m) }}" style="margin-top:8px;">
              @csrf
              <button type="submit" class="btn btn-ghost">Close without replying</button>
            </form>
          </details>
        @endif
      </div>
    @empty
      <div style="padding:40px 22px;text-align:center;color:var(--text-muted);">
        No questions yet.
      </div>
    @endforelse
  </div>

  @if ($messages->hasPages())
    <div style="padding:18px 22px;">{{ $messages->links() }}</div>
  @endif
</div>

{{-- ── Appointment requests ────────────────────────────────────────────────── --}}
<div class="admin-card">
  <div class="admin-card-hd">
    <div>
      <h2>Appointment requests</h2>
      <p>{{ $appointments->total() }} total &mdash; these are requests, not bookings</p>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;">
    @forelse ($appointments as $a)
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <strong style="font-size:14px;">#{{ $a->id }}</strong>
          @if ($a->status === 'requested')
            <span class="badge badge-warning">Waiting</span>
          @elseif ($a->status === 'confirmed')
            <span class="badge badge-success">Confirmed</span>
          @elseif ($a->status === 'declined')
            <span class="badge badge-danger">Declined</span>
          @else
            <span class="badge">Done</span>
          @endif
          <span style="font-size:13px;color:var(--text-muted);">
            @if ($a->user)
              <a href="{{ route('admin.user-detail', $a->user) }}">{{ $a->user->email }}</a>
            @else
              deleted account
            @endif
          </span>
          @if ($a->contact_mobile)
            <span style="font-size:13px;font-family:ui-monospace,monospace;">&middot; {{ $a->contact_mobile }}</span>
          @endif
        </div>

        <div style="font-size:14px;margin-top:9px;">
          <strong>
            {{ $a->preferred_date ? $a->preferred_date->format('D j M Y') : 'No date given' }}
            @if ($a->preferred_time) &middot; {{ ucfirst($a->preferred_time) }} @endif
          </strong>
          <span style="color:var(--text-muted);">
            &middot; {{ $a->doctor?->name ?? 'any doctor' }}
            &middot; asked {{ $a->created_at->diffForHumans() }}
          </span>
        </div>

        @if ($a->note)
          <div style="font-size:14px;line-height:1.6;margin-top:8px;max-width:80ch;white-space:pre-wrap;">{{ $a->note }}</div>
        @endif

        @if ($a->admin_note)
          <div style="margin-top:10px;padding:10px 13px;border-left:3px solid var(--teal,#0D9488);
                      background:rgba(13,148,136,.06);border-radius:8px;max-width:80ch;font-size:14px;">
            {{ $a->admin_note }}
          </div>
        @endif

        <details style="margin-top:12px;" @if($a->isOpen()) open @endif>
          <summary style="cursor:pointer;font-size:13px;color:var(--text-muted);">Respond</summary>
          <form method="POST" action="{{ route('admin.consults.respond', $a) }}" style="margin-top:10px;">
            @csrf
            <textarea name="admin_note" rows="2" maxlength="2000"
                      placeholder="The patient sees this. If you are declining or moving the date, say so here."
                      style="width:100%;">{{ $a->admin_note }}</textarea>
            <div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap;">
              <select name="status" required style="min-width:150px;">
                <option value="confirmed">Confirm</option>
                <option value="declined">Decline</option>
                <option value="done">Mark done</option>
              </select>
              <select name="doctor_id" style="min-width:200px;">
                <option value="">Doctor&hellip;</option>
                @foreach ($doctors as $d)
                  <option value="{{ $d->id }}" @selected($a->doctor_id === $d->id)>{{ $d->name }}</option>
                @endforeach
              </select>
              <button type="submit" class="btn btn-primary">Save response</button>
            </div>
          </form>
        </details>
      </div>
    @empty
      <div style="padding:40px 22px;text-align:center;color:var(--text-muted);">
        No appointment requests yet.
      </div>
    @endforelse
  </div>

  @if ($appointments->hasPages())
    <div style="padding:18px 22px;">{{ $appointments->links() }}</div>
  @endif
</div>
@endsection
