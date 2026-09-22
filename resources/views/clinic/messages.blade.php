@extends('clinic.layout')
@section('title', 'Messages')

@section('content')
<div class="page-head">
  <h1>Your messages</h1>
  <p>Questions patients sent you, and the conversations that followed. Nothing here is urgent care &mdash; patients are told a reply can take a few days.</p>
</div>

<div class="card">
  <div class="card-hd">
    <h2>Conversations</h2>
    <p>{{ $threads->total() }} total &mdash; the ones waiting on you come first</p>
  </div>

  @forelse ($threads as $t)
    <a href="{{ route('clinic.thread', $t) }}" class="row" style="display:block;text-decoration:none;">
      <div class="stack" style="justify-content:space-between;">
        <strong style="font-size:15px;">{{ $t->user?->name ?? 'Deleted account' }}</strong>
        <span class="stack" style="gap:8px;">
          @if ($t->unread_count > 0)
            <span class="badge badge-danger">{{ $t->unread_count }} new</span>
          @endif
          @if ($t->status === 'new')
            <span class="badge badge-warn">Needs a reply</span>
          @elseif ($t->status === 'answered')
            <span class="badge badge-success">Answered</span>
          @else
            <span class="badge">Closed</span>
          @endif
        </span>
      </div>
      <div style="font-size:14px;line-height:1.5;margin-top:6px;color:var(--text-soft);max-width:75ch;">
        {{ Str::limit($t->latestLine(), 150) }}
      </div>
      <div class="muted" style="margin-top:5px;">{{ $t->updated_at->diffForHumans() }}</div>
    </a>
  @empty
    <div class="empty">No messages yet. Patients can write to you from the app or the website.</div>
  @endforelse

  @if ($threads->hasPages())
    <div style="padding:16px 18px;">{{ $threads->links() }}</div>
  @endif
</div>
@endsection
