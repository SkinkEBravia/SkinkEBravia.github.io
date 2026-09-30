// Geometry for the double-angle figure: unit circle, A = (−1, 0), B = (1, 0),
// P at 2θ. The inscribed angle at A is θ; the central angle at O is 2θ.
// Unit = U svg units, y down.
import { arc, f, rightMark, type Layout } from "./geom";

export const U = 120;
export const VB = { x: -170, y: -158, w: 340, h: 238 };
type Pt = [number, number];
const line = (a: Pt, b: Pt) => ({ x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]) });
const lab = (x: number, y: number, anchor: string, text: string) => ({ x: f(x), y: f(y), "text-anchor": anchor, text });

function bracket(x0: number, x1: number, y: number) {
  return { d: `M${f(x0)} ${f(y - 5)} V${f(y)} H${f(x1)} V${f(y - 5)}` };
}

export function layout(theta: number): Layout {
  const c2 = Math.cos(2 * theta), s2 = Math.sin(2 * theta);
  const O: Pt = [0, 0], A: Pt = [-U, 0], B: Pt = [U, 0];
  const P: Pt = [c2 * U, -s2 * U], F: Pt = [c2 * U, 0];
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const mAP = mid(A, P), mPB = mid(P, B), mOP = mid(O, P);
  // unit normals pointing away from the triangle's inside (upwards-outwards)
  const nAP: Pt = [-Math.sin(theta), -Math.cos(theta)];
  const nPB: Pt = [Math.cos(theta), -Math.sin(theta)];
  const small = Math.abs(F[0]) < 34;

  return {
    AP: line(A, P), PB: line(P, B), PF: line(P, F), OF: line(O, F), OP: line(O, P), OA: line(O, A), OB: line(O, B),
    triAPF: { points: [A, P, F].map((p) => `${f(p[0])},${f(p[1])}`).join(" ") },
    rF: { d: rightMark(F, B, P, 7), opacity: s2 > 0.1 ? 1 : 0 },
    rP: { d: rightMark(P, A, B, 7) },
    arcA: { d: arc(A[0], A[1], 34, 0, theta) },
    arcO: { d: arc(0, 0, 22, 0, 2 * theta) },
    lth: lab(A[0] + 46 * Math.cos(theta / 2), -46 * Math.sin(theta / 2) + 5, "middle", "θ"),
    l2th: lab(34 * Math.cos(theta), -34 * Math.sin(theta) + 5, "middle", "2θ"),
    lAP: lab(mAP[0] + nAP[0] * 14, mAP[1] + nAP[1] * 14 + 5, "end", "2 cos θ"),
    lPB: lab(mPB[0] + nPB[0] * 14, mPB[1] + nPB[1] * 14 + 5, "start", "2 sin θ"),
    // sin 2θ runs up beside PF, on the side away from the radius OP
    lPF: { ...lab(F[0] + (c2 >= 0 ? 13 : -7), P[1] / 2, "middle", "sin 2θ"), transform: `rotate(-90 ${f(F[0] + (c2 >= 0 ? 13 : -7))} ${f(P[1] / 2)})` },
    lOF: lab(c2 >= 0 ? 7 : -7, 19, c2 >= 0 ? "start" : "end", small ? "" : "cos 2θ"),
    lO: lab(c2 >= 0 ? -6 : 6, 19, c2 >= 0 ? "end" : "start", "O"),
    lOP: lab(mOP[0] + nPB[0] * 0 + 10 * Math.sin(2 * theta), mOP[1] + 10 * Math.cos(2 * theta) + 5, "middle", "1"),
    lOA: lab(-U * 0.35, -8, "middle", "1"),
    lOB: lab(F[0] > U * 0.5 ? U * 0.25 : U * 0.74, -8, "middle", "1"),
    bAF: bracket(A[0], F[0] - 2, 40), bFB: bracket(F[0] + 2, B[0], 40),
    lAF: lab((A[0] + F[0]) / 2, 60, "middle", "2cos²θ"),
    lFB: lab((F[0] + B[0]) / 2, 60, "middle", "2sin²θ"),
    P: { cx: f(P[0]), cy: f(P[1]) }, handle: { cx: f(P[0]), cy: f(P[1]) }, Fd: { cx: f(F[0]), cy: "0" },
    lP: lab(P[0] + 12 * Math.cos(2 * theta), P[1] - 12 * Math.sin(2 * theta) + 4, Math.cos(2 * theta) > 0.2 ? "start" : Math.cos(2 * theta) < -0.2 ? "end" : "middle", "P"),
    lF: lab(F[0], 19, "middle", small ? "F" : ""),
  };
}
