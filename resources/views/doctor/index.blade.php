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
  .docChip input:disabled + span{opacity:.5;cursor:not-allowed}
  .docChipNote{font-size:11px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:var(--muted2)}
  .docChipNote[hidden]{display:none}
  .docRowTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .docWho{font-weight:700;font-size:15px}
  .docBody{margin-top:8px;font-size:15px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
  .docLine{margin-top:8px;font-size:15px;line-height:1.5}
  .docReply{margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(52,211,153,.30);background:rgba(52,211,153,.08)}
  .docChat{display:flex;flex-direction:column;gap:10px;margin-top:10px}
  .docTurn{display:flex;flex-direction:column;max-width:min(80%,520px)}
  .docTurn--patient{align-self:flex-start}
  .docTurn--doctor{align-self:flex-end;align-items:flex-end}
  .docBubble{padding:10px 13px;border-radius:14px;font-size:15px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;
    border:1px solid rgba(255,255,255,.14);background:rgba(15,23,54,.55);border-bottom-left-radius:5px}
  .docTurn--doctor .docBubble{border-color:rgba(52,211,153,.32);background:rgba(52,211,153,.10);
    border-bottom-left-radius:14px;border-bottom-right-radius:5px}
  .docTurnWho{font-size:11.5px;color:var(--muted2);margin-top:4px}
  .docReplyForm{margin-top:12px}
  .docReplyForm label{display:block;margin:0 0 6px;font-size:14px;font-weight:600;color:var(--muted)}
  .docReplyForm textarea{min-height:76px}
  .docShareRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0;padding:10px 0;
    border-bottom:1px solid rgba(255,255,255,.08)}
  .docShareRow:last-of-type{border-bottom:0}
  .docShareName{flex:1;min-width:0;font-size:15px;font-weight:600}
  .docShareOn,.docShareOff{margin-left:8px;font-size:11.5px;font-weight:800;letter-spacing:.3px;
    text-transform:uppercase;border-radius:999px;padding:2px 8px}
  .docShareOn{color:var(--green);border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.10)}
  .docShareOff{color:var(--muted2);border:1px solid rgba(255,255,255,.12)}
  .docModeTag{margin-left:8px;font-size:11.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;
    color:var(--cyan);border:1px solid rgba(40,225,255,.28);background:rgba(40,225,255,.10);
    border-radius:999px;padding:2px 8px;vertical-align:middle}
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
      @include('partials.staff-links')
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

        @if(session('doctor_sent') === 'shared')
          <div class="docFlash" role="status">
            <span data-i18n="doctor.share_started">Your health summary is now shared with that doctor.</span>
          </div>
        @elseif(session('doctor_sent') === 'unshared')
          <div class="docFlash" role="status">
            <span data-i18n="doctor.share_stopped">That doctor can no longer see your health summary.</span>
          </div>
        @elseif(session('doctor_sent') === 'question')
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
            @elseif(session('doctor_error') === 'closed')
              <span data-i18n="doctor.chat_closed">This conversation is closed. You can ask a new question above.</span>
            @elseif(session('doctor_error') === 'slot_taken')
              <span data-i18n="doctor.appt_slot_taken">That time was just taken. Please pick another.</span>
            @elseif(in_array(session('doctor_error'), ['slot_unavailable', 'slot_needs_doctor'], true))
              <span data-i18n="doctor.appt_incomplete">Please choose a doctor, a day and a free time.</span>
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

            {{-- Sharing is per doctor and revocable: telling one clinician
                 about your medications should not tell the whole directory. --}}
            @if($doctors->isNotEmpty())
              <div class="docSectionTitle" data-i18n="doctor.share_title">YOUR HEALTH SUMMARY</div>
              <div class="docCard">
                <div class="docFine" data-i18n="doctor.share_intro">Share your medicines, symptoms and latest check-in with a doctor so they can answer with the full picture. You can stop sharing at any time.</div>
                @foreach($doctors as $d)
                  <form method="POST" action="{{ route('doctor.share') }}" class="docShareRow">
                    @csrf
                    <input type="hidden" name="doctor_id" value="{{ $d['id'] }}">
                    <input type="hidden" name="shared" value="{{ $d['shared'] ? 0 : 1 }}">
                    <span class="docShareName">
                      {{ $d['name'] }}
                      @if($d['shared'])
                        <small class="docShareOn" data-i18n="doctor.share_on">Shared</small>
                      @else
                        <small class="docShareOff" data-i18n="doctor.share_off">Not shared</small>
                      @endif
                    </span>
                    <button type="submit" class="ghost mini">
                      @if($d['shared'])
                        <span data-i18n="doctor.share_stop">Stop sharing</span>
                      @else
                        <span data-i18n="doctor.share_start">Share</span>
                      @endif
                    </button>
                  </form>
                @endforeach
                <div class="docFine" data-i18n="doctor.share_note">Only the doctor you choose can see it, and only while you share it.</div>
              </div>
            @endif

            <div class="docSectionTitle" data-i18n="doctor.your_questions">YOUR QUESTIONS</div>
            <div class="docList">
              @forelse($messages as $m)
                {{-- A conversation, not a question with one answer: the patient
                     can keep talking, and each turn is attributed. --}}
                <div class="docCard">
                  <div class="docRowTop">
                    <div class="docWho">@if($m['doctor']){{ $m['doctor'] }}@else<span data-i18n="doctor.any">Any doctor</span>@endif</div>
                    <span class="tierPill {{ $m['status'] === 'answered' ? 'tierHigh' : ($m['status'] === 'closed' ? '' : 'tierMod') }}" data-i18n="doctor.status.{{ $m['status'] }}">{{ ucfirst($m['status']) }}</span>
                  </div>

                  <div class="docChat">
                    @foreach($m['thread'] as $turn)
                      <div class="docTurn docTurn--{{ $turn['from'] }}">
                        <div class="docBubble">{{ $turn['body'] }}</div>
                        <div class="docTurnWho">
                          @if($turn['from'] === 'doctor')
                            {{ $m['doctor'] ?? '' }}
                          @else
                            <span data-i18n="doctor.you">You</span>
                          @endif
                        </div>
                      </div>
                    @endforeach
                  </div>

                  @if($m['status'] === 'closed')
                    <div class="docFine" data-i18n="doctor.chat_closed">This conversation is closed. You can ask a new question above.</div>
                  @else
                    @if(count($m['thread']) < 2)
                      <div class="docFine" data-i18n="doctor.waiting">Waiting for a reply.</div>
                    @endif
                    <form method="POST" action="{{ route('doctor.message.reply', $m['id']) }}" class="docReplyForm">
                      @csrf
                      <input type="hidden" name="tab" value="ask">
                      <label for="reply-{{ $m['id'] }}" data-i18n="doctor.chat_reply_label">Write a reply</label>
                      <textarea id="reply-{{ $m['id'] }}" name="body" required maxlength="4000"
                                data-i18n-placeholder="doctor.chat_reply_hint" placeholder="Add anything else they should know."></textarea>
                      <div class="btns">
                        <button type="submit" class="primary mini" data-i18n="doctor.chat_send">Send</button>
                      </div>
                    </form>
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
              {{-- Doctor → day → the doctor's own times for that day. The day
                   chips are all rendered; the browser greys out the ones the
                   chosen doctor does not work, then fetches the slots. --}}
              <form method="POST" action="{{ route('doctor.appointment') }}" class="docCard docForm" id="apptForm" data-slots-url="{{ route('doctor.slots') }}">
                @csrf
                <input type="hidden" name="tab" value="appointments">
                <input type="hidden" name="slot_at" id="apptSlotAt" value="">
                <h3 data-i18n="doctor.appt_new">Ask for an appointment</h3>
                <div class="docFine" data-i18n="doctor.appt_not_booking">Pick a free time. It is held for you until the clinic confirms it.</div>

                <label data-i18n="doctor.appt_pick_doctor">Who would you like to see?</label>
                @if($doctors->isEmpty())
                  <div class="docFine" data-i18n="doctor.appt_no_doctors">No doctors are taking bookings yet.</div>
                @else
                  <div class="docChips" role="radiogroup">
                    @foreach($doctors as $d)
                      <label class="docChip">
                        <input type="radio" name="doctor_id" value="{{ $d['id'] }}" data-days="{{ implode(',', $d['available_days']) }}" @checked((string) old('doctor_id') === (string) $d['id'])>
                        <span>{{ $d['name'] }}@if(!empty($d['specialty']))<small>{{ $d['specialty'] }}</small>@endif</span>
                      </label>
                    @endforeach
                  </div>
                @endif

                <label data-i18n="doctor.appt_mode">How would you like to see them?</label>
                <div class="docChips" role="radiogroup">
                  @foreach(['chat' => 'Chat', 'call' => 'Phone call', 'visit' => 'In person'] as $mode => $label)
                    <label class="docChip">
                      <input type="radio" name="mode" value="{{ $mode }}" @checked(old('mode', 'visit') === $mode)>
                      <span data-i18n="doctor.mode.{{ $mode }}">{{ $label }}</span>
                    </label>
                  @endforeach
                </div>
                <div class="docFine" data-i18n="doctor.appt_mode_note">If you choose chat, the conversation happens in Questions at the time you booked.</div>

                <label data-i18n="doctor.appt_pick_day">Which day?</label>
                <div class="docChips" role="radiogroup" id="apptDays">
                  @foreach($days as $day)
                    <label class="docChip">
                      <input type="radio" name="day" value="{{ $day['date'] }}" data-dow="{{ $day['dow'] }}">
                      <span><span data-date="{{ $day['date'] }}">{{ \Carbon\Carbon::parse($day['date'])->format('D j M') }}</span><small class="docChipNote" data-i18n="doctor.appt_closed" hidden>Closed</small></span>
                    </label>
                  @endforeach
                </div>

                <label data-i18n="doctor.appt_pick_time">Which time?</label>
                <div class="docChips" role="radiogroup" id="apptSlots">
                  <div class="docFine" data-i18n="doctor.appt_choose_first">Choose a doctor and a day to see the times.</div>
                </div>

                <label for="docNote" data-i18n="doctor.appt_note">Anything they should know?</label>
                <textarea id="docNote" name="note" maxlength="2000" data-i18n-placeholder="doctor.appt_note_hint" placeholder="Optional">{{ old('note') }}</textarea>

                <label for="docMobile2" data-i18n="doctor.mobile_label">Your mobile number</label>
                <input id="docMobile2" type="tel" name="contact_mobile" maxlength="40" value="{{ old('contact_mobile') }}" data-i18n-placeholder="doctor.mobile_hint" placeholder="Optional">

                <div class="btns">
                  <button type="submit" class="primary" id="apptSubmit" disabled data-i18n="doctor.appt_book">Book this time</button>
                </div>
              </form>
            @endif

            <div class="docSectionTitle" data-i18n="doctor.your_appts">YOUR REQUESTS</div>
            <div class="docList">
              @forelse($appointments as $a)
                <div class="docCard">
                  <div class="docRowTop">
                    <div class="docWho">
                      @if($a['doctor']){{ $a['doctor'] }}@else<span data-i18n="doctor.any">Any doctor</span>@endif
                      <span class="docModeTag" data-i18n="doctor.mode.{{ $a['mode'] }}">{{ ucfirst($a['mode']) }}</span>
                    </div>
                    <span class="tierPill {{ $a['status'] === 'confirmed' ? 'tierHigh' : ($a['status'] === 'declined' ? 'tierNo' : 'tierMod') }}" data-i18n="doctor.status.{{ $a['status'] }}">{{ ucfirst($a['status']) }}</span>
                  </div>
                  {{-- docLine, not docBody: pre-wrap would keep this template's indentation. --}}
                  <div class="docLine">
                    @if($a['preferred_date'])
                      <span data-date="{{ $a['preferred_date'] }}">{{ \Carbon\Carbon::parse($a['preferred_date'])->format('D j M') }}</span>
                    @else
                      <span data-i18n="doctor.appt_no_date">No day chosen</span>
                    @endif
                    @if($a['slot_time'])
                      · {{ $a['slot_time'] }}–{{ $a['slot_ends'] }}
                    @elseif($a['preferred_time'])
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

  /* Booking: doctor → day → that doctor's times for the day. Days the chosen
     doctor does not work are greyed with "Closed" rather than hidden; a time
     somebody already holds stays visible, disabled, marked "Booked". */
  var form = document.getElementById('apptForm');
  if (form) {
    var slotsUrl = form.getAttribute('data-slots-url');
    var slotAtInput = document.getElementById('apptSlotAt');
    var slotsBox = document.getElementById('apptSlots');
    var submit = document.getElementById('apptSubmit');
    /* The site translator is a deferred script, so it does not exist yet when
       this runs. English defaults stand in until it does — a raw key must
       never reach the screen — and retranslate() fixes the labels up once the
       selector announces a language (it fires that on init too). */
    var FALLBACK = {
      'doctor.appt_booked': 'Booked',
      'doctor.appt_choose_first': 'Choose a doctor and a day to see the times.',
      'doctor.appt_loading_times': 'Loading times…',
      'doctor.appt_times_failed': 'Could not load the times. Please try again.',
      'doctor.appt_no_times': 'No free times on this day. Please try another day.'
    };
    var tr = function(key){
      var f = window.geneorxTranslate;
      var s = typeof f === 'function' ? f(key, document.documentElement.lang || 'en') : null;
      return (s && s !== key) ? s : (FALLBACK[key] || key);
    };
    function retranslate(){
      slotsBox.querySelectorAll('[data-i18n]').forEach(function(el){
        el.textContent = tr(el.getAttribute('data-i18n'));
      });
    }
    window.addEventListener('geneorx:languagechange', retranslate);
    var chosenDoctor = function(){ return form.querySelector('input[name=doctor_id]:checked'); };
    var chosenDay = function(){ return form.querySelector('input[name=day]:checked'); };

    function refreshDays(){
      var doc = chosenDoctor();
      var open = doc ? doc.getAttribute('data-days').split(',') : null;
      form.querySelectorAll('input[name=day]').forEach(function(inp){
        var closed = !!open && open.indexOf(inp.getAttribute('data-dow')) === -1;
        inp.disabled = closed;
        var note = inp.parentNode.querySelector('.docChipNote');
        if (note) note.hidden = !closed;
        if (closed && inp.checked) inp.checked = false;
      });
    }
    function setSlot(at){ slotAtInput.value = at || ''; submit.disabled = !at; }
    function showText(key){
      slotsBox.innerHTML = '';
      var d = document.createElement('div');
      d.className = 'docFine'; d.setAttribute('data-i18n', key); d.textContent = tr(key);
      slotsBox.appendChild(d);
    }
    function loadSlots(){
      setSlot('');
      var doc = chosenDoctor(), day = chosenDay();
      if (!doc || !day) { showText('doctor.appt_choose_first'); return; }
      showText('doctor.appt_loading_times');
      var url = slotsUrl + '?doctor=' + encodeURIComponent(doc.value) + '&date=' + encodeURIComponent(day.value);
      fetch(url, { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
        .then(function(r){ if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function(data){
          // Past slots are not worth a disabled chip; booked ones are.
          var bookable = (data.slots || []).filter(function(s){ return s.reason !== 'past'; });
          if (!data.open || !bookable.length) { showText('doctor.appt_no_times'); return; }
          slotsBox.innerHTML = '';
          bookable.forEach(function(s){
            var label = document.createElement('label'); label.className = 'docChip';
            var input = document.createElement('input');
            input.type = 'radio'; input.name = 'slot'; input.value = s.at; input.disabled = !s.available;
            var span = document.createElement('span'); span.textContent = s.time + '–' + s.ends;
            if (!s.available) {
              var n = document.createElement('small');
              n.className = 'docChipNote'; n.setAttribute('data-i18n', 'doctor.appt_booked'); n.textContent = tr('doctor.appt_booked');
              span.appendChild(n);
            }
            input.addEventListener('change', function(){ if (input.checked) setSlot(s.at); });
            label.appendChild(input); label.appendChild(span); slotsBox.appendChild(label);
          });
        })
        .catch(function(){ showText('doctor.appt_times_failed'); });
    }
    form.querySelectorAll('input[name=doctor_id]').forEach(function(i){ i.addEventListener('change', function(){ refreshDays(); loadSlots(); }); });
    form.querySelectorAll('input[name=day]').forEach(function(i){ i.addEventListener('change', loadSlots); });
    refreshDays();
    loadSlots();
  }

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
