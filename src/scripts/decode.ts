// Text that scrambles through the glitch glyphs and settles, left to right.
export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const GLYPHS = "█▓▒░<>/\\=+*#%&$@01ΣΔΞ";

/** Scramble-then-resolve a text node, left to right. */
export function decode(el: HTMLElement | SVGElement, duration = 520) {
  if (reduce) return;
  const target = el.dataset.decodeText ?? (el.dataset.decodeText = el.textContent ?? "");
  const start = performance.now();
  const id = ((el as any).__decode = ((el as any).__decode ?? 0) + 1);
  const tick = (now: number) => {
    if ((el as any).__decode !== id) return;
    const p = Math.min(1, (now - start) / duration);
    const settled = Math.floor(p * target.length * 1.1);
    let s = "";
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      s += i < settled || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = s;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
}
