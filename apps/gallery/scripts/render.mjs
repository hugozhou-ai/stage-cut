import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outputDirectory = path.join(repositoryRoot, "docs", "assets", "gallery");
const videoIds = ["application-dialog"];

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
    crf: 18,
    imageFormat: "png",
    outputLocation: mp4Path,
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
      "fps=15,scale=1080:-1:flags=lanczos,split[frames][palette_source];[palette_source]palettegen=max_colors=192:stats_mode=full[palette];[frames][palette]paletteuse=dither=sierra2_4a:diff_mode=rectangle",
      "-loop",
      "0",
      gifPath,
    ],
    { stdio: "inherit" },
  );
}
