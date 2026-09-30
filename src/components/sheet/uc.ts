// Geometry for the six-functions unit circle. Unit = U svg units, y down.
import { arc, f, rightMark, type Layout } from "./geom";

export const U = 100;
const BIG = 2000; // clamp for points near infinity (tan at 90°, cot at 0°)
const cl = (v: number) => Math.max(-BIG, Math.min(BIG, v));
const S = (x: number, y: number): [number, number] => [cl(x * U), cl(-y * U)];
const pts = (...p: [number, number][]) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
const line = (a: [number, number], b: [number, number]) => ({ x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]) });

// view box: keep labels inside it
export const VB = { x: -215, y: -172, w: 430, h: 344 };
const inView = (x: number, y: number, m = 10) =>
  x > VB.x + m && x < VB.x + VB.w - m && y > VB.y + m && y < VB.y + VB.h - m;
const clampView = (x: number, y: number, m = 14): [number, number] => [
  Math.max(VB.x + m, Math.min(VB.x + VB.w - m, x)),
  Math.max(VB.y + m, Math.min(VB.y + VB.h - m, y)),
];

/** Scale a point towards O until it lies inside the view (with margin). */
function fit(p: [number, number], m = 24): [number, number] {
  const kx = p[0] > 0 ? (VB.x + VB.w - m) / p[0] : p[0] < 0 ? (VB.x + m) / p[0] : Infinity;
  const ky = p[1] > 0 ? (VB.y + VB.h - m) / p[1] : p[1] < 0 ? (VB.y + m) / p[1] : Infinity;
  const k = Math.min(1, kx, ky);
  return [p[0] * k, p[1] * k];
}

function label(x: number, y: number, anchor: "start" | "middle" | "end", show = true) {
  const [cx, cy] = clampView(x, y);
  return { x: f(cx), y: f(cy), "text-anchor": anchor, opacity: show && inView(x, y, 0) ? 1 : 0 };
}

export function layout(theta: number): Layout {
  const c = Math.cos(theta), s = Math.sin(theta);
  const t = s / c, ct = c / s;
  const O: [number, number] = [0, 0];
  const P = S(c, s), F = S(c, 0), X1 = S(1, 0), Y1 = S(0, 1);
  const T = S(1, t), C = S(ct, 1);
  // unit normal to the ray, for keeping sec and csc apart where they overlap
  const nx = -s, ny = -c; // screen-space normal (rotate (c, -s) by +90°)
  const off = 3.5;

  // labels sit on the visible part of segments that run off to infinity
  const Tv = fit(T), Cv = fit(C);
  const midT = Tv[1] / 2;
  const secL = [Tv[0] * 0.62, Tv[1] * 0.62];
  // the "1" on the radius and sec both sit on the side away from the triangles,
  // at different distances along the ray
  const unit = (x: number, y: number) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const inside = Math.abs(c) > 0.45; // room for the sin label inside triangle A
  const fromF = unit(P[0] * 0.3 - F[0], P[1] * 0.3 - F[1]);
  const secAway = unit(secL[0] - X1[0], secL[1] - X1[1]);

  return {
    triA: { points: pts(O, F, P) },
    triB: { points: pts(O, X1, T) },
    triC: { points: pts(O, Y1, C) },
    cos: line(O, F), sin: line(F, P), rad: line(O, P),
    tan: line(X1, T), sec: line(O, T), oneB: line(O, X1),
    cot: line(Y1, C), csc: line([O[0] - nx * off, O[1] - ny * off], [C[0] - nx * off, C[1] - ny * off]), oneC: line(O, Y1),
    rA: { d: rightMark(F, O, P, 7), opacity: Math.abs(s) > 0.08 && Math.abs(c) > 0.08 ? 1 : 0 },
    rB: { d: rightMark(X1, O, T, 7), opacity: Math.abs(t) > 0.08 ? 1 : 0 },
    rC: { d: rightMark(Y1, O, C, 7), opacity: Math.abs(ct) > 0.08 ? 1 : 0 },
    arc: { d: arc(0, 0, 22, 0, theta) },
    lth: { x: f(34 * Math.cos(theta / 2)), y: f(-34 * Math.sin(theta / 2)) },
    P: { cx: f(P[0]), cy: f(P[1]) },
    handle: { cx: f(P[0]), cy: f(P[1]) },
    lcos: { ...label(F[0] / 2, s >= 0 ? 16 : -9, "middle", Math.abs(c) > 0.18), text: "cos θ" },
    // sin sits inside triangle A, low on its leg, clear of tan on the tangent line
    lsin: { ...label(F[0] + (c >= 0 === inside ? -6 : 6), F[1] + (P[1] - F[1]) * (inside ? 0.3 : 0.5) + 5, c >= 0 === inside ? "end" : "start", Math.abs(s) > 0.18), text: "sin θ" },
    lone: { ...label(P[0] * 0.3 + fromF[0] * 10, P[1] * 0.3 + fromF[1] * 10 + 5, "middle"), text: "1" },
    ltan: { ...label(X1[0] + 7, midT + 4, "start", Math.abs(t) > 0.18), text: "tan θ" },
    lsec: { ...label(secL[0] + secAway[0] * 13, secL[1] + secAway[1] * 13 + 5, "middle", Math.abs(1 / c) > 0.4), text: "sec θ" },
    loneB: { ...label(U * 0.5, s >= 0 ? 16 : -9, "middle"), text: "1" },
    lcot: { ...label(Cv[0] / 2, Y1[1] - 8, "middle", Math.abs(ct) > 0.18), text: "cot θ" },
    lcsc: { ...label(Cv[0] + (Cv[0] >= 0 ? 9 : -9), Cv[1] + 5, Cv[0] >= 0 ? "start" : "end", Math.abs(1 / s) > 0.4), text: "csc θ" },
    loneC: { ...label(c >= 0 ? -8 : 8, -U * 0.5 + 4, c >= 0 ? "end" : "start"), text: "1" },
  };
}

/** Signs of (sin, cos, tan) at theta. */
export const signs = (theta: number) => {
  const s = Math.sin(theta), c = Math.cos(theta);
  return { sin: s >= 0, cos: c >= 0, tan: s * c >= 0 };
};
