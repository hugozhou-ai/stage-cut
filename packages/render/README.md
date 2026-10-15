# @stage-cut/render

Offline export and feedback tools for StageCut. This optional Node package keeps browser playback lightweight. It uses Remotion's renderer; review the repository's Remotion license documentation. FFmpeg and ffprobe must be on PATH. A dedicated Chrome Headless Shell is downloaded on first use.

In this repository, run `pnpm stagecut`. In a consumer project, install this package alongside `@stage-cut/core`, `@stage-cut/react-player`, React and Remotion, then run `stagecut` through your package manager. These changes have not been published to npm yet.

Create a render entry using the same project and Surface registry as browser preview:

```tsx
import { StagecutRenderRoot } from "@stage-cut/react-player";
import { registerRoot } from "remotion";
import { project, surfaces } from "./src/project";
registerRoot(() => <StagecutRenderRoot project={project} surfaces={surfaces} />);
```

Place assets in `public/` adjacent to the render entry. Use Remotion `staticFile()` to resolve them. Optional resource/provider setup can be passed through `StagecutRenderRoot.wrapper` and shared with browser preview.

```bash
pnpm stagecut inspect --entry apps/grotto/render.tsx
pnpm stagecut render --entry apps/grotto/render.tsx --id one-lamp \
  --out .artifacts/preview --frames 96,384,696,1104 --stills-only --check-frame 696
pnpm stagecut render --entry apps/grotto/render.tsx --id one-lamp \
  --out .artifacts/sample --range 240-359 --scale 0.5
pnpm stagecut render --entry apps/grotto/render.tsx --id one-lamp --out .artifacts/final
```

Frame ranges have inclusive ends; Layer ranges have exclusive ends. `--frames` preserves requested order in the contact sheet. `--check-frame` compares PNG hashes from two independent captures in the same environment; it does not prove cross-device or arbitrary-seek determinism. `--scale` accepts values in `(0, 1]`. `--concurrency` limits render workers. `--gl` selects the browser graphics backend.

Outputs include MP4 (unless `--stills-only`), requested PNGs, a contact sheet, and `render-manifest.json` with composition metadata, hashes, browser messages and ffprobe results. CLI errors use `[stagecut-render]` followed by JSON and return a nonzero exit code. Native renderer/browser logs can also appear; read the manifest for structured results.

The SDK accepts arrays instead of comma-separated CLI arguments:

```js
import { renderStagecutProject } from "@stage-cut/render";
const report = await renderStagecutProject({
  entry: "render.tsx", id: "film", out: ".artifacts/film",
  frames: [0, 60, 120], frameRange: [0, 239], checkFrame: 60,
  onEvent: (event) => console.log(JSON.stringify(event)),
});
```

Run `pnpm test:render` in the repository for an actual encoded-media contract check. It validates asynchronous resource readiness, cue start/stop times, persistent audio through a scene cut, repeatable capture and output frame count. It launches a dedicated browser and requires the relevant session authorization.
