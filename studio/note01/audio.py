"""Synthesize the INTRUSION soundtrack from the same events the picture uses.

    python studio/note01/audio.py <frames_dir>   # reads events.json there, writes soundtrack.wav
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "frames")
ev = json.loads((out_dir / "events.json").read_text())
DUR = ev["frames"] / ev["fps"]
N = int(DUR * SR)
t = np.arange(N) / SR
mix = np.zeros((2, N))
rng = np.random.default_rng(7)


def seg(a, b):
    return slice(int(a * SR), min(N, int(b * SR)))


def add(x, a, gain=1.0, pan=0.0):
    i = int(a * SR)
    x = x[: max(0, N - i)]
    mix[0, i : i + len(x)] += x * gain * (1 - pan) ** 0.5
    mix[1, i : i + len(x)] += x * gain * (1 + pan) ** 0.5


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) if na else 1
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # one-pole; only used on short buffers
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def crush(x, bits, hold):
    x = np.repeat(x[::hold], hold)[: len(x)]
    q = 2 ** bits
    return np.round(x * q) / q


scenes = {s["id"]: s for s in ev["scenes"]}

# ---- room tone throughout
mix += 0.004 * rng.standard_normal((2, N))

# ---- calm pads: one chord per chapter, until the breach
chords = {1: [220.0, 277.18, 329.63, 415.3], 2: [196.0, 246.94, 293.66, 369.99],
          3: [174.61, 220.0, 261.63, 329.63], 4: [207.65, 261.63, 311.13, 392.0]}
for sid, ch in chords.items():
    s = scenes[sid]
    a, b = s["start"], s["breach"]
    n = int((b - a) * SR)
    tt = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * f * tt + k) * (0.6 if k else 1) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt)
              for k, f in enumerate(ch))
    pad *= (0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * tt)) * env_adsr(n, 1.2, 0.05)
    add(pad * 0.028, a, pan=-0.2)
    add(pad * 0.028, a + 0.013, pan=0.2)
    # a soft bell on each chapter start
    bell_n = int(2.5 * SR)
    bt = np.arange(bell_n) / SR
    bell = np.sin(2 * np.pi * ch[-1] * 2 * bt) * np.exp(-bt * 2.2) + 0.4 * np.sin(2 * np.pi * ch[-1] * 5.4 * bt) * np.exp(-bt * 5)
    add(bell * 0.06, a + 0.2)

# ---- breaches: sub drop + crushed noise slam
for s in ev["scenes"]:
    if "breach" not in s:
        continue
    a = s["breach"]
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    f = 90 * np.exp(-tt * 1.6) + 32
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.8)
    add(np.tanh(sub * 2.5) * 0.5, a)
    nz = rng.standard_normal(int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR * 4)
    add(crush(nz, 3, 9) * 0.22, a, pan=-0.3)
    add(crush(nz[::-1] * 0.5, 4, 5) * 0.18, a + 0.02, pan=0.3)

    # ---- the drone while the AI runs: semitone beating, a whine, a pulse
    b = s["end"]
    n = int((b - a) * SR)
    tt = np.arange(n) / SR
    ramp = np.clip(tt / (b - a - 0.5), 0, 1) ** 1.5
    saw = lambda fr: 2 * ((tt * fr) % 1) - 1
    drone = (saw(55) + saw(58.27) + 0.5 * saw(110.4)) * 0.33
    drone = np.tanh(drone * (1 + 3 * ramp)) * (0.55 + 0.45 * (np.sin(2 * np.pi * 2 * tt) > 0))
    whine = np.sin(2 * np.pi * (3100 + 180 * np.sin(2 * np.pi * 0.7 * tt)) * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * tt))
    body = (drone * 0.09 + whine * 0.012) * (0.25 + 0.75 * ramp)
    body[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
    add(body, a, pan=-0.1)
    add(body * 0.9, a + 0.011, pan=0.1)

    # the shout: a distorted cluster hit
    sh = s["end"] - 2.4
    n = int(1.9 * SR)
    tt = np.arange(n) / SR
    hit = sum(np.sin(2 * np.pi * f * tt) for f in (73.4, 77.8, 146.8, 155.6, 311.1))
    add(np.tanh(hit * 3) * np.exp(-tt * 1.2) * 0.16, sh)

# ---- glitch bursts: gated, crushed noise stutters
for e in ev["bursts"]:
    n = int(e["d"] * SR)
    if n <= 0:
        continue
    nz = rng.standard_normal(n)
    gate_rate = rng.uniform(18, 60)
    gate = (np.sin(2 * np.pi * gate_rate * np.arange(n) / SR) > rng.uniform(-0.3, 0.5)).astype(float)
    tone = np.sign(np.sin(2 * np.pi * rng.uniform(300, 1800) * np.arange(n) / SR)) * 0.4
    g = crush(nz * 0.7 + tone, int(rng.integers(2, 5)), int(rng.integers(3, 14))) * gate
    add(g * 0.14 * e["p"], e["t"], pan=float(rng.uniform(-0.6, 0.6)))

# ---- typing clicks
click_n = int(0.004 * SR)
click = rng.standard_normal(click_n) * np.exp(-np.arange(click_n) / SR * 1400)
for line in ev["typed"]:
    for k in range(line["n"]):
        add(click * rng.uniform(0.04, 0.08), line["t"] + k / line["cps"], pan=float(rng.uniform(-0.3, 0.3)))

# ---- outro: heartbeat, the eye opening, the cut
beat_n = int(0.25 * SR)
bt = np.arange(beat_n) / SR
thump = np.sin(2 * np.pi * (55 * np.exp(-bt * 8) + 38) * bt) * np.exp(-bt * 14)
for k, tb in enumerate(np.arange(52.3, 57.8, 0.95)):
    g = 0.35 + 0.08 * k
    add(thump * g, tb)
    add(thump * g * 0.6, tb + 0.24)
n = int(2.5 * SR)
tt = np.arange(n) / SR
swell = lowpass(rng.standard_normal(n), 900) * (tt / 2.5) ** 3 * 2.2 + np.sin(2 * np.pi * 41 * tt) * (tt / 2.5) ** 2
add(swell * 0.35, 55.4)
mix[:, int(57.9 * SR):] *= 0.0          # hard cut to silence
n = int(1.8 * SR)
tt = np.arange(n) / SR
final = np.sin(2 * np.pi * (70 * np.exp(-tt * 3) + 30) * tt) * np.exp(-tt * 2.4) + 0.3 * rng.standard_normal(n) * np.exp(-tt * 18)
add(np.tanh(final * 2) * 0.55, 57.93)

# ---- master
mix = np.tanh(mix * 1.4)
mix /= np.max(np.abs(mix)) / 0.89
fade = int(0.4 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade)
pcm = (mix.T * 32767).astype("<i2")
with wave.open(str(out_dir / "soundtrack.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out_dir / "soundtrack.wav", f"{DUR:.1f}s")
