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
