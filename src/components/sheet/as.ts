// Geometry for the angle-sum rectangle. A at the origin, the unit diagonal AD at
// angle α+β, AB = cos β at angle α with its right angle at B. Unit = U svg units, y down.
import { arc, f, rightMark, type Layout } from "./geom";

export const U = 240;
export const VB = { x: -96, y: -286, w: 470, h: 330 };
type Pt = [number, number];
const S = (x: number, y: number): Pt => [x * U, -y * U];
const line = (a: Pt, b: Pt) => ({ x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]) });
const pts = (...p: Pt[]) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
const lab = (x: number, y: number, anchor: string, text: string) => ({ x: f(x), y: f(y), "text-anchor": anchor, text });
const polar = (c: Pt, r: number, a: number): Pt => [c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)];

export function layout(a: number, b: number): Layout {
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const W = ca * cb, H = Math.sin(a + b);
  const A = S(0, 0), R = S(W, 0), B = S(W, sa * cb), Q = S(W, H), D = S(Math.cos(a + b), H), E = S(0, H);
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m = { AR: mid(A, R), RB: mid(R, B), BQ: mid(B, Q), QD: mid(Q, D), ED: mid(E, D), AE: mid(A, E), AB: mid(A, B), BD: mid(B, D), AD: mid(A, D) };
  // along-line labels, pushed off the line by the unit normal
  const off = (p: Pt, ang: number, d: number): Pt => [p[0] - d * Math.sin(ang), p[1] - d * Math.cos(ang)];
  const angBD = Math.PI / 2 + a; // direction B → D
  const pAB = off(m.AB, a, -14), pBD = off(m.BD, angBD, -12), pAD = off(m.AD, a + b, 12);

  return {
    rect: { points: pts(A, R, Q, E) },
    tLow: { points: pts(A, R, B) }, tMid: { points: pts(A, B, D) }, tUp: { points: pts(B, Q, D) }, tLeft: { points: pts(A, D, E) },
    AR: line(A, R), RB: line(R, B), BQ: line(B, Q), QD: line(Q, D), ED: line(E, D), AE: line(A, E),
    AB: line(A, B), BD: line(B, D), AD: line(A, D),
    rR: { d: rightMark(R, A, Q, 8) }, rQ: { d: rightMark(Q, R, E, 8) }, rE: { d: rightMark(E, Q, A, 8) }, rB: { d: rightMark(B, A, D, 8) },
    // equal angles: α at A and at B; α+β at A and at D
    aA: { d: arc(A[0], A[1], 46, 0, a) }, aB: { d: arc(B[0], B[1], 30, Math.PI / 2, Math.PI / 2 + a) },
    bA: { d: arc(A[0], A[1], 64, a, a + b) },
    abA: { d: arc(A[0], A[1], 88, 0, a + b) }, abD: { d: arc(D[0], D[1], 34, Math.PI, Math.PI + a + b) },
    laA: { ...lab(...polar(A, 58, a / 2), "middle", "α"), dy: "5" },
    laB: { ...lab(...polar(B, 42, Math.PI / 2 + a / 2), "middle", "α"), dy: "5" },
    lbA: { ...lab(...polar(A, 76, a + b / 2), "middle", "β"), dy: "5" },
    labA: { ...lab(...polar(A, 96, a + b + 0.16), "middle", "α+β"), dy: "5" },
    labD: { ...lab(...polar(D, 50, Math.PI + (a + b) / 2), "middle", "α+β"), dy: "5" },
    lAR: lab(m.AR[0], m.AR[1] + 24, "middle", "cos α cos β"),
    lRB: lab(R[0] + 10, m.RB[1] + 5, "start", "sin α cos β"),
    lBQ: lab(R[0] + 10, m.BQ[1] + 5, "start", "cos α sin β"),
    lQD: lab(m.QD[0], Q[1] - 11, "middle", "sin α sin β"),
    lED: lab(m.ED[0], Q[1] - 11, "middle", "cos(α+β)"),
    lAE: lab(-10, m.AE[1] + 5, "end", "sin(α+β)"),
    lAB: { ...lab(pAB[0], pAB[1] + 5, "middle", "cos β"), transform: `rotate(${f(-a / (Math.PI / 180))} ${f(pAB[0])} ${f(pAB[1])})` },
    lBD: { ...lab(pBD[0], pBD[1] + 5, "middle", "sin β"), transform: `rotate(${f(-(angBD - Math.PI) / (Math.PI / 180))} ${f(pBD[0])} ${f(pBD[1])})` },
    lAD: { ...lab(pAD[0], pAD[1] + 5, "middle", "1") },
    hB: { cx: f(B[0]), cy: f(B[1]) }, hD: { cx: f(D[0]), cy: f(D[1]) },
  };
}
