// Chroma split and slice tears for an inline SVG figure.
// Everything the figure draws is moved into one group, which is then re-used
// as three ghost copies: one torn sideways inside a few horizontal bands, and
// a hot and a cyan copy (keyed on luminance, so dark fills stay dark) offset in
// opposite directions. The bands are reseeded every second frame so they read
// as codec errors rather than noise. Calm state: ghosts hidden.
import { reduce } from "./decode";

const NS = "http://www.w3.org/2000/svg";
let uid = 0;

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

function tint(id: string, colorVar: string) {
  const f = el("filter", { id, x: "-5%", y: "-5%", width: "110%", height: "110%" });
  f.append(
    el("feColorMatrix", { type: "luminanceToAlpha", result: "lum" }),
    el("feComponentTransfer", { in: "lum", result: "key" }),
    el("feFlood", { style: `flood-color: var(${colorVar})` }),
    el("feComposite", { in2: "key", operator: "in" }),
  );
  f.children[1].append(el("feFuncA", { type: "linear", slope: "1.6" }));
  return f;
}

export interface Glitch {
  /** Run a burst for `ms` milliseconds (extends a running one). */
  burst(ms: number): void;
}

/**
 * Wrap `svg` for bursts. Call after the figure's own markup exists; elements
 * the figure later looks up by selector keep working (they are moved, not cloned).
 * With `reveal`, one burst plays when the figure first comes into view.
 */
export function mountGlitch(svg: SVGSVGElement, { reveal = true } = {}): Glitch {
  if (reduce) return { burst() {} };
  const id = `gl${++uid}`;
  const vb = svg.viewBox.baseVal;
  const [x, y, w, h] = [vb.x, vb.y, vb.width || svg.clientWidth, vb.height || svg.clientHeight];

  const art = el("g", { id: `${id}-art` });
  for (const child of [...svg.childNodes]) {
    const tag = (child as Element).tagName;
    if (tag !== "defs" && tag !== "title" && tag !== "desc") art.append(child);
  }
  svg.append(art);

  const defs = el("defs");
  const bands = el("clipPath", { id: `${id}-bands` });
  const tears = el("clipPath", { id: `${id}-tear` });
  for (let i = 0; i < 5; i++) bands.append(el("rect", { x: String(x), width: String(w), y: "0", height: "0" }));
  for (let i = 0; i < 2; i++) tears.append(el("rect", { x: String(x), width: String(w), y: "0", height: "0" }));
  defs.append(tint(`${id}-hot`, "--hot"), tint(`${id}-cyan`, "--cyan"), bands, tears);

  const ghost = el("g", { "aria-hidden": "true", style: "opacity:0;pointer-events:none" });
  const tearG = el("g", { "clip-path": `url(#${id}-tear)` });
  const tearUse = el("use", { href: `#${id}-art` });
  tearG.append(el("rect", { x: String(x), y: String(y), width: String(w), height: String(h), style: "fill: var(--ink-2)" }), tearUse);
  const split = el("g", { "clip-path": `url(#${id}-bands)` });
  const hotUse = el("use", { href: `#${id}-art`, filter: `url(#${id}-hot)`, style: "mix-blend-mode:screen;opacity:.8" });
  const cyanUse = el("use", { href: `#${id}-art`, filter: `url(#${id}-cyan)`, style: "mix-blend-mode:screen;opacity:.8" });
  split.append(hotUse, cyanUse);
  ghost.append(tearG, split);
  svg.append(defs, ghost);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const band = (r: Element, lo: number, hi: number) => {
    const bh = rand(lo, hi) * (h / 396);
    r.setAttribute("y", rand(y, y + h - bh).toFixed(1));
    r.setAttribute("height", bh.toFixed(1));
  };
  const s = w / 396; // offsets are authored for a ~400-unit-wide figure

  let until = 0, raf = 0, frame = 0;
  const step = (now: number) => {
    if (now >= until) { ghost.style.opacity = "0"; raf = 0; return; }
    if (frame++ % 2 === 0) {
      for (const r of bands.children) band(r, 4, 42);
      for (const r of tears.children) band(r, 3, 18);
      const dx = rand(3, 11) * s * (Math.random() < 0.5 ? -1 : 1);
      hotUse.setAttribute("transform", `translate(${dx.toFixed(1)} 0)`);
      cyanUse.setAttribute("transform", `translate(${(-dx * 0.8).toFixed(1)} 0)`);
      tearUse.setAttribute("transform", `translate(${(rand(-24, 24) * s).toFixed(1)} 0)`);
      ghost.style.opacity = "1";
    }
    raf = requestAnimationFrame(step);
  };
  const burst = (ms: number) => {
    until = Math.max(until, performance.now() + ms);
    if (!raf) { frame = 0; raf = requestAnimationFrame(step); }
  };

  if (reveal) {
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); setTimeout(() => burst(560), 280); }
    }, { threshold: 0.5 });
    io.observe(svg);
  }
  return { burst };
}

/** Pointer position in the SVG's user units. */
export function svgPoint(svg: SVGSVGElement, e: { clientX: number; clientY: number }) {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}
