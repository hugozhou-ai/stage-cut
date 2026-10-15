import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { validateFrameSelection, validateOptions } from "./options.mjs";

export async function inspectStagecutProject({ entry, gl = "angle" }) {
  const entryPoint = path.resolve(entry);
  const publicDir = path.join(path.dirname(entryPoint), "public");
  const serveUrl = await bundle({ entryPoint, ...(existsSync(publicDir) ? { publicDir } : {}) });
  return getCompositions(serveUrl, { chromiumOptions: { gl } });
}

export async function renderStagecutProject(options) {
  const started = performance.now();
  const values = validateOptions(options);
  const log = (event, fields = {}) => {
    const data = { event, ...fields };
    if (options.onEvent) options.onEvent(data);
    else console.log(`[stagecut-render] ${JSON.stringify(data)}`);
  };
  const entryPoint = path.resolve(values.entry);
  const scale = values.scale;
  const concurrency = values.concurrency;
  const output = path.resolve(values.out);
  mkdirSync(output, { recursive: true });
  const publicDir = path.join(path.dirname(entryPoint), "public");
  const serveUrl = await bundle({ entryPoint, ...(existsSync(publicDir) ? { publicDir } : {}) });
  const chromiumOptions = { gl: values.gl };
  const browser = await openBrowser("chrome", { chromiumOptions });
  try {
    const composition = await selectComposition({
      id: values.id,
      serveUrl,
      chromiumOptions,
      puppeteerInstance: browser,
    });
    const { frameRange, frames, checkFrame } = validateFrameSelection(values, composition.durationInFrames);
    const browserMessages = [];
    const onBrowserLog = ({ type, text }) => {
      if (type === "error" || type === "warning" || text.startsWith("[")) {
        browserMessages.push({ type, text });
        log("browser", { type, text });
      }
    };
    const still = async (frame, name) => {
      const outputLocation = path.join(output, name);
      await renderStill({
        composition,
        serveUrl,
        frame,
        output: outputLocation,
        imageFormat: "png",
        puppeteerInstance: browser,
        scale,
        chromiumOptions,
        onBrowserLog,
      });
      return { frame, file: name, sha256: createHash("sha256").update(readFileSync(outputLocation)).digest("hex") };
    };
    const stills = [];
    for (const frame of frames) {
      stills.push(await still(frame, `frame-${String(frame).padStart(6, "0")}.png`));
      log("still", { frame });
    }
    if (stills.length > 0) {
      const list = path.join(output, "contact-frames.txt");
      writeFileSync(list, stills.map(({ file }) => `file '${file}'`).join("\n"));
      execFileSync("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        list,
        "-vf",
        `scale=640:-1,tile=${Math.min(3, stills.length)}x${Math.ceil(stills.length / 3)}`,
        "-frames:v",
        "1",
        path.join(output, "contact.png"),
      ]);
      log("contact-sheet", { frames });
    }
    let determinism = null;
    if (checkFrame !== undefined) {
      const frame = checkFrame;
      const a = await still(frame, "repeat-a.png");
      const b = await still(frame, "repeat-b.png");
      determinism = { frame, a: a.sha256, b: b.sha256, equal: a.sha256 === b.sha256 };
      if (!determinism.equal) throw new Error(`Non-repeatable frame: ${JSON.stringify(determinism)}`);
      log("determinism", determinism);
    }
    let media = null;
    if (!values.stillsOnly) {
      const outputLocation = path.join(output, `${values.id}.mp4`);
      let lastProgress = -1;
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        crf: 18,
        imageFormat: "png",
        puppeteerInstance: browser,
        outputLocation,
        scale,
        concurrency,
        chromiumOptions,
        onBrowserLog,
        ...(frameRange ? { frameRange } : {}),
        onProgress: ({ progress }) => {
          const percent = Math.floor(progress * 10) * 10;
          if (percent > lastProgress) {
            lastProgress = percent;
            log("progress", { percent });
          }
        },
      });
      media = JSON.parse(
        execFileSync("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", outputLocation], {
          encoding: "utf8",
        }),
      );
      log("media", { outputLocation });
    }
    const manifest = {
      schemaVersion: 1,
      elapsedSeconds: (performance.now() - started) / 1000,
      entry: values.entry,
      id: values.id,
      fps: composition.fps,
      width: composition.width,
      height: composition.height,
      durationInFrames: composition.durationInFrames,
      frameRange,
      scale,
      stills,
      determinism,
      media,
      browserMessages,
    };
    writeFileSync(path.join(output, "render-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  } finally {
    await browser.close({ silent: true });
  }
}
