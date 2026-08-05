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

  /* Reveal. [data-anim] elements arrive as they reach the viewport; a [data-anim-group]
     releases its children together on a stagger so a row of cards reads as one gesture.
     data-anim-step sets the stagger in ms. */
  const animGroups = [...document.querySelectorAll('[data-anim-group]')];
  const animSolo = [...document.querySelectorAll('[data-anim]')]
    .filter(el => !el.closest('[data-anim-group]'));

  animGroups.forEach(group => {
    const step = Number(group.dataset.animStep) || 70;
    [...group.querySelectorAll('[data-anim]')].forEach((el, i) => {
      el.style.setProperty('--d', (i * step) + 'ms');
    });
  });

  /* Glyph strokes are measured rather than hard-coded so the draw-on timing stays right
     if a path is ever edited. */
  document.querySelectorAll('.glyph path').forEach(p => {
    p.style.setProperty('--len', p.getTotalLength());
  });

  function release(el) {
    el.classList.add('in-view');
    el.querySelectorAll('[data-anim]').forEach(child => child.classList.add('in-view'));
  }

  if (calm || !('IntersectionObserver' in window)) {
    /* No animation wanted or available. .anim is deliberately never set, so nothing is
       hidden to begin with; .in-view is still applied because the glyph paths need it to
       reach dashoffset 0. */
    [...animGroups, ...animSolo].forEach(release);
  } else {
    /* Switch the hidden start state on here, in the same block that wires up the observer
       that clears it. Anything that hides content must be applied by the code able to
       reveal it, or a cached older build of this file leaves whole sections blank. */
    document.documentElement.classList.add('anim');

    const revealIo = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        release(entry.target);
        obs.unobserve(entry.target);
      });
      /* Fires once a tenth of the target has cleared the bottom 12% of the viewport —
         early enough that the movement is underway before it reaches the reading line. */
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    [...animGroups, ...animSolo].forEach(el => revealIo.observe(el));
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
