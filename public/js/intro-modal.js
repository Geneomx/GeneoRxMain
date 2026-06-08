(function () {
  'use strict';

  var STORAGE_KEY = 'geneorx_intro_seen_v1';
  var modal = document.getElementById('introModal');
  if (!modal) return;

  var skipBtn = document.getElementById('introSkip');
  var prevBtn = document.getElementById('introPrev');
  var nextBtn = document.getElementById('introNext');
  var stepCounter = document.getElementById('introStepCounter');
  var viewport = document.getElementById('introCardViewport');
  var track = document.getElementById('introTrack');
  var progressSegs = Array.from(document.querySelectorAll('.intro-progress-seg'));
  var slides = track ? Array.from(track.querySelectorAll('.intro-slide')) : [];
  var total = slides.length;
  var current = 0;
  var touchStartX = 0;

  var slideThemes = [
    { accent: '#28E1FF', dark: '#1E9BB8', rgb: '40, 225, 255' },
    { accent: '#5EEBFF', dark: '#2B7A9B', rgb: '43, 122, 155' },
    { accent: '#A78BFA', dark: '#6B5B95', rgb: '107, 91, 149' },
    { accent: '#FBBF24', dark: '#C17D3A', rgb: '193, 125, 58' },
  ];

  var forceShow = new URLSearchParams(window.location.search).get('intro') === '1';

  function shouldShow() {
    if (forceShow) return true;
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return true;
    }
  }

  function markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      /* ignore */
    }
  }

  function applyTheme(index) {
    var theme = slideThemes[index] || slideThemes[0];
    var accent = document.getElementById('introPanelAccent');
    if (accent) {
      accent.style.background = 'linear-gradient(90deg, ' + theme.dark + ', ' + theme.accent + ')';
    }
  }

  function syncSlideLayout() {
    if (!track || !viewport || !slides.length) return;
    var width = viewport.clientWidth;
    slides.forEach(function (slide) {
      slide.style.flex = '0 0 ' + width + 'px';
      slide.style.width = width + 'px';
      slide.style.maxWidth = width + 'px';
    });
    track.style.transform = 'translateX(-' + (current * width) + 'px)';
  }

  function updateUI() {
    syncSlideLayout();

    progressSegs.forEach(function (seg, i) {
      seg.classList.toggle('active', i === current);
      seg.classList.toggle('done', i < current);
      seg.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });

    if (stepCounter) {
      stepCounter.textContent = (current + 1) + ' of ' + total;
    }

    if (prevBtn) {
      prevBtn.disabled = current <= 0;
    }

    if (nextBtn) {
      nextBtn.innerHTML = current >= total - 1
        ? 'Explore GeneoRx <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
        : 'Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    }

    applyTheme(current);
  }

  function goToStep(nextStep) {
    if (nextStep < 0 || nextStep >= total || nextStep === current) return;
    current = nextStep;
    updateUI();
  }

  function openModal() {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('intro-open');
    requestAnimationFrame(function () {
      modal.classList.add('intro-modal--visible');
    });
    updateUI();
    if (nextBtn) nextBtn.focus();
  }

  function closeModal() {
    markSeen();
    modal.classList.remove('intro-modal--visible');
    modal.classList.add('intro-modal--closing');
    document.body.classList.remove('intro-open');

    window.setTimeout(function () {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('intro-modal--closing');
    }, 280);
  }

  function handleNext() {
    if (current >= total - 1) {
      closeModal();
      return;
    }
    goToStep(current + 1);
  }

  function handlePrev() {
    if (current > 0) goToStep(current - 1);
  }

  if (skipBtn) skipBtn.addEventListener('click', closeModal);
  if (nextBtn) nextBtn.addEventListener('click', handleNext);
  if (prevBtn) prevBtn.addEventListener('click', handlePrev);

  progressSegs.forEach(function (seg) {
    seg.addEventListener('click', function () {
      var stepIndex = parseInt(seg.getAttribute('data-step'), 10);
      if (!Number.isNaN(stepIndex)) goToStep(stepIndex);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'ArrowRight') handleNext();
    else if (e.key === 'ArrowLeft') handlePrev();
  });

  if (viewport) {
    viewport.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', function (e) {
      var delta = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(delta) < 50) return;
      if (delta < 0) handleNext();
      else handlePrev();
    }, { passive: true });
  }

  var replayLink = document.getElementById('replayIntro');
  if (replayLink) {
    replayLink.addEventListener('click', function (e) {
      e.preventDefault();
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        /* ignore */
      }
      window.location.href = window.location.pathname + '?intro=1';
    });
  }

  if (viewport) {
    window.addEventListener('resize', function () {
      if (!modal.hidden) updateUI();
    });
  }

  if (shouldShow()) {
    openModal();
  } else {
    updateUI();
  }
})();
