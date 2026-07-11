import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outputDirectory = path.join(repositoryRoot, "docs", "assets", "gallery");
const videoIds = ["task-flow", "message-cluster", "application-dialog"];

mkdirSync(outputDirectory, { recursive: true });

const serveUrl = await bundle({
  entryPoint: path.join(repositoryRoot, "apps", "gallery", "render.tsx"),
});

for (const videoId of videoIds) {
  const composition = await selectComposition({ id: videoId, serveUrl });
  const mp4Path = path.join(outputDirectory, `${videoId}.mp4`);
  const gifPath = path.join(outputDirectory, `${videoId}.gif`);

  await renderMedia({
    codec: "h264",
    composition,
    crf: 24,
    imageFormat: "jpeg",
    outputLocation: mp4Path,
    scale: 2 / 3,
    serveUrl,
  });

  execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      mp4Path,
      "-filter_complex",
      "fps=12,scale=720:-1:flags=lanczos,split[frames][palette_source];[palette_source]palettegen=max_colors=96:stats_mode=diff[palette];[frames][palette]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle",
      "-loop",
      "0",
      gifPath,
    ],
    { stdio: "inherit" },
  );
}
