"""Synthesize the INTRUSION soundtrack from the same events the picture uses.

    python3 studio/note01/audio.py <frames_dir>   # reads events.json there, writes soundtrack.wav

Archive sections get a warm pad and small construction sounds (one chime per noise octave, one
plink per traced light path). Signal shots get their own "thinking" sounds: white noise that is
progressively denoised into a chord (sampling), bleeps (the cache query), fast arpeggios (weights
updating), falling glissandi (gradient descent). Breaches, cuts, typing, shouts and the outro
heartbeat follow the event list.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "frames")
ev = json.loads((out_dir / "events.json").read_text())
DUR = ev["frames"] / ev["fps"]
N = int(DUR * SR)
mix = np.zeros((2, N))
rng = np.random.default_rng(7)


def add(x, a, gain=1.0, pan=0.0):
    i = int(round(a * SR))
    if i >= N:
        return
    if i < 0:
        x, i = x[-i:], 0
    x = x[: N - i]
    mix[0, i : i + len(x)] += x * gain * np.sqrt(0.5 * (1 - pan))
    mix[1, i : i + len(x)] += x * gain * np.sqrt(0.5 * (1 + pan))


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r):
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, fc, order=2):
    b, a = butter(order, min(fc / (SR / 2), 0.99))
    return lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], btype="band")
    return lfilter(b, a, x)


def crush(x, bits, hold):
    x = np.repeat(x[::hold], hold)[: len(x)]
    q = 2**bits
    return np.round(x * q) / q


def pad(freqs, d, bright=0.3):
    t = tt(d)
    y = sum(np.sin(2 * np.pi * f * t + k) * (1 if k == 0 else 0.6) + bright * np.sin(2 * np.pi * f * 2.003 * t) for k, f in enumerate(freqs))
    return y * (0.82 + 0.18 * np.sin(2 * np.pi * 0.21 * t))


def bell(f, d=2.4, decay=2.2):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * decay) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * decay * 2.5)


chapters = ev["chapters"]
CHORDS = {1: [110.0, 164.81, 220.0, 277.18, 329.63], 2: [98.0, 146.83, 196.0, 246.94, 293.66],
          3: [87.31, 130.81, 174.61, 220.0, 261.63], 4: [103.83, 155.56, 207.65, 261.63, 311.13]}

# ---- tape room tone throughout (quiet, filtered)
mix += lp(rng.standard_normal((2, N)), 5000) * 0.006

# ---- boot: a hum that comes up, a sync tone, the flash
b = ev["boot"]
t = tt(b["end"])
add((np.sin(2 * np.pi * 50 * t) + 0.4 * np.sin(2 * np.pi * 100 * t)) * np.clip(t / 1.2, 0, 1) * 0.05, 0)
st = tt(0.35)
add(np.sin(2 * np.pi * np.cumsum(np.linspace(400, 2400, len(st))) / SR) * np.linspace(0, 1, len(st)) ** 2 * 0.06, b["end"] - 0.35)

for c in chapters:
    cid, a, br, e = c["id"], c["start"], c["breach"], c["end"]
    ch = CHORDS[cid]
    shots = {}
    for s in c["shots"]:
        shots.setdefault(s["kind"], s)
    # ---- calm pad until the breach
    d = br - a
    y = pad(ch, d, 0.25 + 0.1 * cid) * env(int(d * SR), 1.0, 0.04)
    add(y * 0.03, a, pan=-0.25)
    add(y * 0.03, a + 0.011, pan=0.25)
    add(bell(ch[-1] * 2) * 0.05, a + 0.15, pan=0.1)
    if cid == 1:
        # one chime per noise octave: each octave doubles the frequency
        o = shots["octaves"]["start"]
        add(bell(220, 2.5) * 0.05, shots["lattice"]["start"] + 0.2, pan=-0.3)
        for k in range(1, 6):
            add(bell(220 * 2 ** (k * 0.5), 1.6, 2.8) * 0.045, o + 0.1 + 0.36 * (k - 1), pan=-0.4 + 0.16 * k)
        # the heightfield rises: a slow swell
        r = shots["rise"]
        dd = r["end"] - r["start"] + 1.5
        sw = pad([55, 82.4, 110], dd, 0.1) * np.linspace(0, 1, int(dd * SR)) ** 2
        add(sw * env(len(sw), 0.1, 1.2) * 0.04, r["start"])
        # sunrise: a bright shimmer
        dn = shots["dawn"]
        st = tt(2.6)
        shimmer = sum(np.sin(2 * np.pi * f * st) for f in (659.3, 880.0, 987.8, 1318.5)) * np.sin(np.pi * st / 2.6) ** 2
        add(shimmer * 0.01, dn["start"] + 0.2, pan=0.3)
    if cid == 2:
        # one soft plink per traced path
        s0 = shots["paths"]["start"]
        for i in range(34):
            f = rng.choice([1174.7, 1318.5, 1568.0, 1760.0, 2093.0])
            add(bell(f, 0.5, 9) * 0.016, s0 + 0.25 + i * 0.13, pan=float(rng.uniform(-0.6, 0.6)))

    # ---- breach: sub drop + crushed noise slam
    t = tt(1.6)
    f = 90 * np.exp(-t * 1.6) + 32
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8)
    add(np.tanh(sub * 2.5) * 0.26, br)
    nz = rng.standard_normal(int(0.9 * SR)) * np.exp(-tt(0.9) * 4)
    add(crush(nz, 3, 9) * 0.12, br, pan=-0.3)
    add(crush(nz[::-1] * 0.5, 4, 5) * 0.1, br + 0.02, pan=0.3)

    # ---- drone while the signal runs; it gets heavier every chapter
    d = e - br
    t = tt(d)
    ramp = np.clip(t / max(d - 0.5, 0.1), 0, 1) ** 1.4
    saw = lambda fr: 2 * ((t * fr) % 1) - 1
    base = ch[0] / 2
    drone = (saw(base) + saw(base * 1.0595) + 0.5 * saw(base * 2.007)) * 0.33
    drone = lp(np.tanh(drone * (1 + 2.5 * ramp + 0.5 * cid)), 700 + 500 * cid)
    pulse = 0.6 + 0.4 * (np.sin(2 * np.pi * (1.5 + 0.5 * cid) * t) > 0)
    whine = np.sin(2 * np.pi * (2900 + 200 * np.sin(2 * np.pi * 0.6 * t)) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 5 * t))
    body = (drone * pulse * (0.05 + 0.015 * cid) + whine * 0.006) * (0.35 + 0.65 * ramp)
    body *= env(len(body), 0.3, 0.05)
    add(body, br, pan=-0.12)
    add(body * 0.9, br + 0.013, pan=0.12)

    # ---- signal shots: the sound of the new way of thinking
    for s in c["shots"]:
        k, s0, s1 = s["kind"], s["start"], s["end"]
        d = s1 - s0
        t = tt(d)
        n = len(t)
        if n == 0:
            continue
        if k in ("sig-samples", "sig-sde", "latent"):
            # white noise, progressively denoised into the chapter chord
            p = np.clip(t / (d * (0.85 if k != "latent" else 0.75)), 0, 1)
            nzs = bp(rng.standard_normal(n), 300, 9000) * (1 - p) ** 1.5
            tone = sum(np.sin(2 * np.pi * f * 2 * t + i) for i, f in enumerate(ch)) / len(ch) * p**2
            ticks = np.zeros(n)
            for j in range(0, n, int(SR / 24)):
                m = min(120, n - j)
                ticks[j : j + m] += np.exp(-np.arange(m) / 20) * 0.5
            y = (nzs * 0.35 + tone * 0.5 + ticks * 0.08 * (1 - p)) * env(n, 0.02, 0.08)
            g = 0.16 if k != "latent" else 0.1
            add(y * g, s0, pan=-0.2)
            add(np.roll(y, 300) * g, s0, pan=0.2)
        elif k == "sig-cut":
            # cache queries: square-wave bleeps
            y = np.zeros(n)
            for j in range(int(d * 22)):
                i0 = int(j * SR / 22)
                ln = min(int(0.035 * SR), n - i0)
                if ln <= 0:
                    break
                f = rng.choice([880, 1320, 1760, 2640]) * (1 + 0.02 * rng.standard_normal())
                y[i0 : i0 + ln] += np.sign(np.sin(2 * np.pi * f * np.arange(ln) / SR)) * np.hanning(ln)
            add(lp(y, 6000) * 0.05, s0, pan=0.25)
        elif k == "sig-weights":
            # weights updating: a fast, never-settling arpeggio
            y = np.zeros(n)
            step = int(SR / 18)
            for j, i0 in enumerate(range(0, n, step)):
                ln = min(step, n - i0)
                f = ch[j % len(ch)] * 2 ** int(rng.integers(1, 4)) * (1 + 0.03 * rng.standard_normal())
                y[i0 : i0 + ln] += np.sin(2 * np.pi * f * np.arange(ln) / SR) * np.exp(-np.arange(ln) / SR * 30)
            add(y * 0.07, s0, pan=-0.3)
            add(np.roll(y, 900) * 0.05, s0, pan=0.3)
        elif k == "sig-loss":
            # gradient descent: many voices gliding downhill, settling in the valleys
            y = np.zeros(n)
            for v in range(7):
                f0, f1 = rng.uniform(500, 1400), rng.uniform(70, 160)
                fr = f1 + (f0 - f1) * np.exp(-t * rng.uniform(1.5, 3.5))
                y += np.sin(2 * np.pi * np.cumsum(fr) / SR + v) * (0.8 + 0.2 * np.sin(2 * np.pi * rng.uniform(3, 7) * t))
            add(lp(y / 7, 3000) * env(n, 0.02, 0.1) * 0.14, s0)
        elif k == "splats":
            # thousands of tiny grains that settle
            y = np.zeros(n)
            for _ in range(int(d * 180)):
                i0 = int(rng.uniform(0, max(1, n - 400)))
                m = min(400, n - i0)
                y[i0 : i0 + m] += np.sin(2 * np.pi * rng.uniform(1500, 5000) * np.arange(m) / SR) * np.hanning(m) * rng.uniform(0.2, 1)
            add(y * np.linspace(1, 0.4, n) * 0.02, s0, pan=float(rng.uniform(-0.3, 0.3)))

    # ---- the shout: a distorted cluster hit
    t = tt(1.9)
    hit = sum(np.sin(2 * np.pi * f * t) for f in (73.4, 77.8, 146.8, 155.6, 311.1))
    add(np.tanh(hit * 3) * np.exp(-t * 1.2) * 0.15, c["shoutAt"])

# ---- glitch bursts: gated, crushed noise stutters
for e in ev["bursts"]:
    n = int(e["d"] * SR)
    if n <= 0:
        continue
    nz = rng.standard_normal(n)
    gate = (np.sin(2 * np.pi * rng.uniform(18, 60) * np.arange(n) / SR) > rng.uniform(-0.3, 0.5)).astype(float)
    tone = np.sign(np.sin(2 * np.pi * rng.uniform(300, 1800) * np.arange(n) / SR)) * 0.4
    g = crush(nz * 0.7 + tone, int(rng.integers(2, 5)), int(rng.integers(3, 14))) * gate
    add(g * 0.1 * e["p"], e["t"], pan=float(rng.uniform(-0.6, 0.6)))

# ---- typing clicks
cl = int(0.004 * SR)
click = rng.standard_normal(cl) * np.exp(-np.arange(cl) / SR * 1400)
for line in ev["typed"]:
    for k in range(line["n"]):
        add(click * rng.uniform(0.035, 0.07), line["t"] + k / line["cps"], pan=float(rng.uniform(-0.3, 0.3)))

# ---- outro: heartbeat under the lines, the collapse, the cut
o = ev["outro"]
t = tt(0.25)
thump = np.sin(2 * np.pi * (55 * np.exp(-t * 8) + 38) * t) * np.exp(-t * 14)
for k, tb in enumerate(np.arange(o["start"] + 0.3, o["card"] - 0.1, 0.95)):
    g = 0.3 + 0.05 * k
    add(thump * g, tb)
    add(thump * g * 0.6, tb + 0.24)
dl = o["card"] - o["start"]
add(pad([55.0, 82.41], dl, 0.05) * env(int(dl * SR), 0.5, 0.02) * 0.03, o["start"])
d = o["card"] - o["collapse"]
t = tt(d)
swell = lp(rng.standard_normal(len(t)), 1200) * (t / d) ** 3 * 2.0 + np.sin(2 * np.pi * np.cumsum(60 + 400 * (t / d) ** 2) / SR) * (t / d) ** 2
add(swell * 0.3, o["collapse"])
mix[:, int(o["card"] * SR) :] *= 0.0          # hard cut to silence
t = tt(1.8)
final = np.sin(2 * np.pi * (70 * np.exp(-t * 3) + 30) * t) * np.exp(-t * 2.4) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 18)
add(np.tanh(final * 2) * 0.55, o["card"] + 0.02)
add(bell(220, 2.0, 1.8) * 0.03, o["card"] + 0.4)

# ---- master
mix = np.tanh(mix * 1.5)
mix /= np.max(np.abs(mix)) / 0.89
fade = int(0.3 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade)
pcm = (mix.T * 32767).astype("<i2")
with wave.open(str(out_dir / "soundtrack.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out_dir / "soundtrack.wav", f"{DUR:.1f}s")
