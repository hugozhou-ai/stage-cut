import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { renderStagecutProject } from "../packages/render/dist/index.js";

const out = path.resolve(".artifacts/render-qa");
const report = await renderStagecutProject({
  entry: "apps/gallery/render-qa.tsx",
  id: "media-clock",
  out,
  frames: [0, 6, 24, 30, 47],
  checkFrame: 30,
  concurrency: 2,
});
const stream = report.media.streams.find((item) => item.codec_type === "video");
assert.equal(Number(stream.nb_frames), 48);
assert.equal(stream.width, 320);
assert.equal(report.determinism.equal, true);
const raw = execFileSync(
  "ffmpeg",
  ["-v", "error", "-i", path.join(out, "media-clock.mp4"), "-f", "f32le", "-ac", "1", "-ar", "48000", "pipe:1"],
  { maxBuffer: 4 * 1024 * 1024 },
);
const amplitude = (seconds, frequency) => {
  const start = Math.round(seconds * 48000),
    count = 4800;
  let real = 0,
    imaginary = 0;
  for (let i = 0; i < count; i++) {
    const sample = raw.readFloatLE((start + i) * 4);
    const phase = (i * frequency * 2 * Math.PI) / 48000;
    real += sample * Math.cos(phase);
    imaginary += sample * Math.sin(phase);
  }
  return (2 * Math.hypot(real, imaginary)) / count;
};
for (const second of [0.32, 1.32]) assert.ok(amplitude(second, 880) > 0.2, `timed cue missing at ${second}`);
for (const second of [0.08, 0.65, 1.08, 1.65])
  assert.ok(amplitude(second, 880) < 0.01, `cue outside layer range at ${second}`);
for (const second of [0.9, 1.01]) assert.ok(amplitude(second, 110) > 0.025, `persistent bed interrupted at ${second}`);
// Verify an actual captured pixel after asynchronous preparation, rather than trusting lifecycle mocks.
const pixel = execFileSync("ffmpeg", [
  "-v",
  "error",
  "-i",
  path.join(out, "frame-000030.png"),
  "-vf",
  "crop=1:1:10:10,format=rgb24",
  "-f",
  "rawvideo",
  "pipe:1",
]);
assert.deepEqual([...pixel], [20, 53, 61]);
console.log(
  `[stagecut-render-qa] ${JSON.stringify({ event: "passed", frames: 48, duration: 2, checks: ["async-resource-pixel", "repeatable-frame", "layer-audio-start-and-stop", "persistent-audio-through-cut", "encoded-frame-count"] })}`,
);
