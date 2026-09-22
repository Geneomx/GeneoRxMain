@extends('layouts.portal')

{{-- Ask a doctor — the web twin of mobile/src/screens/DoctorScreen.tsx.
     Server-rendered on the portal's dark theme. Static copy carries data-i18n
     so the site's language selector translates it like every other page;
     the doctor.* keys are the ones the mobile app already uses. --}}

@php
  // After a failed validation the redirect lands on the previous URL, which
  // may lack ?tab=; the form that failed says which panel it lives in.
  $tab = old('tab', $tab);
@endphp

@push('styles')
<style>
  .docSeg{display:flex;gap:6px;margin-top:14px}
  .docSeg button{flex:1;min-height:46px;font-size:15px;font-weight:700;color:var(--muted);background:rgba(7,10,18,.35)}
  .docSeg button[aria-selected="true"]{color:var(--cyan);border-color:rgba(40,225,255,.6);background:rgba(40,225,255,.10)}
  .docBd > * + *{margin-top:12px}
  .docNotice{padding:14px;border-radius:14px;border:1px solid rgba(251,191,36,.32);background:rgba(251,191,36,.10);font-size:14px;line-height:1.5}
  .docFlash{padding:12px 14px;border-radius:14px;border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.10);font-size:14px;line-height:1.5}
  .docFlash--error{border-color:rgba(251,113,133,.35);background:rgba(251,113,133,.10)}
  .docCard{padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(7,10,18,.28)}
  .docCard h3{margin:0 0 8px;font-size:17px;font-weight:700}
  .docList > * + *{margin-top:12px}
  .docSectionTitle{margin:18px 0 8px;font-size:15px;font-weight:700;color:var(--muted);letter-spacing:.2px}
  .docForm label{display:block;margin:14px 0 6px;font-size:14px;font-weight:600;color:var(--muted)}
  .docForm textarea{min-height:104px}
  .docChips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 2px}
  /* The input stays in the tree (keyboard, form submission); the pill is the
     span, so a checked state can be styled without :has(). */
  .docChip{position:relative;display:inline-flex;cursor:pointer}
  .docChip input{position:absolute;opacity:0;width:0;height:0}
  .docChip span{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(15,23,54,.45);font-size:15px;color:var(--txt);user-select:none}
  .docChip input:checked + span{background:rgba(40,225,255,.18);border-color:rgba(40,225,255,.45);font-weight:900}
  .docChip input:focus-visible + span{outline:2px solid var(--cyan);outline-offset:2px}
  .docChip small{margin-left:6px;color:var(--muted);font-size:13px;font-weight:400}
  .docRowTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .docWho{font-weight:700;font-size:15px}
  .docBody{margin-top:8px;font-size:15px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
  .docLine{margin-top:8px;font-size:15px;line-height:1.5}
  .docReply{margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(52,211,153,.30);background:rgba(52,211,153,.08)}
  .docReplyWho{font-size:13px;font-weight:700;color:var(--green);margin-bottom:4px}
  .docFine{font-size:13px;line-height:1.45;color:var(--muted2);margin-top:6px}
  .tierNo{border-color:rgba(251,113,133,.35);background:rgba(251,113,133,.10)}
  .docPanel[hidden]{display:none}
</style>
@endpush

@section('content')

  @if($guest)
  <div class="guest-bar" role="status">
    <span data-i18n="save_account.guest_bar">Guest mode — progress saved on this device.</span>
  </div>
  @endif

  <div class="top portal-top">
    <div class="brand portal-brand">
      @include('partials.geneorx-brand', [
        'variant' => 'full',
        'logoSize' => 'portal',
        'subtitle' => 'Portal',
        'subtitleI18n' => 'portal.badge',
        'href' => route('home'),
        'class' => 'brand-logo-link',
      ])
    </div>
    <div class="status portal-status">
      @include('partials.language-selector')
      <a href="{{ route('treatments') }}" class="ghost mini portal-link-btn" data-i18n="doctor.back">Back to dashboard</a>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="hd">
        <div class="hd-top">
          <div>
            <h2 data-i18n="doctor.title">Ask a doctor</h2>
            <div class="desc" data-i18n="doctor.sub">Leave a question, or ask for an appointment.</div>
          </div>
        </div>
        @unless($guest)
        <div class="docSeg" role="tablist">
          <button type="button" role="tab" data-doc-tab="ask" aria-selected="{{ $tab === 'ask' ? 'true' : 'false' }}" data-i18n="doctor.tab.ask">Questions</button>
          <button type="button" role="tab" data-doc-tab="appointments" aria-selected="{{ $tab === 'appointments' ? 'true' : 'false' }}" data-i18n="doctor.tab.appointments">Appointments</button>
        </div>
        @endunless
      </div>

      <div class="bd docBd">
        {{-- The boundary, before anything can be sent. --}}
        <div class="docNotice" data-i18n="doctor.not_emergency">Not for emergencies. If something feels urgent, call your doctor or emergency services. A reply can take a few days.</div>

        @if(session('doctor_sent') === 'question')
          <div class="docFlash" role="status">
            <strong data-i18n="doctor.sent_title">Question sent</strong><br>
            <span data-i18n="doctor.sent_body">A doctor will reply here. You will see the answer in this screen.</span>
          </div>
        @elseif(session('doctor_sent') === 'appointment')
          <div class="docFlash" role="status">
            <strong data-i18n="doctor.appt_sent_title">Request sent</strong><br>
            <span data-i18n="doctor.appt_sent_body">Someone will get back to you to confirm a time.</span>
          </div>
        @endif

        @if(session('doctor_error'))
          <div class="docFlash docFlash--error" role="alert">
            <strong data-i18n="doctor.failed_title">Could not send</strong><br>
            @if(session('doctor_error') === 'already')
              <span data-i18n="doctor.appt_already">You already have a request waiting for a reply.</span>
            @elseif(session('doctor_error') === 'guest')
              <span data-i18n="doctor.guest_body">You need an account so a doctor can reply to you. Create one or sign in, and your questions will be kept here.</span>
            @else
              <span data-i18n="doctor.failed_body">Please check your connection and try again.</span>
            @endif
          </div>
        @endif

        @if($errors->any())
          <div class="docFlash docFlash--error" role="alert">
            <strong data-i18n="doctor.failed_title">Could not send</strong><br>
            <span>{{ $errors->first() }}</span>
          </div>
        @endif

        @if($guest)
          <div class="docCard">
            <h3 data-i18n="doctor.guest_title">Sign in to ask a doctor</h3>
            <div class="fineprint" data-i18n="doctor.guest_body">You need an account so a doctor can reply to you. Create one or sign in, and your questions will be kept here.</div>
            {{-- Ends the guest session, then lands on sign-in (which links to register). --}}
            <form method="POST" action="{{ route('logout') }}" class="btns">
              @csrf
              <input type="hidden" name="redirect_to" value="login">
              <button type="submit" class="primary" data-i18n="doctor.guest_cta">Sign in or create an account</button>
            </form>
          </div>
        @else

          {{-- ── Questions ── --}}
          <div class="docPanel" data-doc-panel="ask" @if($tab !== 'ask') hidden @endif>
            <form method="POST" action="{{ route('doctor.message') }}" class="docCard docForm">
              @csrf
              <input type="hidden" name="tab" value="ask">
              <h3 data-i18n="doctor.who">Who would you like to ask?</h3>
              @include('doctor.who', ['doctors' => $doctors])

              <label for="docBody" data-i18n="doctor.your_question">Your question</label>
              <textarea id="docBody" name="body" required maxlength="4000" data-i18n-placeholder="doctor.question_hint" placeholder="For example: should I take this with food?">{{ old('body') }}</textarea>

              <label for="docMobile" data-i18n="doctor.mobile_label">Your mobile number</label>
              <input id="docMobile" type="tel" name="contact_mobile" maxlength="40" value="{{ old('contact_mobile') }}" data-i18n-placeholder="doctor.mobile_hint" placeholder="Optional">
              <div class="docFine" data-i18n="doctor.mobile_note">Only used to reply to this question. You can leave it blank.</div>

              <div class="btns">
                <button type="submit" class="primary" data-i18n="doctor.send">Send question</button>
              </div>
            </form>

            <div class="docSectionTitle" data-i18n="doctor.your_questions">YOUR QUESTIONS</div>
            <div class="docList">
              @forelse($messages as $m)
                <div class="docCard">
                  <div class="docRowTop">
                    <div class="docWho">@if($m['doctor']){{ $m['doctor'] }}@else<span data-i18n="doctor.any">Any doctor</span>@endif</div>
                    <span class="tierPill {{ $m['reply'] ? 'tierHigh' : 'tierMod' }}" data-i18n="doctor.status.{{ $m['status'] }}">{{ ucfirst($m['status']) }}</span>
                  </div>
                  <div class="docBody">{{ $m['body'] }}</div>
                  @if($m['reply'])
                    <div class="docReply">
                      <div class="docReplyWho">
                        @if($m['doctor'])
                          <span data-i18n="doctor.reply_from" data-i18n-vars="{{ json_encode(['name' => $m['doctor']]) }}">Reply from {{ $m['doctor'] }}</span>
                        @else
                          <span data-i18n="doctor.reply">Reply</span>
                        @endif
                      </div>
                      <div class="docBody" style="margin-top:0">{{ $m['reply'] }}</div>
                    </div>
                  @else
                    <div class="docFine" data-i18n="doctor.waiting">Waiting for a reply.</div>
                  @endif
                </div>
              @empty
                <div class="docCard"><div class="docFine" data-i18n="doctor.no_questions">You have not asked anything yet.</div></div>
              @endforelse
            </div>
          </div>

          {{-- ── Appointments ── --}}
          <div class="docPanel" data-doc-panel="appointments" @if($tab !== 'appointments') hidden @endif>
            @if($openRequest)
              <div class="docCard">
                <h3 data-i18n="doctor.appt_open_title">You have a request waiting</h3>
                <div class="docFine" data-i18n="doctor.appt_open_body">We will come back to you about it. You can send another once this one is settled.</div>
              </div>
            @else
              <form method="POST" action="{{ route('doctor.appointment') }}" class="docCard docForm">
                @csrf
                <input type="hidden" name="tab" value="appointments">
                <h3 data-i18n="doctor.appt_new">Ask for an appointment</h3>
                <div class="docFine" data-i18n="doctor.appt_not_booking">This is a request, not a booking. Someone will confirm a time with you.</div>

                <label data-i18n="doctor.who">Who would you like to ask?</label>
                @include('doctor.who', ['doctors' => $doctors])

                <label data-i18n="doctor.appt_when">Which day suits you?</label>
                <div class="docChips" role="radiogroup">
                  @foreach($quickDates as $iso)
                    <label class="docChip">
                      <input type="radio" name="preferred_date" value="{{ $iso }}" @checked(old('preferred_date') === $iso)>
                      <span data-date="{{ $iso }}">{{ \Carbon\Carbon::parse($iso)->format('D j M') }}</span>
                    </label>
                  @endforeach
                </div>

                <label data-i18n="doctor.appt_time">What time of day?</label>
                <div class="docChips" role="radiogroup">
                  @foreach(\App\Models\AppointmentRequest::TIME_WINDOWS as $w)
                    <label class="docChip">
                      <input type="radio" name="preferred_time" value="{{ $w }}" @checked(old('preferred_time') === $w)>
                      <span data-i18n="doctor.window.{{ $w }}">{{ ucfirst($w) }}</span>
                    </label>
                  @endforeach
                </div>

                <label for="docNote" data-i18n="doctor.appt_note">Anything they should know?</label>
                <textarea id="docNote" name="note" maxlength="2000" data-i18n-placeholder="doctor.appt_note_hint" placeholder="Optional">{{ old('note') }}</textarea>

                <label for="docMobile2" data-i18n="doctor.mobile_label">Your mobile number</label>
                <input id="docMobile2" type="tel" name="contact_mobile" maxlength="40" value="{{ old('contact_mobile') }}" data-i18n-placeholder="doctor.mobile_hint" placeholder="Optional">

                <div class="btns">
                  <button type="submit" class="primary" data-i18n="doctor.appt_send">Send request</button>
                </div>
              </form>
            @endif

            <div class="docSectionTitle" data-i18n="doctor.your_appts">YOUR REQUESTS</div>
            <div class="docList">
              @forelse($appointments as $a)
                <div class="docCard">
                  <div class="docRowTop">
                    <div class="docWho">@if($a['doctor']){{ $a['doctor'] }}@else<span data-i18n="doctor.any">Any doctor</span>@endif</div>
                    <span class="tierPill {{ $a['status'] === 'confirmed' ? 'tierHigh' : ($a['status'] === 'declined' ? 'tierNo' : 'tierMod') }}" data-i18n="doctor.status.{{ $a['status'] }}">{{ ucfirst($a['status']) }}</span>
                  </div>
                  {{-- docLine, not docBody: pre-wrap would keep this template's indentation. --}}
                  <div class="docLine">
                    @if($a['preferred_date'])
                      <span data-date="{{ $a['preferred_date'] }}">{{ \Carbon\Carbon::parse($a['preferred_date'])->format('D j M') }}</span>
                    @else
                      <span data-i18n="doctor.appt_no_date">No day chosen</span>
                    @endif
                    @if($a['preferred_time'])
                      · <span data-i18n="doctor.window.{{ $a['preferred_time'] }}">{{ ucfirst($a['preferred_time']) }}</span>
                    @endif
                  </div>
                  @if($a['note'])<div class="docFine">{{ $a['note'] }}</div>@endif
                  @if($a['response'])
                    <div class="docReply">
                      <div class="docReplyWho" data-i18n="doctor.clinic_said">Response</div>
                      <div class="docBody" style="margin-top:0">{{ $a['response'] }}</div>
                    </div>
                  @endif
                </div>
              @empty
                <div class="docCard"><div class="docFine" data-i18n="doctor.no_appts">You have not asked for an appointment yet.</div></div>
              @endforelse
            </div>
          </div>

        @endif
      </div>
    </div>
  </div>

@endsection

@section('scripts')
<script>
(function(){
  /* Tabs. The page is server-rendered; this only shows one panel at a time,
     the way the mobile segment control does. */
  var tabs = document.querySelectorAll('[data-doc-tab]');
  var panels = document.querySelectorAll('[data-doc-panel]');
  tabs.forEach(function(b){
    b.addEventListener('click', function(){
      var k = b.getAttribute('data-doc-tab');
      tabs.forEach(function(x){ x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      panels.forEach(function(p){ p.hidden = p.getAttribute('data-doc-panel') !== k; });
      try { history.replaceState(null, '', k === 'appointments' ? '?tab=appointments' : location.pathname); } catch (e) {}
    });
  });

  /* A day or time chip that is already chosen unchooses on a second click, so
     "no preference" stays possible — the mobile chips toggle the same way.
     The label's click runs before the browser activates its input, so
     preventing it here is what stops the re-check. */
  document.querySelectorAll('.docChip').forEach(function(label){
    var input = label.querySelector('input[type=radio]');
    if (!input || input.name === 'doctor_id') return;
    label.addEventListener('click', function(e){
      if (input.checked) { e.preventDefault(); input.checked = false; }
    });
  });

  /* Dates in the visitor's own locale, like the mobile screen. */
  document.querySelectorAll('[data-date]').forEach(function(el){
    var d = new Date(el.getAttribute('data-date') + 'T00:00:00');
    if (!isNaN(d.getTime())) el.textContent = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  });

  /* "Reply from {name}" needs a variable, which data-i18n cannot carry. Runs
     after every language change, which the selector announces. */
  function fillVars(){
    var tr = window.geneorxTranslate;
    if (typeof tr !== 'function') return;
    var lang = document.documentElement.lang || 'en';
    document.querySelectorAll('[data-i18n-vars]').forEach(function(el){
      var vars = {};
      try { vars = JSON.parse(el.getAttribute('data-i18n-vars') || '{}'); } catch (e) {}
      var s = tr(el.getAttribute('data-i18n'), lang);
      Object.keys(vars).forEach(function(k){ s = s.split('{' + k + '}').join(String(vars[k])); });
      el.textContent = s;
    });
  }
  window.addEventListener('geneorx:languagechange', fillVars);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillVars); else fillVars();
})();
</script>
@endsection
