@include('partials.intro-slides-data')

<div id="introModal" class="intro-modal" hidden aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="introModalTitle">
  <div class="intro-backdrop" id="introBackdrop"></div>

  <div class="intro-panel-wrap">
    <div class="intro-panel" id="introSheet">
      <div class="intro-panel-accent" id="introPanelAccent" aria-hidden="true"></div>

      <header class="intro-header">
        @include('partials.geneorx-brand', ['variant' => 'full', 'logoSize' => 'intro', 'showName' => false, 'href' => route('home')])
        <button type="button" class="intro-skip" id="introSkip">Skip tour</button>
      </header>

      <div class="intro-progress" id="introDots" role="tablist" aria-label="Intro slides">
        @foreach ($introSlides as $i => $slide)
          <button type="button"
                  class="intro-progress-seg{{ $i === 0 ? ' active' : '' }}"
                  data-step="{{ $i }}"
                  role="tab"
                  aria-selected="{{ $i === 0 ? 'true' : 'false' }}"
                  aria-label="{{ $slide['tab_aria'] }}"></button>
        @endforeach
      </div>

      <div class="intro-viewport" id="introCardViewport">
        <div class="intro-track" id="introTrack">
          @foreach ($introSlides as $i => $slide)
            <article class="intro-slide intro-slide--{{ $slide['theme'] }}{{ $slide['accent'] ? ' intro-slide--accent' : '' }}"
                     data-step="{{ $i }}"
                     @if ($i === 0) id="introModalTitle" @endif>
              <div class="intro-slide-icon" aria-hidden="true">
                @include('partials.hero-slide-icon', ['theme' => $slide['theme']])
              </div>
              <span class="intro-slide-tag">{{ $slide['tag'] }}</span>
              <h2 class="intro-slide-title">{{ $slide['title'] }}</h2>

              <div class="intro-slide-content">
                @if ($i === 1)
                  <p>{{ $slide['paragraphs'][0] ?? '' }}</p>
                  <ul>
                    @foreach ($slide['bullets'] as $bullet)
                      <li>{{ $bullet }}</li>
                    @endforeach
                  </ul>
                  <p>{{ $slide['paragraphs'][1] ?? '' }}</p>
                @elseif ($i === 2)
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
          @endforeach
        </div>
      </div>

      <footer class="intro-footer">
        <button type="button" class="intro-nav-btn intro-nav-btn--ghost" id="introPrev" disabled aria-label="Previous slide">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <span class="intro-step-counter" id="introStepCounter">1 of {{ count($introSlides) }}</span>
        <button type="button" class="intro-nav-btn intro-nav-btn--primary" id="introNext">
          Continue
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </footer>
    </div>
  </div>
</div>
