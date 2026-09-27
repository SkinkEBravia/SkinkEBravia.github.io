/*
 * SIGNAL (live). A render pipeline eating itself.
 *
 * Pass A raymarches an iridescent gyroid sculpture. During corruption bursts,
 *        macroblocks leak the renderer's own AOVs (normals, depth, iteration heat).
 * Pass B glitch post: slice tearing, macroblock displacement, datamosh
 *        posterization, pixel-sort smear, chroma split, ACES, scanlines.
 *
 * Bursts are scheduled, and also triggered by fast scrolling or pointer motion.
 * A `signal:burst` event lets the DOM (the name) glitch in sync.
 */
const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

const COMMON = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform vec2 R; uniform float T; uniform float B; uniform float S; uniform vec2 M; uniform float SC; uniform float MW; uniform vec4 SK; uniform vec2 ST; uniform float SS;
#define TAU 6.28318530718
float h1(float n){ return fract(sin(n*127.1)*43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
`;

const SCENE = COMMON + `
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
// Gielis superformula: r(a) = (|cos(m a/4)|^n2 + |sin(m a/4)|^n3)^(-1/n1), with a = b = 1
float sf(float a, vec4 k){
  float t = k.x*a*.25;
  return min(pow(pow(abs(cos(t)), k.z) + pow(abs(sin(t)), k.w), -1./k.y), 3.);
}
// Isotropic 3D superformula ("urchin"). The 2D curve has one spike every 2*pi/m radians, so we
// lay spikes over the sphere at that same angular spacing (latitude rings, staggered), find the
// spike nearest to p's direction, and revolve the 2D spike profile around it:
//   R(dir) = r(phi_tip + psi * stretch),  psi = angle between dir and its nearest spike.
// Every spike keeps the 2D cross-section and the symmetry holds in all directions.
vec3 sph(float la, float az){ return vec3(cos(la)*cos(az), cos(la)*sin(az), sin(la)); }
float nearestSpike(vec3 d, float D){
  const float PI = 3.14159265;
  float lat = asin(clamp(d.z, -1., 1.)), th = atan(d.y, d.x);
  float nr = max(2., floor(PI/D + .5)), dl = PI/nr;
  float i0 = floor((lat + PI*.5)/dl + .5);
  float best = -1.;
  for(int k=-1;k<=1;k++){
    float i = clamp(i0 + float(k), 0., nr);
    float la = -PI*.5 + i*dl;
    float n = max(1., floor(TAU*cos(la)/D + .5));
    float st = TAU/n, off = mod(i, 2.)*.5*st;
    float j = floor((th - off)/st + .5);
    best = max(best, dot(d, sph(la, off + j*st)));
  }
  return acos(clamp(best, -1., 1.));
}
float superD(vec3 p){
  float len = length(p);
  float D = TAU/SK.x;
  float psi = min(nearestSpike(p/max(len, 1e-4), D), D*.5);
  float R = sf(ST.x + psi*ST.y, SK) * SS;
  return (len - R) * .45;   // a bound, not a true distance: spikes are steep
}
float gyroidD(vec3 p){
  float k = 4.3 + .8*sin(T*.31);
  vec3 q = p*k;
  float g = abs(dot(sin(q), cos(q.zxy)))/k - .04;
  return max(length(p) - 1.12, g*.75);
}
float coreD(vec3 p){ return length(p) - (.42 + .05*sin(T*1.7)); }
float map(vec3 p){
  // both forms tumble slowly and lean toward the pointer
  vec3 g = p;
  g.yz *= rot(M.y*.5 + .25*sin(T*.21));
  g.xz *= rot(T*.18 + M.x*.9);
  vec3 f = p;
  f.yz *= rot(.3*sin(T*.17) + M.y*.6);
  f.xz *= rot(T*.12 + M.x*1.2);
  float body = MW < .001 ? gyroidD(g) : MW > .999 ? superD(f) : mix(gyroidD(g), superD(f), MW);
  return min(body, coreD(g) + MW*.7);   // the core recedes as the urchin forms
}
vec3 nrm(vec3 p){
  vec2 e = vec2(.0015,0);
  return normalize(vec3(map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx)));
}
vec3 env(vec3 d){
  vec3 c = vec3(.004,.004,.007);
  c += vec3(1.)*smoothstep(.97,.99, abs(d.x*.8+d.y*.6))*1.6;
  c += vec3(1.)*smoothstep(.93,.96, d.y)*2.2;
  c += vec3(1.,.08,.35)*pow(max(0.,-d.x),6.)*1.4;
  c += vec3(0.,.9,1.)*pow(max(0., d.x*.7-d.y*.7),5.)*1.3;
  return c;
}
void main(){
  vec2 f = uv*R;
  float bs = mix(24., 48., h1(floor(S*7.)));
  vec2 blk = floor(f/(bs*R.y/360.));
  float bh = h2(blk + floor(S*13.));
  int aov = B > .05 && bh < B*.5 ? int(mod(bh*97., 3.)) + 1 : 0;

  vec2 p = (f - .5*R)/min(R.x*1.15, R.y);
  p.y -= .04;
  vec3 ro = vec3(0,0,5. - SC*2.2), rd = normalize(vec3(p, -1.55));
  float t = 0., d; int i;
  float stepK = mix(.8, .55, MW);
  for(i=0;i<200;i++){ d = map(ro+rd*t); if(d < .0006*t || t > 8.) break; t += d*stepK; }
  bool hit = t < 8. && d < .004*t;   // rays that run out of steps while grazing a spike are misses

  vec3 col = vec3(0);
  vec2 g = fract(f/(16.*R.y/720.)) - .5;
  col += vec3(.05,.06,.08) * smoothstep(.1,.0,length(g)) * .8;
  col += vec3(.18,.02,.10) * exp(-abs(p.y+.02)*6.) * .3;

  vec3 n = vec3(0);
  if(hit){
    vec3 pos = ro+rd*t; n = nrm(pos);
    vec3 r = reflect(rd, n);
    float fr = pow(1.-max(0.,dot(n,-rd)), 2.);
    vec3 film = .5+.5*cos(TAU*(fr*1.6 + dot(n, vec3(.3,.5,.2)) + T*.08 + vec3(0.,.33,.67)));
    col = env(r) * mix(vec3(.9), film*1.5, .75);
    col += film * fr * .35;
    float ao = clamp(map(pos+n*.08)/.08, 0., 1.);
    col *= .35 + .65*ao;
    vec3 gp = pos; gp.yz *= rot(M.y*.5 + .25*sin(T*.21)); gp.xz *= rot(T*.18 + M.x*.9);
    if(MW < .5 && coreD(gp) < .01) col = vec3(1.,.25,.1)*2.5*(1.-fr) + env(r);
  } else aov = 0;

  if(aov == 1) col = n*.5+.5;
  if(aov == 2) col = vec3(pow(1.-(t-2.)/3., 2.));
  if(aov == 3){ float x = float(i)/200.; col = (.5+.5*cos(TAU*(x*.9 + vec3(.0,.1,.2))))*x*1.6; }
  o = vec4(col, 1.);
}`;

const POST = COMMON + `
uniform sampler2D SRC;
vec3 tone(vec3 c){ c = max(c, 0.); return c*(2.51*c+.03)/(c*(2.43*c+.59)+.14); }
vec3 smp(vec2 u){ return texture(SRC, u).rgb; }
void main(){
  float px = R.y/360.;
  vec2 f = uv*R, u = uv;
  float fs = floor(S*13.);
  float band = floor(f.y / (px*mix(4., 38., h1(floor(f.y/(41.*px))+fs))));
  if(h1(band + fs*1.7) < B*.32) u.x += (h1(band*3.1+fs) - .5) * .3 * B;
  float bs = mix(24., 48., h1(floor(S*7.)))*px;
  vec2 blk = floor(f/bs);
  if(h2(blk + fs) < B*.16) u += (vec2(h2(blk+3.1+fs), h2(blk+7.7+fs)) - .5) * vec2(.2,.1) * B;
  bool mosh = h2(blk*1.3 + fs + 5.) < B*.14;
  if(mosh) u = (floor(u*R/(8.*px))*8.*px + 4.*px)/R;
  float ca = (.0012 + .016*B*B) * (1. + 1.5*abs(uv.x-.5));
  vec3 col = vec3(smp(u + vec2(ca,0)).r, smp(u).g, smp(u - vec2(ca, ca*.3)).b);
  if(h1(floor(f.y/(3.*px)) + fs*.37) < B*.22){
    for(int k=1;k<14;k++){
      vec3 c2 = smp(u - vec2(float(k)*.006*B, 0.));
      if(dot(c2, vec3(.3,.59,.11)) > dot(col, vec3(.3,.59,.11))) col = c2;
    }
  }
  if(mosh) col = floor(col*4.)/4.;
  col = tone(col*1.15);
  col *= .9 + .1*sin(f.y/px*3.14159);
  col += vec3(.03,.035,.045) * smoothstep(.02,.0,abs(fract(uv.y*.7 - T*.35)-.5));
  vec2 v = uv-.5; col *= 1. - dot(v*vec2(.8,1.3), v*vec2(.8,1.3));
  col *= 1. - SC*.7;
  col += (h2(f + fs) - .5) * .04 * B * B;
  if(B > .9 && h1(fs) < .5) col = 1. - col;
  o = vec4(pow(clamp(col,0.,1.), vec3(1./2.2)), 1.);
}`;

/** Superformula presets [m, n1, n2, n3]; each becomes an urchin with the 2D curve's spike profile. */
export const FORMS: { name: string; k: number[] }[] = [
  { name: "Sunburst", k: [19, 9, 14, 11] },
  { name: "Urchin", k: [12, 1.5, 6, 6] },
  { name: "Star", k: [14, 0.4, 1, 1] },
  { name: "Pollen", k: [20, 2, 4, 4] },
];

const sfJS = (ang: number, [m, n1, n2, n3]: number[]) =>
  Math.min(3, (Math.abs(Math.cos((m * ang) / 4)) ** n2 + Math.abs(Math.sin((m * ang) / 4)) ** n3) ** (-1 / n1));

/**
 * Per-preset constants: where the spike tip sits in the 2D period, how far (and which way) the
 * valley is, so a half spike-spacing of psi maps tip -> valley, and a scale for a max radius ~1.28.
 */
function spikeFit(k: number[]) {
  const period = (2 * Math.PI) / k[0], N = 2000;
  let tip = 0, rMax = -1;
  for (let i = 0; i < N; i++) { const a = (i / N) * period, r = sfJS(a, k); if (r > rMax) { rMax = r; tip = a; } }
  let valley = tip, rMin = Infinity;
  for (let i = 0; i <= N; i++) { const a = tip + (i / N) * period * 0.5, r = sfJS(a, k); if (r < rMin) { rMin = r; valley = a; } }
  return { tip, stretch: (valley - tip) / (period / 2), scale: 1.28 / rMax };
}
const FITS = FORMS.map((f) => spikeFit(f.k));

/*
 * Form timeline (seconds, one cycle): gyroid holds, a glitch carries it into an urchin,
 * the urchin breathes and changes species mid-burst, then dissolves back into the lattice.
 */
const CYCLE = 22;
const smooth = (x: number) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
export function formAt(t: number) {
  const c = Math.floor(t / CYCLE), u = t - c * CYCLE;
  const w = smooth((u - 5) / 2.2) * (1 - smooth((u - 18.5) / 2.2));
  const species = c * 2 + (u > 12 ? 1 : 0);
  const f = FORMS[((species % FORMS.length) + FORMS.length) % FORMS.length];
  const breathe = 1 + 0.06 * Math.sin(t * 0.9);
  const k = [f.k[0], f.k[1] * breathe, f.k[2], f.k[3]];
  // bursts that mask each change: entering the urchin, species swap, leaving it
  const hit = (at: number, len: number, peak: number) =>
    u > at && u < at + len ? peak * Math.sqrt(Math.sin((Math.PI * (u - at)) / len)) : 0;
  const burst = Math.max(hit(4.7, 0.9, 0.85), hit(11.6, 0.8, 1), hit(18.3, 0.9, 0.8));
  return { w, k, name: f.name, burst, fit: FITS[FORMS.indexOf(f)] };
}

export function mountSignal(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) { canvas.dataset.fallback = "true"; return; }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const qs = new URLSearchParams(location.search);
  const freeze = qs.get("form");            // ?form=gyroid|0..n  still frames for testing
  const startAt = +(qs.get("at") ?? 0);     // ?at=seconds        jump into the form timeline

  const prog = (fs: string) => {
    const p = gl.createProgram()!;
    for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]] as const) {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "");
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p);
    const u = (n: string) => gl.getUniformLocation(p, n);
    return { p, R: u("R"), T: u("T"), B: u("B"), S: u("S"), M: u("M"), SC: u("SC"), SRC: u("SRC"), MW: u("MW"), SK: u("SK"), ST: u("ST"), SS: u("SS") };
  };
  const scene = prog(SCENE), post = prog(POST);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const half = !!gl.getExtension("EXT_color_buffer_float");
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  let W = 0, H = 0, quality = matchMedia("(pointer: coarse)").matches ? 0.5 : 0.75;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio, 1.5) * quality;
    const w = Math.max(160, Math.round(r.width * scale)), h = Math.max(90, Math.round(r.height * scale));
    if (w === W && h === H) return;
    W = canvas.width = w; H = canvas.height = h;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, half ? gl.RGBA16F : gl.RGBA8, W, H, 0, gl.RGBA, half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // ---- input
  let mx = 0, my = 0, tmx = 0, tmy = 0, kick = 0, lastScroll = scrollY, scrollAmt = 0;
  addEventListener("pointermove", (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    kick = Math.min(0.7, kick + Math.hypot(nx - tmx, ny - tmy) * 0.9);
    tmx = nx; tmy = ny;
  }, { passive: true });
  addEventListener("scroll", () => {
    const d = Math.abs(scrollY - lastScroll); lastScroll = scrollY;
    kick = Math.min(0.85, kick + d / 900);
  }, { passive: true });

  // ---- burst schedule: quiet passages, then a hit
  let nextBurst = 1.2, burstStart = -10, burstLen = 0, burstPeak = 0;
  const burstAt = (t: number) => {
    if (t > nextBurst) {
      burstStart = t; burstLen = 0.18 + Math.random() * 0.45; burstPeak = 0.55 + Math.random() * 0.45;
      nextBurst = t + 6 + Math.random() * 6;
    }
    const k = (t - burstStart) / burstLen;
    let b = k >= 0 && k < 1 ? burstPeak * Math.sqrt(Math.sin(Math.PI * k)) : 0;
    if (Math.random() < 0.02) b = Math.max(b, 0.15 + Math.random() * 0.2);
    return b;
  };

  let visible = true, running = false, t0 = performance.now() - startAt * 1000, frame = 0, glitching = false;
  let slow = 0, fast = 0, lastNow = performance.now();

  const draw = (now: number) => {
    const t = Math.max(0, (now - t0) / 1000);
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    kick *= 0.92;
    const hero = canvas.parentElement!.getBoundingClientRect();
    scrollAmt = Math.min(1, Math.max(0, -hero.top / hero.height));
    let form = formAt(t);
    if (freeze !== null) {
      const i = FORMS[+freeze] ? +freeze : 0;
      form = { w: freeze === "gyroid" ? 0 : 1, k: FORMS[i].k, name: FORMS[i].name, burst: 0, fit: FITS[i] };
    }
    const B = reduce || freeze !== null ? 0 : Math.min(1, Math.max(burstAt(t), form.burst) + kick);
    dispatchEvent(new CustomEvent("signal:form", { detail: form }));

    const on = B > 0.12;
    if (on !== glitching) { glitching = on; dispatchEvent(new CustomEvent("signal:burst", { detail: on })); }

    // hold the glitch "seed" for 2 frames so blocks read as codec errors, not noise
    const seed = Math.floor(frame / 2) + 0.5;
    for (const [pr, target] of [[scene, fbo], [post, null]] as const) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.viewport(0, 0, W, H);
      gl.useProgram(pr.p);
      gl.uniform2f(pr.R, W, H); gl.uniform1f(pr.T, t); gl.uniform1f(pr.B, B);
      gl.uniform1f(pr.S, seed); gl.uniform2f(pr.M, mx, my); gl.uniform1f(pr.SC, scrollAmt);
      gl.uniform1f(pr.MW, form.w); gl.uniform4fv(pr.SK, form.k); gl.uniform2f(pr.ST, form.fit.tip, form.fit.stretch); gl.uniform1f(pr.SS, form.fit.scale);
      if (target === null) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(pr.SRC, 0); }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    frame++;

    // adaptive resolution: keep ~50+ fps
    const dt = now - lastNow; lastNow = now;
    if (dt > 26) { slow++; fast = 0; } else if (dt < 17) { fast++; slow = 0; }
    if (slow > 20 && quality > 0.35) { quality *= 0.85; slow = 0; resize(); }
    if (fast > 180 && quality < 0.9) { quality *= 1.08; fast = 0; resize(); }
  };

  const loop = (now: number) => {
    if (!visible || document.hidden) { running = false; return; }
    draw(now);
    requestAnimationFrame(loop);
  };
  const start = () => { if (!running && !reduce) { running = true; lastNow = performance.now(); requestAnimationFrame(loop); } };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(canvas);
  document.addEventListener("visibilitychange", () => !document.hidden && start());

  if (reduce) draw(performance.now() + 4000); else start();
  canvas.classList.add("is-live");
}
