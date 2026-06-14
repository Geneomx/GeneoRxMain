@php
  $size = $size ?? 36;
  $showName = $showName ?? true;
  $href = $href ?? route('home');
  $markSize = max(28, (int) round($size * 0.92));
  $radius = max(10, (int) round($size * 0.32));
@endphp
<a href="{{ $href }}" class="geneorx-brand {{ $class ?? '' }}" @isset($style) style="{{ $style }}" @endisset>
  <span class="geneorx-brandmark" style="width:{{ $size }}px;height:{{ $size }}px;border-radius:{{ $radius }}px">
    <img src="{{ \App\Support\LogoAssets::mark() }}" alt="GeneoRx" width="{{ $markSize }}" height="{{ $markSize }}">
  </span>
  @if($showName)
    <span class="geneorx-brand-name">{{ $name ?? 'GeneoRx' }}</span>
  @endif
</a>
