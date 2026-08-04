# dev-arctik portfolio

A static, hand-drawn portfolio. No build step, no backend, no dependencies — open `index.html` and it works.

The aesthetic is **hybrid**: hand-drawn chrome (frames, buttons, underlines, annotations) over clean, readable content (sans body text, mono for code). That split is deliberate — full handwritten body text hurts readability and reads as unserious to enterprise visitors.

## Structure

```
index.html              the whole page — hero, work, journey, toolkit, contact
assets/
  css/style.css         all styling, organised in numbered sections
  js/sketch.js          the hand-drawn rendering engine
  js/main.js            page wiring — reveal on scroll, hover redraw, nav scrollspy
  img/                  your photo and og image go here
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

## What to change before publishing

Search the HTML for `SWAP` — every placeholder is marked. In order of importance:

1. **`you@example.com`** in the contact section — currently a placeholder, not a real address.
2. **The three project cards** — names, descriptions, and the yellow `.result` chips are invented. Replace with real projects and real numbers. The numbers matter most: a sketchy site with vague copy reads as hiding behind style.
3. **The four timeline entries** — placeholder milestones. Replace with your actual progression.
4. **Your photo** — drop it at `assets/img/me.jpg` and uncomment the `<img>` inside `.polaroid`.
5. **`og:url`** and a 1200×630 `assets/img/og.png` for link previews.
6. **The toolkit tags** — trim anything you wouldn't want to be asked about in an interview.

Colours, fonts and spacing all live as CSS custom properties at the top of `style.css`.

## Running locally

Opening `index.html` directly works. For a local server:

```bash
python3 -m http.server 8000
```

## Deploying

It's static, so anything works — Netlify drop, Vercel, GitHub Pages, Cloudflare Pages. For GitHub Pages: push to a repo, then Settings → Pages → deploy from branch root.

## Known trade-offs

- **Handwritten display font** is less readable than a sans. Kept to headings, annotations and short labels only. If you add long-form writing later, keep it in the body sans.
- **No dark mode.** The paper aesthetic doesn't have a good dark counterpart — dark paper reads as chalkboard, which is a different design language.
- **Product screenshots** will need a frame treatment (the polaroid pattern) or they'll look pasted into the doodles.
- **Sketch cost** is proportional to the number of `data-sketch` elements. At this size it's nothing; if the page grows past a few hundred, draw on scroll-into-view instead of on init.
