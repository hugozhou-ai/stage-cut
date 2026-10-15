import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outputDirectory = path.join(repositoryRoot, "docs", "assets", "gallery");
const videoIds = ["application-dialog"];
for (const videoId of videoIds) {
  execFileSync(
    process.execPath,
    ["scripts/render-stagecut.mjs", "--entry", "apps/gallery/render.tsx", "--id", videoId, "--out", outputDirectory],
    { cwd: repositoryRoot, stdio: "inherit" },
  );
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      path.join(outputDirectory, `${videoId}.mp4`),
      "-filter_complex",
      "fps=15,scale=1080:-1:flags=lanczos,split[frames][palette_source];[palette_source]palettegen=max_colors=192:stats_mode=full[palette];[frames][palette]paletteuse=dither=sierra2_4a:diff_mode=rectangle",
      "-loop",
      "0",
      path.join(outputDirectory, `${videoId}.gif`),
    ],
    { stdio: "inherit" },
  );
}
