# Visual style guide

Read this before adding or changing anything visual: pages, components, hero shaders, figures,
banners, films. The site should read as one piece of work: a dark, editorial CG studio whose
render pipeline occasionally breaks.

## Identity

- The name is always written **SkinkEBravia**: capital S, E and B only. Never all caps, never
  lowercase, never inside a `text-transform: uppercase` element. Wrap it in `.name-case` if it has
  to sit in a `.label`.
- The voice is quiet, precise and slightly unsettling. Short declarative sentences. No marketing
  words, no exclamation marks, no emoji in the UI.
- Concept: *a render pipeline eating itself*. Calm, well-made images, then short, deliberate
  corruption that reveals how the picture is made (buffers, samples, weights, parameters).

## Colour

Use the tokens in `src/styles/global.css`; never hard-code new colours in components.

| Token | Value | Use |
|---|---|---|
| `--ink` / `--ink-2` / `--ink-3` | `#060608` / `#0c0c10` / `#15151b` | Backgrounds, panels, raised surfaces |
| `--paper` / `--paper-2` | `#ecebe6` / `#bdbcb6` | Primary text / body text |
| `--dim` | `#7d7c85` | Labels, metadata |
| `--line` / `--line-2` | paper at 12% / 24% | Hairlines and rules |
| `--hot` | `#ff2e63` | The one accent: intrusion, errors, active states, the § before headings |
| `--cyan` | `#27e6ff` | Secondary signal colour, only as the partner of hot (chroma split, "the machine") |
| `--acid` | `#d4ff3a` | Inline code only |

- The site is dark only (`color-scheme: dark`). Do not add a light theme.
- Hot is rare. If more than about 5% of a calm screen is hot, it is too much. It is allowed to flood during an intrusion.
- Colour in imagery comes from light: iridescent thin-film chrome, warm sun, cool shadow. Avoid flat rainbow palettes, except where a debug view needs them (cluster IDs, normals).

## Type

| Role | Face | Where |
|---|---|---|
| Display | Unbounded 900, tight tracking (−0.04 to −0.06em) | The wordmark, huge page titles, shouts in films |
| Editorial | Instrument Serif, regular and *italic* | Section heads, article titles, statements, taglines |
| Body | Inter Variable, 17–18px, line-height 1.65–1.75 | Paragraphs |
| Metadata | JetBrains Mono 500, 10–12px, uppercase, 0.08em tracking (`.label`) | HUDs, dates, indices, citations, captions |

- Fonts are self-hosted through Fontsource. Do not add Google Fonts links or new families.
- Big display type is sized to fill its container (container units), not guessed with `vw`. It must never overflow horizontally.
- Numbering is part of the look: `01`, `(02)`, `003`, zero-padded, in mono.

## Layout

- Content sits in `.wrap` (max 1440px, gutter `clamp(16px, 4vw, 56px)`). Rules are 1px hairlines in `--line`.
- The patterns are editorial: an oversized section head with a mono index; lists of rows (index · serif title · mono meta · date · ↗); generous vertical space (`clamp(100px, 14vw, 200px)` between blocks).
- Prose is limited to 68ch and indented from the left on wide screens. Headings are serif with a hot italic `§`.
- It must work at 390px wide with no horizontal scroll. Check it.

## Motion and glitch

- Glitch is **punctuation, not texture**. Calm states are fully calm, apart from grain and scanlines at low opacity. Corruption comes in short, authored bursts, from a single frame up to about 0.9 s, and ideally has a reason: a state change, a reveal, or user energy (scroll speed, pointer speed).
- The glitch vocabulary is fixed: horizontal slice tearing, macroblock displacement, posterised "datamosh" blocks, pixel-sort smears, a red and cyan chroma split, AOV leaks (normals, depth, iteration heat), a single-frame invert at the peak of a big hit, and text that decodes and scrambles with `█▓▒░<>/\=+*#%&$@01`. Do not invent new effects casually.
- Hold the glitch seed for 2 frames, so blocks read as codec errors rather than noise.
- Easing: `--ease` for reveals and `--ease-snap` for cuts. Reveals are slow (0.9–1.1 s) and cuts are fast.
- Respect `prefers-reduced-motion`: render one still frame, with no bursts, no grain animation and no marquee.

## Real-time graphics (hero and inline demos)

- Use raw WebGL2 and hand-written GLSL: ray-marched SDFs, analytic lighting, and a procedural studio environment (strip softboxes plus a hot and a cyan kicker). Do not add three.js-style scene graphs unless there is no other way.
- Use two passes: scene into a half-float FBO, then post (glitch, ACES tone mapping, scanlines, vignette).
- Lower the resolution adaptively to hold roughly 50+ fps, pause when off-screen or when the tab is hidden, and fall back to a CSS gradient if WebGL2 is missing.
- Keep a debug entry point for stills: `?form=…` or `?at=seconds`.
- Before committing, verify with headless Chromium screenshots at desktop (1440×900) and mobile (390×844) sizes, and look at them.

## Films and generated media (`studio/`)

- Each piece lives in `studio/<name>/`: an HTML renderer, a `timeline.json` (timings, captions, citations), `capture.mjs` (deterministic frame capture), `audio.py` (a soundtrack synthesised from the same event list), and a `SHOTLIST.md`.
- **One world per film.** Keep a single set, lens, palette, HUD and type system across chapters. Unrelated scenes read as a slideshow.
- The structure is calm construction, then an intrusion, then the world re-expressed. What should frighten the viewer is the *idea* (rules replaced by distributions, weights and optimisation), not a gimmick result.
- HUD grammar: mono labels in the corners (`ARCHIVE FEED · 01 / NOISE`, timecode, instrument readouts), a serif title with a mono citation at the bottom left, a formula in serif italic at the bottom right, terminal log lines typed in hot at the top left during intrusions, and shouts in Unbounded 900 on a dark band.
- Output 960×540 at 24 fps, H.264 plus AAC, two-pass encoded to 15 MB or less, into `public/media/`, with a poster JPEG.
- Review sparse contact sheets (every 20–30 frames) for consistency, legibility and render bugs before any full render.

## Honesty

- Citations must be exact: authors, title and venue/year. Check them before publishing.
- When something is a visualisation or imitation of a method, rather than the real method running, say so plainly on the page ("How it's made").
- Never invent facts about the owner (affiliation, publications, contact). Leave clearly marked placeholders in `src/site.ts` instead.
