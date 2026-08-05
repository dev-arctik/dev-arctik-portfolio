/*
  assets/js/main.js
  Page wiring: boots the sketch engine, reveals sections on scroll, and re-rolls the
  border wobble on hover so interactive elements look redrawn rather than transformed.
*/

(function () {
  'use strict';

  /* Gate the scroll-reveal on this script actually running. Set here rather than in an
     inline <head> script: if main.js fails to load, .js is never added and every section
     stays visible instead of being hidden by a fade that will never fire. Scripts at the
     end of <body> execute before first paint, so there's no flash. */
  document.documentElement.classList.add('js');

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Sketch.init();

  /* Scroll reveal. Sections fade up once; the observer unhooks itself after firing. */
  if ('IntersectionObserver' in window && !calm) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  /* Hover re-roll: a new seed means a genuinely different stroke, not a CSS transform. */
  if (!calm) {
    document.querySelectorAll('.card, .btn, .contact-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        el.dataset.salt = String((Number(el.dataset.salt || 0) + 1571) % 100000);
        Sketch.drawEl(el);
      });
    });
  }

  /* Journey glyphs. Measure every stroke so CSS can draw it on, then reveal per entry
     as it scrolls in. Measuring here rather than hard-coding lengths keeps the timing
     right if a path is ever edited. */
  const tlItems = [...document.querySelectorAll('.tl-item')];
  tlItems.forEach(item => {
    item.querySelectorAll('.glyph path').forEach(p => {
      p.style.setProperty('--len', p.getTotalLength());
    });
  });

  if (calm || !('IntersectionObserver' in window)) {
    /* No animation wanted or available — show them drawn. The class still has to be
       added: without it the paths sit at dashoffset --len, which is invisible. */
    tlItems.forEach(item => item.classList.add('in-view'));
  } else {
    const glyphIo = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.25 });
    tlItems.forEach(item => glyphIo.observe(item));
  }

  /* The spine draws downward in step with the scroll, so the line reaches "now" exactly
     as the last entry does. Skipped under reduced motion, where sketch.js's fully drawn
     line is left alone. */
  if (!calm) {
    const spine = document.querySelector('.spine');
    let spinePath = null, spineLen = 0, queued = false;

    function paintSpine() {
      queued = false;
      if (!spine) return;
      const p = spine.querySelector('path');
      if (!p) return;
      /* sketch.js replaces this path on every redraw, so re-measure on identity change
         rather than caching once. */
      if (p !== spinePath) {
        spinePath = p;
        spineLen = p.getTotalLength();
        p.style.strokeDasharray = spineLen;
      }
      const rect = spine.getBoundingClientRect();
      const anchor = window.innerHeight * 0.72;   // ink keeps pace just below mid-screen
      const t = (anchor - rect.top) / Math.max(1, rect.height);
      spinePath.style.strokeDashoffset = spineLen * (1 - Math.min(1, Math.max(0, t)));
    }

    function queueSpine() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(paintSpine);
    }

    window.addEventListener('scroll', queueSpine, { passive: true });
    window.addEventListener('resize', queueSpine);
    /* Webfonts land after init and make sketch.js redraw, which swaps the path out. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueSpine);
    paintSpine();
  }

  /* Mark the current section in the nav as you scroll past it. */
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }
})();
