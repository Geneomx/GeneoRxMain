@php
    use App\Support\AppLanguages;
    $appLanguages = AppLanguages::all();
@endphp

@once
<style>
  .lang-select { position: relative; display: inline-flex; flex-shrink: 0; }
  .lang-select-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(7,10,18,.35);
    color: #EAF0FF;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    line-height: 1;
    max-width: 132px;
  }
  .lang-select-trigger:hover {
    border-color: rgba(40,225,255,.28);
    background: rgba(40,225,255,.08);
  }
  .lang-select-trigger span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lang-select-chevron { font-size: 10px; color: #7E8AB8; margin-top: 1px; }
  .lang-select-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 220px;
    max-width: min(280px, calc(100vw - 24px));
    padding: 8px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(11,16,34,.98);
    box-shadow: 0 18px 48px rgba(0,0,0,.35);
    z-index: 120;
  }
  .lang-select-menu[hidden] { display: none !important; }
  html[dir="rtl"] .lang-select-menu { right: auto; left: 0; }
  html[dir="rtl"] .lang-select-trigger { flex-direction: row-reverse; }
  .lang-select-menu-hd {
    padding: 8px 10px 6px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .6px;
    text-transform: uppercase;
    color: #7E8AB8;
  }
  .lang-select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: #EAF0FF;
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }
  .lang-select-option:hover {
    background: rgba(255,255,255,.05);
    border-color: rgba(255,255,255,.08);
  }
  .lang-select-option--on {
    background: rgba(40,225,255,.08);
    border-color: rgba(40,225,255,.22);
    color: #B9F8FF;
  }
  .lang-select-option-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .lang-select-hint { font-size: 11px; font-weight: 500; color: #7E8AB8; }
  .lang-select-check { font-size: 13px; font-weight: 800; color: #28E1FF; flex-shrink: 0; }
  #langSelectToast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%) translateY(12px);
    opacity: 0;
    pointer-events: none;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(40,225,255,.24);
    background: rgba(11,16,34,.96);
    color: #EAF0FF;
    font-size: 13px;
    font-weight: 600;
    z-index: 9999;
    transition: opacity .2s ease, transform .2s ease;
  }
  #langSelectToast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>
@endonce

<div class="lang-select" data-lang-select>
  <button type="button"
          class="lang-select-trigger"
          data-lang-trigger
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-label="Choose language">
    <span data-lang-label>English</span>
    <span class="lang-select-chevron" aria-hidden="true">▾</span>
  </button>
  <div class="lang-select-menu" data-lang-menu hidden role="listbox" aria-label="All languages">
    <div class="lang-select-menu-hd" data-i18n="lang.all">All languages</div>
    @foreach ($appLanguages as $lang)
      <button type="button"
              class="lang-select-option"
              data-lang-option
              data-code="{{ $lang['code'] }}"
              data-label="{{ $lang['native_label'] }}"
              role="option">
        <span class="lang-select-option-text">
          <span>{{ $lang['native_label'] }}</span>
          @if ($lang['native_label'] !== $lang['label'])
            <span class="lang-select-hint">{{ $lang['label'] }}</span>
          @endif
        </span>
        <span class="lang-select-check" data-lang-check hidden aria-hidden="true">✓</span>
      </button>
    @endforeach
  </div>
</div>

@once
<script>
  window.GENEORX_I18N = @json(\App\Support\SiteTranslations::all());
  window.GENEORX_RTL = @json(\App\Support\SiteTranslations::rtlCodes());
</script>
<div id="langSelectToast" aria-live="polite"></div>
<script src="{{ asset('js/language-selector.js') }}" defer></script>
@endonce
