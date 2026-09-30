// Shared helpers for the cheat-sheet figures.
//
// A figure's geometry is a pure function returning a Layout: attributes keyed by
// the data-g name of the SVG element they belong to. The frontmatter renders the
// default state from it (so the figure reads without JavaScript) and the client
// script re-applies it on every drag.

export type Attrs = Record<string, string | number>;
export type Layout = Record<string, Attrs>;

export const deg = Math.PI / 180;
export const f = (n: number) => (Math.abs(n) < 1e-9 ? "0" : n.toFixed(2));

/** Attributes for server rendering (drops the pseudo-attribute `text`). */
export function at(a: Attrs | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (a) for (const [k, v] of Object.entries(a)) if (k !== "text") out[k] = String(v);
  return out;
}

/** Apply a layout to the elements under `root`; `text` sets textContent. */
export function apply(root: ParentNode, layout: Layout) {
  for (const [key, a] of Object.entries(layout)) {
    for (const el of root.querySelectorAll(`[data-g="${key}"]`)) {
      for (const [k, v] of Object.entries(a)) {
        if (k === "text") { if (el.textContent !== String(v)) el.textContent = String(v); }
        else el.setAttribute(k, String(v));
      }
    }
  }
}

/** Circular-arc path from angle a0 to a1 (maths angles, radians, y up) around (cx, cy). */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 0 : 1;
  return `M${f(x0)} ${f(y0)} A${f(r)} ${f(r)} 0 ${large} ${sweep} ${f(x1)} ${f(y1)}`;
}

/** Small right-angle mark at corner c, with legs towards points p and q. */
export function rightMark(c: [number, number], p: [number, number], q: [number, number], s = 8) {
  const u = norm([p[0] - c[0], p[1] - c[1]]), v = norm([q[0] - c[0], q[1] - c[1]]);
  const a = [c[0] + u[0] * s, c[1] + u[1] * s], b = [c[0] + v[0] * s, c[1] + v[1] * s];
  const m = [c[0] + (u[0] + v[0]) * s, c[1] + (u[1] + v[1]) * s];
  return `M${f(a[0])} ${f(a[1])} L${f(m[0])} ${f(m[1])} L${f(b[0])} ${f(b[1])}`;
}

const norm = (v: number[]) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

/**
 * Make `handle` draggable inside `svg`. `move` gets the pointer in SVG units.
 * Arrow keys call `nudge(±1)` when the handle has focus.
 */
export function draggable(
  svg: SVGSVGElement, handle: SVGElement,
  move: (p: { x: number; y: number }) => void,
  nudge?: (dir: number, big: boolean) => void,
) {
  const pt = (e: PointerEvent) => {
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    handle.classList.add("is-dragging");
    move(pt(e));
  });
  handle.addEventListener("pointermove", (e) => { if (handle.hasPointerCapture(e.pointerId)) move(pt(e)); });
  const up = (e: PointerEvent) => { if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId); handle.classList.remove("is-dragging"); };
  handle.addEventListener("pointerup", up);
  handle.addEventListener("pointercancel", up);
  if (nudge) {
    handle.setAttribute("tabindex", "0");
    handle.addEventListener("keydown", (e) => {
      const k = (e as KeyboardEvent).key;
      const dir = k === "ArrowRight" || k === "ArrowUp" ? 1 : k === "ArrowLeft" || k === "ArrowDown" ? -1 : 0;
      if (dir) { e.preventDefault(); nudge(dir, (e as KeyboardEvent).shiftKey); }
    });
  }
}

/** Listen for the owning <Sheet>'s active row. */
export function onSheet(fig: Element, cb: (key: string) => void) {
  fig.closest("[data-sheet]")?.addEventListener("sheet:active", (e) => cb((e as CustomEvent<string>).detail));
}
