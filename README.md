# SkinkEBravia.github.io

Personal site: research, writing and study notes on computer graphics.
Live at **https://skinkebravia.github.io**.

The hero is **SIGNAL**, raymarched live in WebGL2: a gyroid lattice in thin-film chrome that
morphs into superformula (Gielis) sea urchins and back, while the render pipeline glitches in
bursts, leaking its own normal, depth and iteration buffers.

Testing: `/?form=gyroid` or `/?form=0`…`3` freezes a form; `/?at=5` jumps into the timeline.

## Adding content

| What | Where | Notes |
|---|---|---|
| Paper / project page | `src/content/research/*.md(x)` | Copy `example-paper.md`. `selected: true` puts it on the home page. |
| Essay / blog post | `src/content/writing/*.md(x)` | |
| Study note | `src/content/notes/*.md(x)` | |
| Name, tagline, statement, links | `src/site.ts` | Empty links are hidden. |

Every entry supports Markdown or MDX, LaTeX maths (`$…$`, `$$…$$` via KaTeX), code blocks,
and images placed next to the file. `draft: true` hides an entry from the live site but keeps it
visible in `npm run dev`.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

Pushing to `main` builds and deploys through GitHub Actions (`.github/workflows/deploy.yml`).

## Stack

Astro 7 · MDX · KaTeX · raw WebGL2 (no 3D library) · Unbounded, Instrument Serif, Inter and
JetBrains Mono via Fontsource.
