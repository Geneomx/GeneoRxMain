@extends('clinic.layout')
@section('title', 'Conversation')

@section('styles')
  /* The flex item is the wrapper, not the bubble: aligning the bubble itself
     does nothing inside a block-level parent, and putting the bubble's own
     class on the name line drew its background across the full width. */
  .chat{display:flex;flex-direction:column;gap:12px;padding:18px}
  .turn{display:flex;flex-direction:column;max-width:min(78%,560px)}
  .turn--patient{align-self:flex-start}
  .turn--doctor{align-self:flex-end;align-items:flex-end}
  .bubble{padding:11px 14px;border-radius:14px;font-size:14.5px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;
    background:var(--bg-muted);border:1px solid var(--border);border-bottom-left-radius:5px}
  .turn--doctor .bubble{background:var(--teal-50);border-color:var(--teal-100);
    border-bottom-left-radius:14px;border-bottom-right-radius:5px}
  .turn-meta{font-size:11.5px;color:var(--text-dim);margin-top:5px}
  .sum-grid{display:flex;gap:26px;flex-wrap:wrap;margin-bottom:12px}
  .sum-grid span{display:block;font-size:12px}
  .sum-grid b{font-size:17px;font-weight:800}
  .sum-flags{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  .sum-line{display:flex;gap:14px;padding:7px 0;border-top:1px solid var(--border-soft);font-size:14.5px}
  .sum-line .muted{flex:0 0 120px}
  .sum-ratings{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .sum-rating{font-size:13px;color:var(--text-muted);border:1px solid var(--border);
    border-radius:999px;padding:5px 11px}
  .sum-rating b{color:var(--text);margin-left:5px}
@endsection

@section('content')
<div class="page-head">
  <div class="stack" style="justify-content:space-between;">
    <div>
      <h1>{{ $thread->user?->name ?? 'Deleted account' }}</h1>
      <p>
        Asked {{ $thread->created_at->diffForHumans() }}
        @if ($thread->contact_mobile)
          &middot; <span style="font-family:ui-monospace,monospace;">{{ $thread->contact_mobile }}</span>
          <span class="muted">(the patient gave this number for your reply)</span>
        @endif
      </p>
    </div>
    <a href="{{ route('clinic.messages') }}" class="btn btn-ghost btn-sm">All messages</a>
  </div>
</div>

@if ($summary)
  {{-- Only here because this patient chose to share it, and only while they
       still do. Everything in it is their own record, not a diagnosis. --}}
  <div class="card">
    <div class="card-hd">
      <h2>Health summary</h2>
      <p>Shared with you by {{ $summary['patient'] }} &mdash; self-reported, not a clinical record</p>
    </div>
    <div class="row">
      <div class="sum-grid">
        <div><span class="muted">Age</span><b>{{ $summary['age'] ?? '—' }}</b></div>
        <div><span class="muted">Gender</span><b>{{ $summary['gender'] ?? '—' }}</b></div>
        <div><span class="muted">Check-ins</span><b>{{ $summary['checkins_total'] }}</b></div>
      </div>

      @if (count($summary['flags']))
        <div class="sum-flags">
          @foreach ($summary['flags'] as $flag)
            <span class="badge badge-warn">{{ $flag }}</span>
          @endforeach
        </div>
      @endif

      <div class="sum-line">
        <span class="muted">Medicines</span>
        <span>{{ count($summary['medications']) ? implode(', ', $summary['medications']) : 'None recorded' }}</span>
      </div>
      <div class="sum-line">
        <span class="muted">Symptoms</span>
        <span>{{ count($summary['symptoms']) ? implode(', ', $summary['symptoms']) : 'None recorded' }}</span>
      </div>

      @if ($summary['latest_checkin'])
        @php $c = $summary['latest_checkin']; @endphp
        <div class="sum-line">
          <span class="muted">Last check-in</span>
          <span>
            {{ $c['date'] ?? '—' }}
            @if ($c['adherence'] !== null) &middot; took {{ $c['adherence'] }}% of their medicine @endif
          </span>
        </div>
        <div class="sum-ratings">
          @foreach ($c['ratings'] as $key => $value)
            <span class="sum-rating">
              {{ ucfirst($key) }}
              {{-- A skipped rating shows a dash. Never a zero: a zero reads as
                   "terrible" rather than "not answered". --}}
              <b>{{ $value === null ? '—' : $value.'/10' }}</b>
            </span>
          @endforeach
        </div>
        @if (count($c['side_effects']))
          <div class="sum-line"><span class="muted">Side effects</span><span>{{ implode(', ', $c['side_effects']) }}</span></div>
        @endif
        @if ($c['notes'])
          <div class="sum-line"><span class="muted">Their notes</span><span>{{ $c['notes'] }}</span></div>
        @endif
      @else
        <div class="sum-line"><span class="muted">Last check-in</span><span>None yet</span></div>
      @endif
    </div>
  </div>
@endif

<div class="card">
  <div class="chat">
    @foreach ($transcript as $turn)
      <div class="turn turn--{{ $turn->fromDoctor() ? 'doctor' : 'patient' }}">
        <div class="bubble">{{ $turn->body }}</div>
        <div class="turn-meta">
          {{ $turn->fromDoctor() ? $doctor->name : ($thread->user?->name ?? 'Patient') }}
          &middot; {{ $turn->created_at?->diffForHumans() }}
        </div>
      </div>
    @endforeach
  </div>

  @if ($thread->status === 'closed')
    <div class="row" style="border-top:1px solid var(--border-soft);">
      <div class="muted">This conversation is closed. The patient can start a new one at any time.</div>
    </div>
  @else
    <div class="row" style="border-top:1px solid var(--border-soft);">
      <form method="POST" action="{{ route('clinic.thread.reply', $thread) }}">
        @csrf
        <label for="reply">Your reply &mdash; the patient sees this as coming from you</label>
        <textarea id="reply" name="body" required maxlength="4000"
                  placeholder="Answer the question. For anything urgent, tell them to contact their own doctor or emergency services."></textarea>
        <div class="stack" style="margin-top:10px;justify-content:space-between;">
          <button type="submit" class="btn btn-primary">Send reply</button>
        </div>
      </form>

      <form method="POST" action="{{ route('clinic.thread.close', $thread) }}" style="margin-top:12px;">
        @csrf
        <button type="submit" class="btn btn-ghost btn-sm">Close this conversation</button>
        <span class="muted" style="margin-left:8px;">Use this once the question is settled.</span>
      </form>
    </div>
  @endif
</div>
@endsection
