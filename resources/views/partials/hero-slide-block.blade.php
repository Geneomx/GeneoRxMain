<article class="hero-info-block hero-info-{{ $slide['theme'] }}" data-step="{{ $index }}">
  <div class="hero-slide-meta">
    <span class="hero-slide-tag" data-i18n="slide.{{ $index }}.tag">{{ $slide['tag'] }}</span>
    <span class="hero-slide-counter">{{ $slide['num'] }} <span class="hero-slide-counter-sep">/</span> {{ str_pad((string) count($introSlides), 2, '0', STR_PAD_LEFT) }}</span>
  </div>

  <div class="hero-slide-title-row">
    <span class="hero-info-icon" aria-hidden="true">
      @include('partials.hero-slide-icon', ['theme' => $slide['theme']])
    </span>
    <h3 data-i18n="slide.{{ $index }}.title">{{ $slide['title'] }}</h3>
  </div>

  <div class="hero-slide-body">
    @if ($index === 1)
      <p data-i18n="slide.1.p0">{{ $slide['paragraphs'][0] ?? '' }}</p>
      <ul>
        @foreach ($slide['bullets'] as $bi => $bullet)
          <li data-i18n="slide.1.b{{ $bi }}">{{ $bullet }}</li>
        @endforeach
      </ul>
      <p data-i18n="slide.1.p1">{{ $slide['paragraphs'][1] ?? '' }}</p>
    @elseif ($index === 2)
      <ul>
        @foreach ($slide['bullets'] as $bi => $bullet)
          <li data-i18n="slide.2.b{{ $bi }}">{{ $bullet['strong'] }}{{ $bullet['text'] }}</li>
        @endforeach
      </ul>
    @else
      @foreach ($slide['paragraphs'] as $pi => $paragraph)
        <p data-i18n="slide.{{ $index }}.p{{ $pi }}">{{ $paragraph }}</p>
      @endforeach
    @endif
  </div>
</article>
