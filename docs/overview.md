# dev-arctik Portfolio - Project Overview

## Background

This is the personal portfolio site for Devansh Raj (GitHub: [dev-arctik](https://github.com/dev-arctik)), a single-page static site covering his AI agent engineering work, the projects behind it, and how to reach him.

**The Problem:** A generic developer portfolio — templated hero, bullet-point project list, stock icons — reads as interchangeable with every other portfolio a hiring manager or client scrolls past. It signals competence at best, never memorability, and it does nothing to demonstrate the kind of product craft the owner actually does for a living.

**The Solution:** A hand-drawn aesthetic rendered live in the browser (not exported images) layered over genuinely readable, factual content. The sketch treatment is the differentiator — a visitor who inspects the page finds an actual small rendering engine (`assets/js/sketch.js`) rather than a background image, which is itself a demonstration of engineering taste for the audience that would check.

**Goal:** Convert a page visit into a conversation — either a recruiter/hiring manager shortlisting the owner, or a non-technical client with "a rough idea of the shape" reaching out (see the contact section copy, `index.html:322`).

**Platform:** Static HTML/CSS/vanilla JS site. No framework, no build step, no bundler, no backend, no package manager. Total asset footprint ~224 KB. Confirmed by `README.md:5`: "open `index.html` and it works."

**Launch Strategy:** Already live, single continuous deployment — no phased rollout or geographic targeting. Live at https://dev-arctik.github.io/dev-arctik-portfolio/.

---

## Who This Is For

This isn't a multi-role product, so there's no user-roles table in the traditional sense. Instead the whole page is written for three overlapping audiences reading the same content differently, and nearly every content and design decision on the page exists to satisfy one of them without alienating the other two.

| Audience | What they're scanning for | Where the page answers it |
|---|---|---|
| **Engineers / technical reviewers** | Real stack, real architecture decisions, whether the person actually wrote the code | Toolkit section (`index.html:256-316`), the specific technical detail in each work card ("LangGraph and FastAPI underneath", `index.html:99`), the sketch engine itself as an artifact worth inspecting |
| **Recruiters / hiring managers** | Fast signal: what does this person do, is it current, is it verifiable | Hero one-liner (`index.html:57`), "Selected work" framing (`index.html:80`), the journey timeline showing a coherent trajectory rather than a resume dump |
| **Non-technical clients** | Can this person translate a vague problem into something that ships, without the jargon getting in the way | Hero copy about "turning what a client is actually asking for into something that ships" (`index.html:57`), the freelancing timeline entry about sitting in that conversation (`index.html:226-227`), the direct contact-section pitch (`index.html:322`) |

### Why the split matters

The three audiences pull in opposite directions on tone: an engineer wants specifics and gets suspicious of marketing language; a non-technical client gets lost in specifics and wants plain outcomes; a recruiter wants both, fast, without reading closely. The site resolves this by using **register, not separate content** — the same four work cards carry a plain-English opening line (client-readable) followed by a technical detail (engineer-readable), e.g. the Mediator Gabby card opens with "Separating parents each talk things through alone with the agent, in their own private room" (`index.html:98`) before dropping to "Thirteen topics, two scoped rooms, LangGraph and FastAPI underneath" (`index.html:99`). There's no toggle, no separate technical page — one paragraph does both jobs.

This is also why the `.result` chips (`index.html:100`, `:110`, `:118`, `:125`) were deliberately changed away from commit counts this session (commit `dde72c0`, "Replace decaying stats in the copy with durable claims") — a number like "47 commits" is legible to an engineer skimming GitHub but meaningless (and decaying, since it's frozen at write time) to the other two audiences. The current chips ("in production", "sole author", "fits in 4 GB VRAM", "public on GitHub") read the same to all three.

---

## Design System

### Palette

All tokens live as CSS custom properties at `assets/css/style.css:12-31` (Section 1, "Tokens"). The palette is a "paper and ink" metaphor: warm off-white paper, near-black ink, two accent inks (marker orange, ballpoint blue), one highlighter yellow.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#f7f4ec` | Page background |
| `--paper-card` | `#fffdf8` | Card/surface background — slightly whiter than the page paper |
| `--ink` | `#1c1b18` | Headings, primary strokes |
| `--ink-soft` | `#56514a` | Body text |
| `--rule` | `#b8b1a4` | Timeline spine default stroke |
| `--accent` | `#e2552a` | Marker orange — decoration only (kickers, year labels, logo mark) |
| `--accent-deep` | `#c2431d` | Darkened accent for anything carrying text (links, primary button) |
| `--accent-2` | `#2d6e8e` | Ballpoint blue — glyph strokes, kicker labels, focus ring |
| `--highlight` | `#ffe27a` | Marker-swipe highlight (`<mark>`, `.result` chip background) |
| `--grid` | `rgba(28,27,24,0.05)` | Faint notebook ruling on the body background |

**Contrast is audited, not incidental** (verified this session, not a problem area to revisit):

| Pairing | Ratio | WCAG level |
|---|---|---|
| Body text (`--ink-soft` on `--paper`) | 7.15:1 | AAA |
| Kicker (`--accent-2` on `--paper-card`) | 5.53:1 | AA |
| Result strip (`--ink` on `--highlight`) | 13.46:1 | AAA |

The in-file comment at `style.css:16` ("7:1 on paper — passes AA and AAA for body text") is the rounded version of the same figure; treat 7.15:1 as the precise number if this ever needs re-citing.

### Typography

Four families, each with one job, declared at `style.css:24-27` and loaded from Google Fonts at `index.html:23-25`:

| Font | Token | Role |
|---|---|---|
| Architects Daughter | `--font-display` | Headings (`h1`–`h4`), buttons, logo, timeline year labels — the "handwritten chrome" |
| Karla | `--font-body` | Body copy — the readable layer |
| Caveat | `--font-note` | Margin-note style elements: eyebrow, kicker, tags heading, footer |
| System mono stack | `--font-mono` | `<code>` and the `.result` chips |

### The hybrid rationale

`README.md:7` states it directly: "hand-drawn chrome (frames, buttons, underlines, annotations) over clean, readable content (sans body text, mono for code). That split is deliberate — full handwritten body text hurts readability and reads as unserious to enterprise visitors." Concretely: `h1`–`h4` and interactive chrome use `--font-display`, but every `<p>` uses `--font-body` (Karla) — checked at `style.css:66-76`. The one exception that proves the rule is `.note` and kicker text (`--font-note`, Caveat), which is intentionally short and annotation-like, never a full sentence of body prose.

---

## Architecture

### The sketch engine (`assets/js/sketch.js`)

Every element marked `data-sketch` gets a real SVG overlay drawn behind its content at runtime — nothing is a pre-rendered image. The element keeps its normal box, text and layout; the overlay is purely decorative (`aria-hidden="true"`, `sketch.js:113`) and positioned with `z-index` under the content (`style.css:133`).

```
data-sketch element
   │
   ├─ measure(el)              sketch.js:206   → untransformed {width, height}
   │                                             (offsetWidth/Height, NOT
   │                                              getBoundingClientRect — rotated
   │                                              cards would measure oversized)
   │
   ├─ seedOf(el)                sketch.js:123   → stable per-element seed
   │                                             (persisted in data-seed, so a
   │                                              resize redraw reproduces the
   │                                              same wobble, not a new one)
   │
   ├─ VARIANTS[data-sketch]     sketch.js:199   → drawBox | drawDot | drawVLine
   │                                              | drawUnderline
   │
   └─ el.setAttribute('data-drawn', '')  sketch.js:218
        → style.css:142 turns the CSS fallback border transparent
          (color only, never width — a width change would reflow the box)
```

Geometry primitives (`sketch.js:19-90`):
- `seeded(seed)` — mulberry32 PRNG, deterministic per seed
- `stroke()` — a single bowed cubic between two points, jittered
- `roughRect()` / `roughRectClosed()` — rectangle drawn twice (open, for the visible stroke) or once (closed, for shadow/fill)
- `roughEllipse()` — four jittered arc-cubics, used for `dot` markers
- `squiggle()` — a chain of quadratics, used for the nav `underline` variant

Draws are batched: `schedule()` (`sketch.js:222-231`) coalesces a burst of resize events into a single `requestAnimationFrame`, so a window drag or mobile URL-bar collapse doesn't redraw the whole page per pixel. `init()` (`sketch.js:235-246`) also wires a `ResizeObserver` per element and redraws everything once `document.fonts.ready` resolves, since webfonts change text metrics and therefore box sizes.

**No-JS fallback:** `style.css:135-142` paints a CSS elliptical-radius border on every `[data-sketch]` element immediately (zero-JS cost). Once `sketch.js` draws real ink, it sets `data-drawn`, and `style.css:142` hides the fallback border by making it transparent — never by removing it or changing its width, so nothing ever renders unbordered and the layout never shifts.

### The reveal system (`assets/js/main.js` + `style.css` Section 11)

There are two independent reveal mechanisms layered on the page, and both follow the same safety rule: **the code that hides something is the same code block that can un-hide it.**

1. **Section-level fade** (`.reveal` / `.js` / `.in`) — `main.js:10-14` adds `.js` to `<html>` as the very first line of the script. `style.css:442` only hides `.reveal` sections when `.js` is present. If `main.js` fails to load entirely, `.js` is never added, so `style.css:442`'s hiding rule never applies — every section stays visible. `main.js:20-33` then either observes each `.reveal` with an `IntersectionObserver` (adding `.in` on first intersection, then unobserving) or, if `prefers-reduced-motion` or `IntersectionObserver` are unavailable, adds `.in` to all of them immediately.

2. **Per-element reveal** (`[data-anim]` / `.anim` / `.in-view`) — this is the finer-grained one: individual headings, buttons, cards, tags animate in with type-specific motion (`lift`, `rise`, `pop`, `tilt`, `write`, `swipe` — `style.css:469-476`). Critically, `main.js:79` (`document.documentElement.classList.add('anim')`) sits in the **same conditional branch** as the `IntersectionObserver` that later clears it (`main.js:81-91`). The comment at `style.css:452-454` explains why this matters: "Never gate a hidden state on `.js`: that class is set by every build of main.js ever shipped, so an older cached script would apply the hiding with nothing able to clear it and blank the section." In other words, if a future edit ever separates "set `.anim`" from "the observer that clears it" — e.g. an old cached `main.js` sets `.js` but a newer `style.css` expects `.anim` to gate something — content could get stuck invisible forever. Keeping both in the same code path is a load-bearing invariant, not a style preference.

`data-anim-group` (`main.js:52-57`) staggers its `[data-anim]` children via a `--d` custom property (in ms) so a row of cards or a group of tags animates as one gesture rather than four unrelated ones.

Three more fallbacks stack on top of the JS reveal system: `prefers-reduced-motion` (`style.css:542-556`) forces every animated state to its resting/complete value; `@media print` (`style.css:558-573`) does the same, since a printed page was never scrolled through to trigger the observers; and the hover "re-roll" (`main.js:36-43`) increments a per-element `data-salt` and redraws with a genuinely new seed on `mouseenter`, rather than a CSS transform, so hover feedback looks like a fresh pen stroke.

### The scroll-drawn spine (`main.js:94-130`)

The timeline's vertical spine (`.spine`, `data-sketch="vline"`) is drawn once by `sketch.js` as a full-length hand-drawn line, then `main.js` animates its `stroke-dashoffset` on scroll so the ink appears to keep pace with the reader — `anchor = window.innerHeight * 0.72` keeps the "pen tip" just below mid-screen. It re-measures the path's length on every scroll/resize frame rather than caching once, because `sketch.js` replaces the `<path>` element itself on every redraw (font-load, resize) — caching the old node would silently stop updating.

---

## Content Model

> **Note:** a sixth section, "I keep learning" (`index.html:169`), now sits between Selected work and the journey timeline. It links the public repos where the owner learns tools in the open and shares them with colleagues — LangGraph_Learning, LangChain-Learning, Agno-Learning, neural_network_learning. It is styled deliberately lighter than `.card` so it doesn't compete with Selected work.
>
> Each entry carries a hand-drawn glyph in the left column (`.learn-glyph`, `style.css`): a two-state cycle for LangGraph, three chain links for LangChain, a flask for Agno, a layered net for the neural-network notebooks. Placement is deliberate — eye-tracking shows a vertical scan down the left edge of a content block, so a silhouette in that column is what lets someone tell the four repos apart without reading. Stroke width is set heavier in viewBox units than the timeline glyphs because these render at roughly half the scale.


The page is one document with five content sections plus a fixed header/footer. Order is deliberate: hero → work → journey → toolkit → contact, moving from "who is this" to "prove it" to "how did you get here" to "what do you actually use" to "here's how to reach me."

| Section | `index.html` lines | Persuasive job |
|---|---|---|
| **Hero** | `52-75` | One-line identity + role (`h1`, eyebrow), a lede that does double duty — states the value prop for a client ("turning what a client is actually asking for into something that ships") while name-dropping the real stack progression for an engineer. Two CTAs, "see the work" first because that's the actual ask, "get in touch" second. |
| **Work** | `77-131` | The proof. Four cards: Mediator Gabby (featured, full-row, with the only real product screenshot on the page), Hundi, Maya, `remotion-video-mcp`. Only the last is public, so it's the only card with a source link (`:126-128`) — the others describe the work in prose instead of linking to a private repo. |
| **Journey** | `133-253` | Narrative continuity, not a resume list — mechanical engineering → WordPress → Flutter → backends → agents, framed explicitly as "nothing here was a straight line" (`:137`). Each entry pairs a year, a short story, and a hand-drawn glyph literally illustrating that era (browser window, phone with a Sierpinski triangle, server + chat bubble, agent graph, two speech bubbles, a signed-off window). |
| **Toolkit** | `255-316` | The engineer-facing scan: languages, ai & agents, backend & data, apps & interfaces, ops — five tag groups, deliberately short ("What I reach for by default. The list is short on purpose," `:259`) rather than an exhaustive skills wall. |
| **Contact** | `318-339` | The direct ask, explicitly inviting an underspecified problem ("only a rough idea of the shape," `:322`) rather than only a fully-scoped project — this is the line written for the non-technical-client audience. Email, GitHub, LinkedIn as three equal cards. |

**Content sourcing rule** (`README.md:46-50`, still true): copy is real, not placeholder. Each work card was written from that project's own `docs/` folder, not its README. Two categories of real information are deliberately excluded from the public copy and must stay excluded if these cards are extended: personal financial figures from the Hundi tracker's docs, and the client's Stripe pricing tiers plus production server address from the Mediator Gabby deployment docs.

**Current state note:** Mediator Gabby's card is now `.featured` (`index.html:88`, `style.css:309`), spanning the full grid row and containing `assets/img/gabby-comparison.jpg` — a real screenshot of the mediator comparison view, built on seeded test data only (confirmed by the alt text at `index.html:95`). This is why `.cards`' `minmax()` floor was dropped from 360px to 300px at `style.css:270` — with one card pulled out of the grid onto its own row, the remaining three needed a smaller minimum to still land as a single row of three rather than 2-plus-1. **`README.md:52` still documents the old 360px/four-card/2×2 layout and has not been updated to match** — see Known Issues.

---

## Deploy and Repo Security

### Deployment (`.github/workflows/deploy.yml`)

- **Trigger:** push to `main` (`deploy.yml:10-11`), plus manual `workflow_dispatch` (`:13`) so a re-deploy doesn't require an empty commit.
- **No build step.** The repo root is uploaded as-is (`deploy.yml:42`, `path: .`) — this is a static site with nothing to compile.
- **Steps** (`deploy.yml:33-46`): `actions/checkout` → `actions/configure-pages` → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- **Every action is pinned to a commit SHA, not a tag** (e.g. `actions/checkout@3d3c42e5aac...  # v7.0.1`) — the trailing comment records the human-readable version, but the SHA is what actually runs, so a hijacked or re-pointed tag can't silently alter a deploy. This replaced a prior legacy Pages branch-builder setup (commit `a08816f`) that had no logs and no place to add checks.
- **Least-privilege permissions** (`deploy.yml:16-19`): `contents: read`, `pages: write`, `id-token: write` — nothing else.
- **Concurrency** (`deploy.yml:21-24`): `group: pages`, `cancel-in-progress: false` — deploys queue rather than race, so the last push always wins rather than a faster later job finishing before an earlier one.
- **Pages `build_type` is `workflow`** (not the legacy branch builder) as a consequence of this setup.

### Repo security (GitHub settings, not a committed file — verified this session, re-check via the GitHub UI/API if this doc goes stale)

- A **ruleset on `main`** blocks force-push and branch deletion, and requires a pull request before merging (0 required approvals configured).
- **Actions are restricted** to GitHub-owned actions and verified creators, with SHA pinning required — this is the repo-level policy that the pinned SHAs in `deploy.yml` satisfy.
- **Branch model:** `main` and `dev`. Work happens on `dev`; changes land on `main` via PR (see the merge commits `341a2d0`, `c64d1be` in the git log).

---

## Conventions to Preserve When Editing

1. **File headers.** Every source file opens with a short comment block naming the file's relative path and its role — see `style.css:1-7`, `sketch.js:1-7`, `main.js:1-5`, `deploy.yml:1-5`. Preserve this on any file you touch; update the header text only if the file's role actually changes.

2. **Numbered CSS sections.** `style.css` is organized into 13 numbered `/* === N. Name === */` blocks (Tokens, Base, Sketch overlay plumbing, Header, Hero, Buttons, Cards/work, Timeline, Tags, Contact, Reveal, Responsive, Preferences — full list at `style.css:9-573`). New rules belong inside the section that owns that concern, not appended at the end of the file. If a new concern doesn't fit an existing section, add a new numbered section rather than burying it in an unrelated one.

3. **The cache-buster (`?v=N`).** There is no build step to hash filenames, so `index.html:29` (`style.css?v=5`) and `index.html:347-348` (`sketch.js?v=5`, `main.js?v=5`) carry a manual version query string. **Bump `v` on every edit to any of these three files, in all three references together.** `README.md:70` explains why this matters concretely: `python3 -m http.server` sends no `Cache-Control` header at all, so a stale cached script can silently make a real edit look like it did nothing, and a mismatched CSS/JS pair (new stylesheet running against an old script, or vice versa) is a real failure mode, not a theoretical one.

4. **No-dependency stance.** No `package.json`, no bundler, no framework — `.gitignore:20-21` ignores `node_modules/` purely "in case" a future build step needs it, not because one exists today. Don't introduce a build step, a framework, or an npm dependency without a deliberate decision to abandon the "open `index.html` and it works" property — that property is a stated design goal (`README.md:5`), not an oversight.

5. **Sketching a new element.** Per `README.md:26-37`: add `data-sketch` (optionally `="dot"|"vline"|"underline"`, plus `data-fill`, `data-ink`, `data-shadow="off"`, `data-weight`), and make sure any bare text inside is wrapped in a child element — bare text nodes can't be lifted above the `z-index`-layered overlay (`style.css:131-133`).

6. **Content sourcing rule** — real copy only, sourced from a project's own `docs/`, never placeholder text; keep excluded the specific categories of sensitive figures listed under Content Model above.

---

## Known Issues / Improvement Backlog

*(This section is a living checklist — check items off or edit freely as they're addressed.)*

### Addressed 2026-08-30 (uncommitted)

- [x] ~~**Deep links landed in the wrong section.**~~ `location.hash` is now re-applied after `document.fonts.ready` *and* `load`, plus one animation frame, using `behavior: 'instant'` (`main.js:111-131`). `'auto'` was not enough — it defers to the computed `scroll-behavior`, which is `smooth` on `<html>`, so the correction glided instead of jumping.
- [x] ~~**Reveal could leave content blank.**~~ Added a safety net that releases anything already on screen but still hidden, once fonts settle (`main.js:93-108`). Content below the fold still animates in normally.
- [x] ~~**No favicon / Twitter card / theme-color / structured data.**~~ Added, plus `rel="canonical"` and a JSON-LD `Person` block. The favicon is `assets/img/favicon.svg` — drawn in the site's own ink rather than generated.
- [x] ~~**No `robots.txt` / `sitemap.xml` / `404.html`.**~~ All three added. The 404 shares the stylesheet and sketch engine but deliberately omits `main.js`, so an error page can never render blank; its asset paths are **absolute** because Pages serves it for arbitrary depths.
- [x] ~~**Toolkit listed 25 technologies** under a line promising a short list.~~ Trimmed to 17 on redundancy grounds only (JavaScript, LangChain, Node.js, SQLite, React Native, Electron, DigitalOcean, OpenAI).
- [x] ~~**Caveat set too small.**~~ Kicker bumped 1.15rem → 1.25rem.
- [x] ~~**Hero image had no intrinsic dimensions.**~~ `width="576" height="720"` added.
- [x] **New:** "I keep learning" section between Work and Journey (`index.html:169`), linking four learning-in-the-open repos, with a matching nav entry.

### Still open

- [ ] **Share image (`og:image`).** `index.html:19-21` still points `og:image` at the GitHub avatar (`assets/img/me.jpg`); `og:url` already points at the live address (`:18`). A purpose-made 1200×630 `assets/img/og.png` would preview far better in Slack, LinkedIn, and iMessage. (`README.md:56`, `index.html:5` — the header comment still flags this as the one remaining SWAP.)
- [x] ~~**Outcome numbers as decaying stats.**~~ Addressed this session (commit `dde72c0`) — `.result` chips no longer carry commit counts/team-size figures that would go stale; they now carry durable claims ("in production", "sole author", "fits in 4 GB VRAM", "public on GitHub"). `README.md:57` still describes the old version of this item and should be updated or removed to match.
- [ ] **Hero photo is a cartoon avatar, not a real photo.** `index.html:69` uses the GitHub avatar; `style.css:220-222`'s comment notes `.polaroid .shot img` uses an `object-position` crop specifically tuned to cut off lettering baked into that artwork. If the photo is swapped for a real one, that override should be revisited/removed. (`README.md:58`)
- [ ] **`README.md:52` is out of date against the current uncommitted layout.** It still says four cards at `minmax(360px, 1fr)` landing as a 2×2 grid. The working tree now has Mediator Gabby pulled into `.featured` (full row, `style.css:309`) with the remaining three cards at `minmax(300px, 1fr)` (`style.css:270`) forming a single row of three. README's structure/content description should be updated alongside committing this layout change.
- [ ] **Sketch cost scales with element count.** `README.md:81` flags that at the current page size this is a non-issue, but if the page grows to a few hundred `data-sketch` elements, drawing should move to on-scroll-into-view rather than all-on-init (`sketch.js:235-237`).
- [ ] **No dark mode**, by deliberate design choice (`README.md:79`) — the paper aesthetic doesn't have a good dark counterpart; revisit only if this becomes a real ask, not by default.

---

## Open Questions

- **Is the current uncommitted work (Gabby featured card + `gabby-comparison.jpg` + 360→300px grid change + durable-claims copy) ready to commit and go through the `dev` → PR → `main` flow, or is it still being iterated on?** (`git status` shows these as unstaged/untracked as of this doc's writing.)
- **Should `README.md` be updated in the same change** that commits the featured-card layout, so the two don't drift further out of sync? (See the backlog item above.)
- **Is there a target date or trigger** for producing the `og.png` share image, or is it opportunistic?
- **Are real outcome numbers** (mediators onboarded, sessions run — as opposed to authorship facts) going to become available for the Mediator Gabby card, per the original `README.md:57` idea, or has the "durable claims" approach (commit `dde72c0`) fully superseded that plan?
- **Any plans to add more work cards** beyond the current four, and if so, does the `.cards` grid math at `style.css:259-267` (documented as `floor((C + gap) / (min + gap))` against the wrap's content box) need to be revisited for a different card count?
- **Is `gabby-comparison.jpg`'s current file size/compression acceptable**, or does it need optimization to stay in line with the site's stated ~224 KB total-asset footprint (`README.md`/task context) now that a real screenshot has been added?

---

*Document version: 1.0*
*Last updated: 2026-08-30 — reflects the working tree as of commit `dde72c0` plus uncommitted changes (Gabby featured card, `gabby-comparison.jpg`, cards grid 360→300px).*
