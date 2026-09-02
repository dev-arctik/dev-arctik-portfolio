/*
  assets/js/sketch.js
  The hand-drawn rendering engine. Draws rough SVG shapes behind real DOM elements so
  every box keeps normal text, layout and accessibility while looking pen-drawn.
  Jitter is seeded per element, so a redraw on resize reproduces the same wobble
  instead of the whole page twitching on every reflow.
*/

const Sketch = (() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const BLEED = 12;              // px the overlay overflows its host, so strokes never clip
  const observed = new WeakSet();

  /* ---------------- geometry primitives ---------------- */

  // mulberry32 — tiny deterministic PRNG. Each element owns a stable wobble.
  function seeded(seed) {
    let s = seed | 0;
    return function () {
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // One pen stroke between two points: a bowed cubic with both ends and controls nudged.
  function stroke(x1, y1, x2, y2, rand, amp) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const k = amp * Math.min(1.6, 0.5 + len / 280);
    const j = () => (rand() * 2 - 1) * k;
    const c1x = x1 + (x2 - x1) * 0.32, c1y = y1 + (y2 - y1) * 0.32;
    const c2x = x1 + (x2 - x1) * 0.68, c2y = y1 + (y2 - y1) * 0.68;
    return `M ${x1 + j()} ${y1 + j()} C ${c1x + j()} ${c1y + j()}, ${c2x + j()} ${c2y + j()}, ${x2 + j()} ${y2 + j()}`;
  }

  // A rectangle drawn as four strokes, twice over. The double pass is what reads as pen.
  function roughRect(x, y, w, h, rand, amp, passes) {
    // Corners are pulled in slightly so lines overshoot at the joins, like a real hand.
    const nudge = () => amp * 1.5 * rand();
    let d = '';
    for (let p = 0; p < passes; p++) {
      const ax = x + nudge(), ay = y + nudge();
      const bx = x + w - nudge(), by = y + nudge();
      const cx = x + w - nudge(), cy = y + h - nudge();
      const dx = x + nudge(), dy = y + h - nudge();
      d += stroke(ax, ay, bx, by, rand, amp) + ' ';
      d += stroke(bx, by, cx, cy, rand, amp) + ' ';
      d += stroke(cx, cy, dx, dy, rand, amp) + ' ';
      d += stroke(dx, dy, ax, ay, rand, amp) + ' ';
    }
    return d.trim();
  }

  // Closed rough rectangle for fills — single pass, no overshoot, so the fill stays tidy.
  function roughRectClosed(x, y, w, h, rand, amp) {
    const j = () => (rand() * 2 - 1) * amp;
    return `M ${x + j()} ${y + j()} L ${x + w + j()} ${y + j()} L ${x + w + j()} ${y + h + j()} L ${x + j()} ${y + h + j()} Z`;
  }

  // Wobbly ellipse built from 4 arc-ish cubics with jittered radii per quadrant.
  function roughEllipse(cx, cy, rx, ry, rand, amp, passes) {
    const K = 0.5523;
    let d = '';
    for (let p = 0; p < passes; p++) {
      const j = () => (rand() * 2 - 1) * amp;
      const t = cy - ry + j(), b = cy + ry + j(), l = cx - rx + j(), r = cx + rx + j();
      const ox = rx * K, oy = ry * K;
      d += `M ${cx + j()} ${t}`;
      d += ` C ${cx + ox + j()} ${t}, ${r} ${cy - oy + j()}, ${r} ${cy + j()}`;
      d += ` C ${r} ${cy + oy + j()}, ${cx + ox + j()} ${b}, ${cx + j()} ${b}`;
      d += ` C ${cx - ox + j()} ${b}, ${l} ${cy + oy + j()}, ${l} ${cy + j()}`;
      d += ` C ${l} ${cy - oy + j()}, ${cx - ox + j()} ${t}, ${cx + j()} ${t} `;
    }
    return d.trim();
  }

  // Marker squiggle: a chain of quadratics wandering around a baseline.
  function squiggle(w, y, rand, amp, step) {
    const steps = Math.max(3, Math.round(w / step));
    let d = `M 0 ${y}`;
    for (let s = 1; s <= steps; s++) {
      const x = (w / steps) * s;
      const px = x - (w / steps) / 2;
      d += ` Q ${px} ${y + (rand() * 2 - 1) * amp * 1.7}, ${x} ${y + (rand() * 2 - 1) * amp}`;
    }
    return d;
  }

  /* ---------------- svg plumbing ---------------- */

  function path(d, opts) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', opts.fill || 'none');
    if (opts.stroke) {
      p.setAttribute('stroke', opts.stroke);
      p.setAttribute('stroke-width', opts.width);
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
    }
    if (opts.opacity) p.setAttribute('opacity', opts.opacity);
    return p;
  }

  function surface(el, w, h) {
    let svg = el.querySelector(':scope > svg.sketch');
    if (!svg) {
      svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('class', 'sketch');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('preserveAspectRatio', 'none');
      el.prepend(svg);
    }
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.textContent = '';
    return svg;
  }

  let seedCounter = 0;
  function seedOf(el) {
    if (el.dataset.seed === undefined) el.dataset.seed = String(++seedCounter * 7919 + 13);
    return Number(el.dataset.seed) + Number(el.dataset.salt || 0);
  }

  // The host's own surface colour, or null when it has none to repaint (fully
  // transparent hosts want the paper showing through, shadow and all).
  function opaqueBackground(el) {
    const bg = getComputedStyle(el).backgroundColor;
    if (!bg || bg === 'transparent') return null;
    const alpha = bg.startsWith('rgba(') ? Number(bg.split(',')[3]) : 1;
    return alpha === 0 ? null : bg;
  }

  /* ---------------- variants ---------------- */

  function drawBox(el, r) {
    const w = r.width + BLEED * 2, h = r.height + BLEED * 2;
    const svg = surface(el, w, h);
    const seed = seedOf(el);

    // Small controls need a finer line or they turn into scribble; large cards can be loose.
    const small = Math.min(r.width, r.height) < 56;
    const amp = small ? 1.5 : 2.1;
    const sw = Number(el.dataset.weight) || (small ? 1.9 : 2.4);

    // Filled offset shadow, not a second outline — an outline copy reads as a doubled border.
    if (el.dataset.shadow !== 'off') {
      const off = small ? 3.5 : 6;
      svg.appendChild(path(
        roughRectClosed(BLEED + off, BLEED + off, r.width, r.height, seeded(seed + 977), amp),
        { fill: 'var(--ink)', opacity: small ? 0.16 : 0.22 }
      ));
    }

    /* The surface has to be repainted inside the SVG, above the shadow. The overlay is a
       child of the host, so it stacks above the host's own CSS background — and the
       shadow, offset by only `off` px, therefore covers 98% of the face it was meant to
       sit behind, washing every card 22% toward ink. Painting the surface back over it
       leaves just the offset sliver showing, which is the shadow the code above intends.
       Falls back to the host's computed background so the CSS stays the single source of
       truth for colour, and so the no-JS fallback still paints the same surface. */
    const fill = el.dataset.fill || opaqueBackground(el);
    if (fill) {
      svg.appendChild(path(
        roughRectClosed(BLEED, BLEED, r.width, r.height, seeded(seed + 31), amp),
        { fill: fill }
      ));
    }

    svg.appendChild(path(
      roughRect(BLEED, BLEED, r.width, r.height, seeded(seed), amp, 2),
      { stroke: el.dataset.ink || 'var(--ink)', width: sw }
    ));
  }

  function drawDot(el, r) {
    const w = r.width + BLEED * 2, h = r.height + BLEED * 2;
    const svg = surface(el, w, h);
    const rand = seeded(seedOf(el));
    const cx = w / 2, cy = h / 2;
    const rx = r.width / 2, ry = r.height / 2;
    svg.appendChild(path(roughEllipse(cx, cy, rx, ry, seeded(seedOf(el) + 5), 1.1, 1), { fill: 'var(--paper)' }));
    svg.appendChild(path(roughEllipse(cx, cy, rx, ry, rand, 1.1, 2), { stroke: el.dataset.ink || 'var(--accent)', width: 2.4 }));
  }

  // Vertical spine for the timeline — one long hand-drawn line.
  function drawVLine(el, r) {
    const w = r.width + BLEED * 2, h = r.height + BLEED * 2;
    const svg = surface(el, w, h);
    const rand = seeded(seedOf(el));
    // Segmented so a tall line wanders naturally instead of bowing once from end to end.
    const segs = Math.max(2, Math.round(r.height / 180));
    let d = '';
    for (let s = 0; s < segs; s++) {
      const y1 = BLEED + (r.height / segs) * s;
      const y2 = BLEED + (r.height / segs) * (s + 1);
      d += stroke(w / 2, y1, w / 2, y2, rand, 2.2) + ' ';
    }
    svg.appendChild(path(d.trim(), { stroke: el.dataset.ink || 'var(--rule)', width: 2.2 }));
  }

  function drawUnderline(el, r) {
    const w = Math.max(r.width + 10, 20), h = 14;
    const svg = surface(el, w, h);
    const p = path(squiggle(w, 7, seeded(seedOf(el)), 2.4, 13), {
      stroke: el.dataset.ink || 'var(--accent)', width: 2.6
    });
    svg.appendChild(p);
    // Measured length drives the draw-on animation — guessing it makes the timing wrong.
    p.style.setProperty('--len', p.getTotalLength());
  }

  const VARIANTS = { box: drawBox, dot: drawDot, vline: drawVLine, underline: drawUnderline };

  /* ---------------- public ---------------- */

  /* Measure the untransformed layout box. getBoundingClientRect() returns the
     post-transform bounding box, which is larger for anything rotated — the tilted
     cards and polaroid were drawing their frames several px oversized. */
  function measure(el) {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (w && h) return { width: w, height: h };
    const r = el.getBoundingClientRect();   // inline/SVG hosts have no offset box
    return { width: r.width, height: r.height };
  }

  function drawEl(el) {
    const r = measure(el);
    if (!r.width || !r.height) return;
    (VARIANTS[el.dataset.sketch] || drawBox)(el, r);
    // Hands layout back to CSS: the fallback border goes transparent once ink exists.
    el.setAttribute('data-drawn', '');
  }

  // Resize can fire in bursts (window drag, mobile URL bar). Coalesce into one frame.
  let queue = new Set(), frame = null;
  function schedule(el) {
    queue.add(el);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const batch = queue; queue = new Set();
      batch.forEach(drawEl);
    });
  }

  function redraw() { document.querySelectorAll('[data-sketch]').forEach(schedule); }

  function init() {
    const els = document.querySelectorAll('[data-sketch]');
    els.forEach(drawEl);

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => entries.forEach(e => schedule(e.target)));
      els.forEach(el => { if (!observed.has(el)) { observed.add(el); ro.observe(el); } });
    }

    // Webfonts change text metrics, which changes box sizes. Redraw once they land.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  }

  return { init, redraw, drawEl, seeded, squiggle };
})();
