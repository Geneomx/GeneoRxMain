/* Ask GeneoRx on public pages: the general questions, no sign-in needed.
   Talks to the same endpoints as the portal: GET /api/assistant/options and POST /api/assistant. */
(function () {
  var fab = document.getElementById('gxAskFab');
  var panel = document.getElementById('gxAskPanel');
  if (!fab || !panel) return;

  var closeBtn = document.getElementById('gxAskClose');
  var log = document.getElementById('gxAskLog');
  var chips = document.getElementById('gxAskChips');
  var list = document.getElementById('gxAskChipList');
  var options = null;
  var busy = false;

  function lang() {
    try { return localStorage.getItem('geneorx_language_v1') || 'en'; } catch (e) { return 'en'; }
  }
  function t(key, fallback) {
    var packs = window.GENEORX_I18N || {};
    var pack = packs[lang()] || packs.en || {};
    return pack[key] || (packs.en || {})[key] || fallback;
  }
  function csrf() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : '';
  }
  function bubble(role, text) {
    var b = document.createElement('div');
    b.className = 'gx-ask-bubble ' + (role === 'user' ? 'gx-ask-user' : 'gx-ask-ai');
    b.textContent = text;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }
  function unavailable(node) {
    node.textContent = t('assistant.unavailable', 'The assistant is not available right now. Please try again later.');
    node.classList.add('gx-ask-notice');
  }

  function renderChips() {
    list.innerHTML = '';
    if (!options || options.mode !== 'catalog_only' || !Array.isArray(options.prompts)) {
      var a = document.createElement('a');
      a.href = '/login';
      a.className = 'gx-ask-chip';
      a.textContent = t('nav.signin', 'Sign in');
      list.appendChild(a);
      return;
    }
    options.prompts.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gx-ask-chip';
      b.textContent = p.label;
      b.addEventListener('click', function () { ask(p); });
      list.appendChild(b);
    });
  }

  function loadOptions() {
    fetch('/api/assistant/options', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { options = d; renderChips(); })
      .catch(function () {
        list.textContent = t('assistant.unavailable', 'The assistant is not available right now. Please try again later.');
      });
  }

  function ask(p) {
    if (busy) return;
    busy = true;
    chips.hidden = true;
    bubble('user', p.label);
    var pending = bubble('ai', '…');
    fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'General guidance' }], prompt_id: p.id, language: lang() })
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }, function () { return { ok: res.ok, d: {} }; }); })
      .then(function (r) {
        if (r.ok && (r.d.source === 'ai' || r.d.source === 'restricted') && r.d.reply) pending.textContent = r.d.reply;
        else unavailable(pending);
      })
      .catch(function () { unavailable(pending); })
      .then(function () { busy = false; chips.hidden = false; log.scrollTop = log.scrollHeight; });
  }

  function setOpen(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && !options) loadOptions();
  }

  fab.addEventListener('click', function () { setOpen(panel.hidden); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); fab.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); fab.focus(); } });
})();
