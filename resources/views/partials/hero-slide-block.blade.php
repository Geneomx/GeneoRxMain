<article class="hero-info-block hero-info-{{ $slide['theme'] }}" data-step="{{ $index }}">
  <div class="hero-slide-meta">
    <span class="hero-slide-tag">{{ $slide['tag'] }}</span>
    <span class="hero-slide-counter">{{ $slide['num'] }} <span class="hero-slide-counter-sep">/</span> {{ str_pad((string) count($introSlides), 2, '0', STR_PAD_LEFT) }}</span>
  </div>

  <div class="hero-slide-title-row">
    <span class="hero-info-icon" aria-hidden="true">
      @include('partials.hero-slide-icon', ['theme' => $slide['theme']])
    </span>
    <h3>{{ $slide['title'] }}</h3>
  </div>

  <div class="hero-slide-body">
    @if ($index === 1)
      <p>{{ $slide['paragraphs'][0] ?? '' }}</p>
      <ul>
        @foreach ($slide['bullets'] as $bullet)
          <li>{{ $bullet }}</li>
        @endforeach
      </ul>
      <p>{{ $slide['paragraphs'][1] ?? '' }}</p>
    @elseif ($index === 2)
      <ul>
        @foreach ($slide['bullets'] as $bullet)
          <li><strong>{{ $bullet['strong'] }}</strong>{{ $bullet['text'] }}</li>
        @endforeach
      </ul>
    @else
      @foreach ($slide['paragraphs'] as $paragraph)
        <p>{{ $paragraph }}</p>
      @endforeach
    @endif
  </div>
</article>
