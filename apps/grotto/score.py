"""Original deterministic ambient score. Run with: uv run --with numpy python score.py"""
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent
RATE = 48000
DURATION = 48
rng = np.random.default_rng(731)
t = np.arange(RATE * DURATION) / RATE
score = np.zeros((len(t), 2), dtype=np.float64)
envelope = np.minimum(t / 3, 1) * np.minimum((DURATION - t) / 4, 1)

# Breathing harmonics, tuned to D / A with gentle stereo beating.
for frequency, level in [(73.416, .043), (110, .028), (146.832, .020), (220, .012), (293.664, .008)]:
    for channel in range(2):
        modulation = .70 + .30 * np.sin(t * .19 + frequency)
        score[:, channel] += level * envelope * modulation * np.sin(2 * np.pi * (frequency + channel * .07) * t)

def bowl(start, frequency, amplitude=.13, decay=4.8, pan=0):
    global score
    offset = int(start * RATE)
    n = min(int(decay * 3 * RATE), len(t) - offset)
    local = np.arange(n) / RATE
    sound = np.zeros(n)
    for ratio, level, tail in [(1, 1, 1), (2.71, .32, .63), (5.08, .14, .37), (8.18, .06, .20)]:
        sound += level * np.sin(2 * np.pi * frequency * ratio * local) * np.exp(-local / (decay * tail))
    sound *= (1 - np.exp(-local * 80)) * amplitude
    gain = np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)])
    score[offset:offset+n] += sound[:, None] * gain

for event in [(1.6, 146.832, .19, 7, -.15), (11.8, 293.664, .12, 5, .25),
              (22.8, 220, .15, 6, -.3), (26.0, 440, .06, 4, .5),
              (34.7, 293.664, .13, 6, .1), (38.2, 587.328, .06, 5, -.5),
              (42.5, 146.832, .17, 6, 0)]:
    bowl(*event)

# Quiet filtered air, and a sparse five-note shimmer during release.
for channel in range(2):
    white = rng.normal(0, 1, len(t))
    smooth = np.convolve(white, np.ones(32) / 32, mode="same")
    score[:, channel] += smooth * .019 * envelope
for i, frequency in enumerate([587.328, 660, 880, 1174.656, 1320]):
    bowl(36 + i * 1.17, frequency, .027, 2.7, (-1)**i * .6)

# Early reflections and a diffuse, decaying stereo tail.
dry = score.copy()
for delay, gain in [(.071, .13), (.137, .10), (.293, .09), (.419, .075), (.733, .06), (1.17, .035), (1.91, .022)]:
    offset = int(delay * RATE)
    score[offset:] += dry[:-offset, ::-1] * gain
score *= np.minimum((DURATION - t) / 2.5, 1)[:, None]
peak = np.max(np.abs(score))
score *= .64 / peak
output = ROOT / "public" / "score.wav"
with wave.open(str(output), "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes((score * 32767).astype("<i2").tobytes())
print("[grotto-score] " + json.dumps({"file": str(output), "duration": DURATION, "peak": .64, "seed": 731}))
