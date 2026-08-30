# dev-arctik portfolio

**Live:** https://dev-arctik.github.io/dev-arctik-portfolio/

My personal portfolio — one page covering the AI agent work I do, the projects behind it, and how to reach me. It's a static site with no build step, no backend and no dependencies: open `index.html` and it works. Everything hand-drawn on the page is rendered at runtime by a small SVG sketch engine, not exported as images.

The aesthetic is **hybrid**: hand-drawn chrome (frames, buttons, underlines, annotations) over clean, readable content (sans body text, mono for code). That split is deliberate — full handwritten body text hurts readability and reads as unserious to enterprise visitors.

## Structure

```
index.html              the whole page — hero, work, learning, journey, toolkit, contact
404.html                error page — same look, sketch engine only, absolute asset paths
robots.txt              points crawlers at the sitemap
sitemap.xml             one entry; bump lastmod when the copy changes
assets/
  css/style.css         all styling, organised in numbered sections
  js/sketch.js          the hand-drawn rendering engine
  js/main.js            page wiring — reveal on scroll, hash correction, hover redraw, scrollspy
  img/                  photo, work screenshots, favicon.svg — og image still to come
docs/overview.md        the living reference: design system, architecture, backlog
```

## How the hand-drawn look works

`sketch.js` draws rough SVG shapes into an overlay behind each element marked `data-sketch`. The element keeps its normal box, text and layout — nothing is an image, everything stays selectable and screen-reader friendly.

Jitter is **seeded per element**, so a redraw on resize reproduces the same wobble instead of the whole page twitching on every reflow.

| Attribute | Effect |
|---|---|
| `data-sketch` | rough rectangle (default) |
| `data-sketch="dot"` | wobbly circle — timeline markers |
| `data-sketch="vline"` | vertical hand-drawn line — timeline spine |
| `data-sketch="underline"` | marker squiggle that draws on hover — nav links |
| `data-fill="var(--x)"` | fill the shape (buttons). Wrap the label in a `<span>` or the fill covers it |
| `data-ink="var(--x)"` | stroke colour |
| `data-shadow="off"` | drop the offset shadow |
| `data-weight="3"` | stroke width override |

To sketch a new element, add `data-sketch` and make sure any bare text inside is wrapped in an element — bare text nodes can't be lifted above the overlay.

### Fallbacks

- **No JS** → CSS elliptical-radius borders show instead. Nothing renders unbordered.
- **No JS + scroll reveal** → the `.js` class gates the fade-up, so sections are never left invisible.
- **`prefers-reduced-motion`** → transitions and hover redraws are disabled.
- **Print** → overlays hidden, plain borders used.

## The content

Copy is real, not placeholder. The timeline and toolkit come from the actual GitHub contribution history. The `.result` chips deliberately carry **durable** claims only — "in production", "sole author", "fits in 4 GB VRAM" — never commit counts or anything else that decays; two commit figures had already drifted into contradicting each other before they were removed. Nothing on the page should need scheduled maintenance to stay true. Each work card was written from that project's own `docs/` folder rather than its README.

Deliberately left out of the public copy: personal figures from the Hundi tracker docs (real income and spending totals), and the client's Stripe pricing tiers and production server address from the Mediator Gabby deployment docs. Keep it that way if you extend these cards.

The four work cards are Mediator Gabby (Better Parenting Plan), Hundi, Maya and `remotion-video-mcp`. Only the last is public, so it's the only card with a source link — the rest describe the work instead. Gabby is the `.featured` card: it spans the full row and carries a real screenshot of the mediator comparison view, captured against seeded test data only.

`.cards` uses `auto-fit minmax(300px, 1fr)` so the three non-featured cards land in one row. Column count is `floor((C + gap) / (min + gap))` against the wrap's **content** box — 1080px max-width less 48px padding, so 1032px, not 1080. Check that maths if you add or remove cards; `.learn-grid` uses a larger 340px minimum for the same reason, to land its four items 2×2.

### Still to do

1. **Share image** — `og:url` now points at the live GitHub Pages address, but `og:image` still reuses the avatar (`assets/img/me.jpg`). A purpose-made 1200×630 `assets/img/og.png` would preview far better in Slack, LinkedIn and iMessage.
2. **Outcome numbers** — the `.result` chips currently carry authorship facts (commit counts, team size). Real product outcomes — mediators onboarded, sessions run — would hit harder if you can share them.
3. **The hero photo** is the GitHub avatar, a cartoon rather than a real photo. `.polaroid .shot img` crops it hard right to cut off leftover lettering baked into the artwork — if you swap in a real photo, drop that `object-position` override.

Colours, fonts and spacing all live as CSS custom properties at the top of `style.css`.

## Running locally

Opening `index.html` directly works. For a local server:

```bash
python3 -m http.server 8000
```

**Bump `?v=` in `index.html` whenever you edit `style.css` or a JS file.** There's no build step to hash filenames, and browsers cache CSS and JS independently — without it a returning visitor can run a new stylesheet against an old script. `http.server` in particular sends no `Cache-Control` at all, so it will happily serve you a stale script for hours and make an edit look like it did nothing.

## Deploying

It's static, so anything works — Netlify drop, Vercel, GitHub Pages, Cloudflare Pages. For GitHub Pages: push to a repo, then Settings → Pages → deploy from branch root.

## Known trade-offs

- **Handwritten display font** is less readable than a sans. Kept to headings, annotations and short labels only. If you add long-form writing later, keep it in the body sans.
- **No dark mode.** The paper aesthetic doesn't have a good dark counterpart — dark paper reads as chalkboard, which is a different design language.
- **Product screenshots** will need a frame treatment (the polaroid pattern) or they'll look pasted into the doodles.
- **Sketch cost** is proportional to the number of `data-sketch` elements. At this size it's nothing; if the page grows past a few hundred, draw on scroll-into-view instead of on init.
