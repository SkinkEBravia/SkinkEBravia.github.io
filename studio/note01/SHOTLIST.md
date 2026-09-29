# INTRUSION — shot list (v2)

60 s · 960×540 · 24 fps · 1440 frames. One world for the whole film: a procedural landscape
(Perlin-style gradient-noise heightfield, fbm clouds, a low sun) that is built by hand in chapter 1
and then re-read by each chapter. Same lens (vertical FOV ≈ 37°), same slow drone moves, same HUD.

**Two visual registers, never mixed by accident**

- *Archive feed* (human-authored rules): the landscape, warm documentary grade, paper-coloured
  construction lines (lattices, rays, lobes, wireframes), dim mono HUD, serif titles.
- *Foreign signal* (the new way of thinking): ink background, hot `#ff2e63` / cyan `#27e6ff`
  vector plots of distributions, trajectories, gradients, weights. Hot HUD, typed terminal log.
  When the signal "re-expresses" the world, the landscape takes on the same hot/cyan false colour.

Glitch is punctuation only: a hard burst at each breach and a short tear at each cut into or out of a
signal shot. Calm sections have no glitch at all.

## Timeline

| t (s) | shot | what we see | HUD / type |
|---|---|---|---|
| 0.0–2.5 | **00 Boot** | Ink. A sync line; typed boot lines. | `SIGGRAPH ARCHIVE · 1981—2024` / `RECONSTRUCTING ONE LANDSCAPE BY HAND` / `PLAYBACK: NOMINAL` |
| 2.5–4.4 | 1a Lattice | Top-down. The integer lattice (spacing 4 u) with Perlin's pseudo-random gradient arrows; octave 1 of gradient noise fades in as grey. | 01 / NOISE · *Procedural noise* · Ken Perlin — An Image Synthesizer — SIGGRAPH 1985 · `OCTAVE 1 / 6 · LATTICE 4.00 u` |
| 4.4–6.4 | 1b Octaves | Octaves 2…6 stack every 0.36 s; the finer lattices (2, 1, 0.5 u) flash and fade. | formula *h(x) = Σ 2⁻ⁱ noise(2ⁱx)* · `OCTAVE k / 6` |
| 6.4–8.6 | 1c Rise | Camera pitches from −90° to −14° while the heightfield rises out of the grey image (clay light). | `HEIGHTFIELD y = A·h(x, z)` |
| 8.6–11.0 | 1d Dawn | Materials by slope/height, cloud density from fbm condenses, the sun rises from −3° to 8°. | `CLOUDS ρ = fbm(x) − c` · `SUN 5.1°` |
| 11.0 | breach | Burst. HUD turns hot: `▲ FOREIGN SIGNAL`. Terminal log starts typing. | |
| 11.35–12.85 | 1f Signal: samples | Ink. 1 500 samples from 𝒩(0, I) flow along the exact score of a toy density into the ridge silhouette of *our* terrain; faint score arrows ∇log pₜ. | `x_T ~ N(0, I)` → `x_0 ~ p_data` · `t = 1000 → 0` |
| 12.85–14.25 | 1g Signal: SDE | Ink. Reverse-SDE trajectories fan out and converge (time on x) onto the height histogram of the terrain. | *dx = [f − g²∇log pₜ] dt + g dw̄* |
| 14.25–18.0 | 1h World′: latent | Same camera as 1d. The terrain is a 64×64×4 latent that starts as Gaussian static and is fitted step by step (illustrative, "a model mid-training"). Inset shows z_t. It converges to *almost* the same mountains — the fine detail is a different sample. | *Diffusion* · Ho, Jain & Abbeel — DDPM — NeurIPS 2020 / Song et al. — Score-Based Generative Modeling through SDEs — ICLR 2021 · `STEP t` · `LOSS` |
| 16.2–17.8 | shout | NO RULE FOR MOUNTAINS. / ONLY A DISTRIBUTION. | |
| 18.0–23.2 | 2a Paths | Valley at golden hour. A camera gizmo shoots 34 paths that really bounce off the heightfield; dashed shadow rays to the sun; image noise falls as 1/√spp. | 02 / LIGHT · *The rendering equation* · James T. Kajiya — The Rendering Equation — SIGGRAPH 1986 · *L_o = L_e + ∫ f_r L_i cos θ dω* · `SPP` `BOUNCES ≤ 4` |
| 23.2 | breach | | |
| 23.5–25.0 | 2c Signal: cut | Ink. A camera ray over the terrain profile is cut at its first hit; the cut vertex feeds an MLP (weights drift as it trains); the output is L̂. A loss curve falls. | `query(x, ω, n, α) → L̂` |
| 25.0–29.0 | 2d World′: cache | The valley again. Every path now stops at its first hit on a hot query node and reports to one network glyph; a few cyan training paths continue. Indirect light comes from a flickering, blocky cache that is still converging. | *Neural radiance caching* · Müller, Rousselle, Novák & Keller — Real-time Neural Radiance Caching for Path Tracing — ACM TOG 2021 (SIGGRAPH) |
| 27.2–28.8 | shout | IT STOPS FOLLOWING THE LIGHT. / IT GUESSES THE REST. | |
| 29.0–34.2 | 3a Lobe | Close on a sunlit rock of the same terrain. Normal n, light l, mirror r and the Cook–Torrance specular lobe (Beckmann D) drawn as a wire surface; roughness m sweeps 0.15 → 0.5 → 0.25 and the rock's highlight follows. Microfacet profile inset. | 03 / MATERIAL · *Microfacet reflectance* · Cook & Torrance — A Reflectance Model for Computer Graphics — SIGGRAPH 1981 · *R_s = F D G / π (N·L)(N·V)* · `m = 0.25` |
| 34.2 | breach | | |
| 34.5–36.1 | 3c Signal: weights | Ink. The formula's symbols come apart and become neurons; edges carry signed weights; a 64×64 weight matrix updates as it trains. | `W ∈ R^{64×64}` |
| 36.1–40.0 | 3d World′: neural material | The rock again: albedo becomes an 8-channel latent texture (cells), the lobe becomes a learned, lumpy lobe that keeps changing; the formula slot shows weights. | *Neural appearance* · Zeltner et al. — Real-Time Neural Appearance Models — ACM TOG 2024 |
| 38.2–39.8 | shout | NO FORMULA. / ONLY WEIGHTS. | |
| 40.0–45.2 | 4a Mesh | High wide view. Wireframe triangles, then Nanite-style cluster colours with LOD by distance. | 04 / GEOMETRY · *Virtualized geometry* · Karis, Stubbe & Wihlidal — Nanite: A Deep Dive — SIGGRAPH 2021 (Advances course) · `TRIANGLES 2,093,058 · CLUSTERS 16,384` |
| 45.2 | breach | | |
| 45.5–47.4 | 4c Signal: loss | Ink. The *same* terrain as a loss surface: contour lines, optimisers descending −∇L with trails into the valleys. | *θ ← θ − η∇L(θ)* |
| 47.4–52.5 | 4d World′: splats | The wide view again, but the terrain is gone: ~55k anisotropic 3D Gaussians (EWA-projected) spawn from one 𝒩(μ, σ²I) blob, descend onto the land, get cloned/split, pruned; floaters stay in the sky. One flash cut back to the loss view at 49.4. | *Gaussian splatting* · Kerbl, Kopanas, Leimkühler & Drettakis — 3D Gaussian Splatting for Real-Time Radiance Field Rendering — SIGGRAPH 2023 · `ITER` `GAUSSIANS` |
| 50.6–52.2 | shout | THE MOUNTAINS ARE / A LOSS FUNCTION NOW. | |
| 52.5–56.8 | 5a Outro | The splat landscape dims; serif lines typed. | *Every equation we wrote down, / it learned to imitate. / The renderer is dreaming now.* |
| 56.8–57.9 | 5b Collapse | Every splat flows back into one isotropic Gaussian. Heartbeat. | |
| 57.9–60.0 | 5c Card | Hard cut. | `NOTE 01 — INTRUSION` · **SkinkEBravia** |

## Terminal logs (typed after each breach)

1. `> x_T ~ N(0, I)` · `> for t = 1000…1: x += σ²∇log p(x) + σz` · `> latent 64×64×4 · fitting` · `! no rule for mountains. only p(mountains)`
2. `> depth ≥ 1: truncate path` · `> L̂ = cache(x, ω, n, α)` · `> few paths continue: train online` · `! the rest of the light is inferred`
3. `> unlink F·D·G / π(n·l)(n·v)` · `> latent texture z(x): 8 ch` · `> f = mlp(z, ω_i, ω_o)` · `! no roughness. no fresnel. no m.`
4. `> drop index_buffer` · `> init gaussians ~ N(μ, σ²I)` · `> densify every 100 it · prune α < 0.005` · `! the mountains are a loss function now`

## Honesty notes

- The heightfield, clouds, rays, lobe and wireframe are real computations of the classical method.
- Signal shots 1f/1g integrate a real reverse SDE, but on the *exact* score of a small hand-made
  density (a blurred silhouette / histogram), not a trained network.
- 1h, 2d, 3d, 4d are illustrations: a latent that converges on a schedule, a cache with scripted
  error, a random MLP with drifting weights, Gaussians that move to precomputed targets. No model is
  trained. The film says so in the note.
