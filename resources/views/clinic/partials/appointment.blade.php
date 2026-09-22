{{-- One appointment in the doctor's list. Expects $a. --}}
<div class="row">
  <div class="stack" style="justify-content:space-between;align-items:flex-start;">
    <div style="min-width:0;flex:1;">
      <div class="stack">
        <strong style="font-size:15px;">
          @if ($a->slotStart())
            {{ $a->slotStart()->format('D j M') }} &middot; {{ $a->slotStart()->format('H:i') }}&ndash;{{ $a->slotEnd()->format('H:i') }}
          @else
            No time booked
          @endif
        </strong>
        <span class="badge badge-teal">{{ $a->modeLabel() }}</span>
        @if ($a->status === 'requested')
          <span class="badge badge-warn">Needs your answer</span>
        @elseif ($a->status === 'confirmed')
          <span class="badge badge-success">Confirmed</span>
        @elseif ($a->status === 'declined')
          <span class="badge badge-danger">Declined</span>
        @else
          <span class="badge">Done</span>
        @endif
      </div>

      <div class="muted" style="margin-top:5px;">
        {{ $a->user?->name ?? 'Deleted account' }}
        @if ($a->contact_mobile)
          &middot; <span style="font-family:ui-monospace,monospace;">{{ $a->contact_mobile }}</span>
        @endif
        &middot; booked {{ $a->created_at->diffForHumans() }}
      </div>

      @if ($a->note)
        <div style="font-size:14px;line-height:1.6;margin-top:8px;white-space:pre-wrap;max-width:70ch;">{{ $a->note }}</div>
      @endif

      @if ($a->admin_note)
        <div style="margin-top:9px;padding:9px 12px;border-left:3px solid var(--teal);background:var(--teal-50);
                    border-radius:0 8px 8px 0;font-size:13.5px;max-width:70ch;">
          <span class="muted">You said:</span> {{ $a->admin_note }}
        </div>
      @endif
    </div>
  </div>

  @if (in_array($a->status, ['requested', 'confirmed'], true))
    <details style="margin-top:12px;" @if($a->status === 'requested') open @endif>
      <summary style="cursor:pointer;font-size:13px;color:var(--text-muted);">
        {{ $a->status === 'requested' ? 'Answer this' : 'Update' }}
      </summary>
      <form method="POST" action="{{ route('clinic.appointments.respond', $a) }}" style="margin-top:10px;">
        @csrf
        <label for="note-{{ $a->id }}">A note for the patient &mdash; they see this</label>
        <textarea id="note-{{ $a->id }}" name="admin_note" maxlength="2000"
                  placeholder="If you are declining or suggesting another time, say so here.">{{ $a->admin_note }}</textarea>
        <div class="stack" style="margin-top:10px;">
          <select name="status" required style="max-width:190px;">
            <option value="confirmed" @selected($a->status === 'confirmed')>Confirm</option>
            <option value="declined">Decline &mdash; frees the time</option>
            <option value="done">Mark done</option>
          </select>
          <button type="submit" class="btn btn-primary btn-sm">Save</button>
        </div>
      </form>
    </details>
  @endif
</div>
