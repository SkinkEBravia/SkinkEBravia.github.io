// Geometry for the symmetry figure: one point P at θ on the unit circle,
// its four mirror images and its two quarter-turns. Unit = 100 svg units, y down.
import { arc, f, type Layout } from "./geom";

export const U = 100;
export const VB = { x: -178, y: -150, w: 356, h: 300 };
const S = (a: number, r = 1): [number, number] => [r * U * Math.cos(a), -r * U * Math.sin(a)];
const line = (a: [number, number], b: [number, number]) => ({ x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]) });
const dot = (p: [number, number]) => ({ cx: f(p[0]), cy: f(p[1]) });

function label(a: number, text: string, r = 1.2) {
  const [x, y] = S(a, r), c = Math.cos(a);
  return { x: f(x), y: f(y + 6), "text-anchor": c > 0.35 ? "start" : c < -0.35 ? "end" : "middle", text };
}

/** Legs of the right triangle under point at angle a: cos leg on the x axis, sin leg vertical. */
function legs(k: string, a: number): Layout {
  const P = S(a), F: [number, number] = [P[0], 0];
  return { [`${k}c`]: line([0, 0], F), [`${k}s`]: line(F, P) };
}
/** Legs of the rotated triangle: the image of (O→F, F→P) under rotation by q. */
function turnedLegs(k: string, a: number, q: number): Layout {
  const r = Math.cos(a); // length of the cos leg, signed
  const Fq: [number, number] = [r * U * Math.cos(q), -r * U * Math.sin(q)];
  const Pq = S(a + q);
  return { [`${k}c`]: line([0, 0], Fq), [`${k}s`]: line(Fq, Pq) };
}

export const IMAGES = [
  { k: "i1", a: (t: number) => Math.PI - t, text: "π − θ" },
  { k: "i2", a: (t: number) => -t, text: "−θ" },
  { k: "i3", a: (t: number) => Math.PI + t, text: "π + θ" },
  { k: "i4", a: (t: number) => Math.PI / 2 - t, text: "π/2 − θ" },
  { k: "rp", a: (t: number) => t + Math.PI / 2, text: "θ + π/2" },
  { k: "rm", a: (t: number) => t - Math.PI / 2, text: "θ − π/2" },
];

export function layout(theta: number): Layout {
  const P = S(theta);
  const L: Layout = {
    rad: line([0, 0], P), P: dot(P), handle: dot(P),
    lp: label(theta, "θ"),
    ...legs("p", theta),
    arc: { d: arc(0, 0, 20, 0, theta) },
    tanline: line(S(theta + Math.PI, 1.38), S(theta, 1.38)),
  };
  for (const im of IMAGES) {
    const a = im.a(theta), Q = S(a);
    L[`${im.k}r`] = line([0, 0], Q);
    L[`${im.k}d`] = dot(Q);
    L[`${im.k}l`] = label(a, im.text);
  }
  Object.assign(L, legs("i1", Math.PI - theta), legs("i2", -theta), legs("i3", Math.PI + theta), legs("i4", Math.PI / 2 - theta));
  Object.assign(L, turnedLegs("rp", theta, Math.PI / 2), turnedLegs("rm", theta, -Math.PI / 2));
  L.arp = { d: arc(0, 0, 1.12 * U, theta, theta + Math.PI / 2) };
  L.arm = { d: arc(0, 0, 1.12 * U, theta, theta - Math.PI / 2) };
  return L;
}

export const quadrant = (theta: number) => {
  const t = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor(t / (Math.PI / 2)) + 1;
};
