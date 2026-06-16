@php
  $variant = $variant ?? 'mark';
  $size = $size ?? 36;
  $showName = $showName ?? ($variant === 'mark');
  $href = $href ?? route('home');
  $logoSize = $logoSize ?? null;
  $markSize = max(28, (int) round($size * 0.92));
  $radius = max(10, (int) round($size * 0.32));
  $sizeClass = $logoSize ? ' geneorx-brand--logo-'.$logoSize : '';
@endphp
<a href="{{ $href }}" class="geneorx-brand geneorx-brand--{{ $variant }}{{ $sizeClass }} {{ $class ?? '' }}" @isset($style) style="{{ $style }}" @endisset>
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
    <span class="geneorx-brandmark" style="width:{{ $size }}px;height:{{ $size }}px;border-radius:{{ $radius }}px">
      <img src="{{ \App\Support\LogoAssets::mark() }}" alt="GeneoRx" width="{{ $markSize }}" height="{{ $markSize }}">
    </span>
    @if($showName)
      <span class="geneorx-brand-name">{{ $name ?? 'GeneoRx' }}</span>
    @endif
  @endif
</a>
