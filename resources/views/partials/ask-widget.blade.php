{{-- Ask GeneoRx on public pages: the four general questions, open to everyone. Behaviour: public/js/ask-widget.js --}}
<button type="button" id="gxAskFab" class="gx-ask-fab" aria-expanded="false" aria-controls="gxAskPanel">
  <span class="gx-ask-spark" aria-hidden="true">&#10022;</span>
  <span data-i18n="assistant.title">Ask GeneoRx</span>
</button>
<section id="gxAskPanel" class="gx-ask-panel" role="dialog" aria-labelledby="gxAskTitle" hidden>
  <div class="gx-ask-head">
    <h2 id="gxAskTitle" data-i18n="assistant.title">Ask GeneoRx</h2>
    <button type="button" id="gxAskClose" class="gx-ask-close" aria-label="Close">&times;</button>
  </div>
  <p class="gx-ask-note" data-i18n="ask.home_note">General guidance on medicines and tracking. Your personal records are not sent here.</p>
  <div id="gxAskLog" class="gx-ask-log" aria-live="polite"></div>
  <div id="gxAskChips" class="gx-ask-chips">
    <p class="gx-ask-pick" data-i18n="ask.home_pick">Choose a question:</p>
    <div id="gxAskChipList"></div>
  </div>
  <p class="gx-ask-disc" data-i18n="assistant.disclaimer">Educational only — not medical advice. For dosing changes, ask your pharmacist or prescriber.</p>
  <a class="gx-ask-account" href="{{ route('register') }}" data-i18n="ask.home_account">Create a free account to track your own medicines</a>
</section>
<script src="{{ asset('js/ask-widget.js') }}" defer></script>
