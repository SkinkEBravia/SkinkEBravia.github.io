// Site-wide micro-interactions. Everything degrades to static content.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GLYPHS = "█▓▒░<>/\\=+*#%&$@01ΣΔΞ";

/** Scramble-then-resolve a text node, left to right. */
export function decode(el: HTMLElement, duration = 520) {
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

for (const el of document.querySelectorAll<HTMLElement>("[data-decode]")) {
  const host = el.closest("a, button") ?? el;
  host.addEventListener("pointerenter", () => decode(el));
}

// reveal on scroll
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("is-in"), io.unobserve(e.target))),
  { rootMargin: "0px 0px -8% 0px" },
);
document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

// glitch on hover for anything marked .glitch (outside the hero, which the shader drives)
for (const el of document.querySelectorAll<HTMLElement>(".glitch:not([data-signal])")) {
  el.parentElement?.addEventListener("pointerenter", () => {
    el.classList.add("is-glitching");
    setTimeout(() => el.classList.remove("is-glitching"), 380);
  });
}

// cursor-follow preview for index rows
const preview = document.querySelector<HTMLElement>("[data-preview]");
if (preview && matchMedia("(hover: hover)").matches) {
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
  const follow = () => {
    cx += (x - cx) * 0.16; cy += (y - cy) * 0.16;
    preview.style.transform = `translate3d(${cx}px, ${cy}px, 0) rotate(${(x - cx) * 0.04}deg)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(follow) : 0;
  };
  addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(follow); });
  for (const row of document.querySelectorAll<HTMLElement>("[data-row]")) {
    row.addEventListener("pointerenter", () => {
      preview.style.setProperty("--a", row.dataset.h1 + "deg");
      preview.style.setProperty("--b", row.dataset.h2 + "deg");
      const img = row.dataset.cover;
      preview.style.backgroundImage = img ? `url(${img})` : "";
      preview.dataset.kind = img ? "image" : "gen";
      preview.querySelector("span")!.textContent = row.dataset.kind ?? "";
      preview.classList.add("on");
    });
    row.addEventListener("pointerleave", () => preview.classList.remove("on"));
  }
}

// marquee speed follows scroll velocity
const marquees = document.querySelectorAll<HTMLElement>("[data-marquee]");
if (marquees.length && !reduce) {
  let last = scrollY, v = 0, off = 0;
  const loop = () => {
    const d = scrollY - last; last = scrollY;
    v += (d - v) * 0.1;
    off -= 0.6 + Math.abs(v) * 0.35;
    marquees.forEach((m) => {
      const w = (m.firstElementChild as HTMLElement).offsetWidth;
      m.style.transform = `translate3d(${off % w}px,0,0) skewX(${Math.max(-12, Math.min(12, -v * 0.4))}deg)`;
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// copy buttons (BibTeX)
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  b.addEventListener("click", async () => {
    const src = document.getElementById(b.dataset.copy!);
    if (!src) return;
    await navigator.clipboard.writeText(src.textContent ?? "");
    const t = b.textContent; b.textContent = "Copied ✓";
    setTimeout(() => (b.textContent = t), 1400);
  });
}
