(function () {
  const STORAGE_KEY = 'geneorx_language_v1';
  const DEFAULT = 'en';
  const RTL = window.GENEORX_RTL || ['ar', 'ur'];
  let toastTimer = null;

  function packs() {
    return window.GENEORX_I18N || { en: {} };
  }

  function t(key, lang) {
    const pack = packs()[lang] || packs()[DEFAULT] || {};
    if (pack[key]) return pack[key];
    const fallback = packs()[DEFAULT] || {};
    return fallback[key] || key;
  }

  function showToast(message) {
    const el = document.getElementById('langSelectToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function readSavedCode() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && packs()[saved]) return saved;
      return DEFAULT;
    } catch (e) {
      return DEFAULT;
    }
  }

  function writeCode(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
      document.cookie = STORAGE_KEY + '=' + encodeURIComponent(code) + ';path=/;max-age=31536000;SameSite=Lax';
    } catch (e) {}
  }

  function applyTranslations(lang) {
    const next = packs()[lang] ? lang : DEFAULT;
    document.documentElement.lang = next;
    document.documentElement.dir = RTL.includes(next) ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key, next);
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = t(key, next);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      el.setAttribute('placeholder', t(key, next));
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      el.setAttribute('aria-label', t(key, next));
    });

    document.querySelectorAll('[data-lang-trigger]').forEach((el) => {
      el.setAttribute('aria-label', t('lang.choose', next));
    });

    window.dispatchEvent(new CustomEvent('geneorx:languagechange', { detail: { lang: next } }));
    return next;
  }

  function updateRoot(root, code) {
    const label = root.querySelector('[data-lang-label]');
    const options = root.querySelectorAll('[data-lang-option]');
    let activeLabel = 'English';

    options.forEach((option) => {
      const on = option.dataset.code === code;
      option.classList.toggle('lang-select-option--on', on);
      option.setAttribute('aria-selected', on ? 'true' : 'false');
      const check = option.querySelector('[data-lang-check]');
      if (check) check.hidden = !on;
      if (on) activeLabel = option.dataset.label || activeLabel;
    });

    if (label) label.textContent = activeLabel;
  }

  function closeAllMenus() {
    document.querySelectorAll('[data-lang-menu]').forEach((menu) => {
      menu.hidden = true;
    });
    document.querySelectorAll('[data-lang-trigger]').forEach((trigger) => {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function setLanguage(code, options) {
    const opts = options || {};
    const roots = document.querySelectorAll('[data-lang-select]');
    const applied = applyTranslations(code);

    writeCode(applied);
    roots.forEach((root) => updateRoot(root, applied));

    if (opts.notify) {
      showToast(t('lang.saved', applied));
    }
  }

  function initRoot(root) {
    if (root.dataset.langReady === '1') return;
    root.dataset.langReady = '1';

    const trigger = root.querySelector('[data-lang-trigger]');
    const menu = root.querySelector('[data-lang-menu]');
    const options = root.querySelectorAll('[data-lang-option]');
    if (!trigger || !menu) return;

    const saved = readSavedCode();
    updateRoot(root, saved);

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = menu.hidden;
      closeAllMenus();
      menu.hidden = !willOpen;
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    menu.addEventListener('click', (event) => event.stopPropagation());

    options.forEach((option) => {
      option.addEventListener('click', () => {
        setLanguage(option.dataset.code || DEFAULT, { notify: true });
        closeAllMenus();
      });
    });
  }

  function init() {
    const saved = readSavedCode();
    applyTranslations(saved);
    document.querySelectorAll('[data-lang-select]').forEach(initRoot);
    document.querySelectorAll('[data-lang-select]').forEach((root) => updateRoot(root, saved));

    document.addEventListener('click', closeAllMenus);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAllMenus();
    });
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setLanguage(event.newValue, { notify: false });
      }
    });
  }

  window.geneorxSetLanguage = setLanguage;
  window.geneorxTranslate = t;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
