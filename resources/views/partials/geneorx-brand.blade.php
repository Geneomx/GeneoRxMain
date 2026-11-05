@php
  $variant = $variant ?? 'mark';
  $size = $size ?? 36;
  // The logo stands on its own; the name is in the page title and the image's alt text.
  $showName = false;
  $size = max((int) $size, 40);
  $href = $href ?? route('home');
  $logoSize = $logoSize ?? null;
  $markSize = max(28, (int) round($size * 0.92));
  $radius = max(10, (int) round($size * 0.32));
  $sizeClass = $logoSize ? ' geneorx-brand--logo-'.$logoSize : '';
@endphp
<a href="{{ $href }}" aria-label="GeneoRx" class="geneorx-brand geneorx-brand--{{ $variant }}{{ $sizeClass }} {{ $class ?? '' }}" @isset($style) style="{{ $style }}" @endisset>
  @if($variant === 'full')
    <img
      src="{{ \App\Support\LogoAssets::full() }}"
      alt="GeneoRx"
      class="geneorx-brand-full"
    >
    @if(!empty($subtitle))
      <span class="geneorx-brand-subtitle" @if(!empty($subtitleI18n)) data-i18n="{{ $subtitleI18n }}" @endif>{{ $subtitle }}</span>
    @endif
  @else
    <span class="geneorx-brandmark" style="width:{{ $size }}px;height:{{ $size }}px;border-radius:0 !important;background:transparent !important;box-shadow:none !important">
      <img src="{{ \App\Support\LogoAssets::markDark() }}" alt="GeneoRx" width="{{ $markSize }}" height="{{ $markSize }}" style="transform:none;filter:none">
    </span>
    @if($showName)
      <span class="geneorx-brand-name">{{ $name ?? 'GeneoRx' }}</span>
    @endif
  @endif
</a>
