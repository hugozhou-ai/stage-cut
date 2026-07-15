import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outputDirectory = path.join(repositoryRoot, "docs", "assets", "promo");
const videoId = "bead-grid-promo";

mkdirSync(outputDirectory, { recursive: true });

const serveUrl = await bundle({
  entryPoint: path.join(repositoryRoot, "apps", "promo", "render.tsx"),
});

const composition = await selectComposition({ id: videoId, serveUrl });
const mp4Path = path.join(outputDirectory, `${videoId}.mp4`);

await renderMedia({
  codec: "h264",
  composition,
  crf: 18,
  imageFormat: "png",
  outputLocation: mp4Path,
  serveUrl,
});

console.log(`Rendered ${mp4Path}`);
