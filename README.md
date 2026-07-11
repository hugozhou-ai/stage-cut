<p align="center">
  <a href="https://hugozhou-ai.github.io/stage-cut/">
    <img alt="StageCut logo — open the live production gallery" src="apps/gallery/src/assets/stage-cut.png" width="160" />
  </a>
</p>

# StageCut

[![中文文档](https://img.shields.io/badge/中文-文档-blue)](README.zh-CN.md)

StageCut is an interactive, frame-precise animation engine for building and playing DOM video experiences with React. Projects are defined as portable JSON; React Surface components handle rendering; a compiled scene timeline ensures bounded, predictable playback performance.

StageCut is designed for browser playback only. It does not provide MP4/WebM export, audio management, or a visual editor.

<p align="center">
  <strong><a href="https://hugozhou-ai.github.io/stage-cut/">▶ Open the Live Production Gallery</a></strong>
  <br />
  <sub>Try interactive, production-style DOM animations built with StageCut's public API.</sub>
</p>

## Features

- Serializable Project → Stage → Video → Scene → Layer model
- Parallel layers inside sequential scenes
- Fade, slide, zoom, and wipe scene transitions
- Runtime validation with structured field paths
- O(log n) active-scene lookup and a two-scene render window
- React 18/19 and SSR-safe player mounting
- Remotion-powered playback behind a StageCut-owned controller API

## Install

```bash
pnpm add @stagecut/core @stagecut/react-player react react-dom
```

`@stagecut/react-player` uses Remotion internally. Review [Remotion licensing](docs/remotion-license.md) and explicitly acknowledge it on the player when appropriate.

## Quick start

```tsx
import { compileStagecutVideo, defineStagecutProject } from "@stagecut/core";
import { defineSurfaceRegistry, StagecutPlayer } from "@stagecut/react-player";

const project = defineStagecutProject({
  schemaVersion: 1,
  id: "hello-project",
  name: "Hello Project",
  stages: [{ id: "main", name: "Main", width: 1280, height: 720, background: "#101827" }],
  surfaces: [{ id: "title", name: "Title" }],
  videos: [{
    id: "hello",
    name: "Hello",
    stageId: "main",
    fps: 60,
    scenes: [{
      id: "intro",
      durationInFrames: 120,
      layers: [{ id: "title", surfaceId: "title", inputProps: { text: "Hello StageCut" } }],
    }],
  }],
});

const surfaces = defineSurfaceRegistry(project, {
  title: ({ input, context }) => (
    <h1 style={{ opacity: context.progress }}>{input.text}</h1>
  ),
});

const video = compileStagecutVideo(project, "hello");

export function Preview() {
  return <StagecutPlayer acknowledgeRemotionLicense surfaces={surfaces} video={video} />;
}
```

Surface components receive `{ input, context }`. Input is JSON data from the layer; context contains `globalFrame`, `localFrame`, `progress`, `fps`, `sceneId`, and `layerId`. Surface interaction is disabled by default so playback stays deterministic. Pass `interactive` to `StagecutPlayer` when a browser experience should expose the real buttons, links, inputs, selection, and focus behavior rendered by a surface. Only the active scene accepts pointer events during a transition.

## External JSON

Use `parseStagecutProject(unknown)` for external data. Validation failures throw `StagecutValidationError` with an `issues` array containing `path`, `code`, and `message`. Use `safeParseStagecutProject()` when a discriminated result is more convenient. `serializeStagecutProject()` produces canonical formatted JSON.

## Gallery

> **[Open the Live Production Gallery →](https://hugozhou-ai.github.io/stage-cut/)**
>
> Explore interactive, production-style cases before installing or running StageCut locally.

To run the same Gallery locally:

```bash
corepack enable
pnpm install
pnpm dev
```

Open the URL printed by Vite. The gallery contains three production-style cases built with StageCut's public API.

### Application Creation Dialog

[![Application Creation Dialog animation](docs/assets/gallery/application-dialog.gif)](docs/assets/gallery/application-dialog.mp4)

Click the animation to open its full-resolution MP4. Regenerate the gallery media with `pnpm gallery:render`; the command requires FFmpeg on `PATH`.

The server starts at port `5173` and advances when the port is busy. Override it with `STAGECUT_GALLERY_PORT` and `STAGECUT_GALLERY_HOST`. The previous `STAGECUT_STUDIO_PORT` and `STAGECUT_STUDIO_HOST` names remain accepted during the Gallery rename.

## StageCut Devtools

Install the development-only Studio next to the runtime packages:

```bash
pnpm add -D @stagecut/devtools
```

Mount it once near the root of the application. Keep `enabled` tied to the host's development environment so the
Studio cannot be activated in production:

```tsx
import { StagecutDevtools } from "@stagecut/devtools";

<StagecutDevtools
  acknowledgeRemotionLicense
  enabled={import.meta.env.DEV}
  project={project}
  surfaces={surfaces}
/>;
```

Open the application with `?stagecut` to reveal the global launcher. It opens `?stagecut=studio` in a new tab where
you can preview the real Surface components, edit scenes, transitions, layers, and input props, inspect runtime frame
state, and copy the resulting changes as an Agent Prompt. Drafts live only in the current tab's `sessionStorage` and
never modify source files directly.

## Verification

```bash
pnpm verify
pnpm test:coverage
```

See [architecture](docs/architecture.md), [performance](docs/performance.md), and the [0.1 migration guide](docs/migration-0.1.md).
For a task-oriented reference designed for developers and coding Agents, see the
[AI-friendly project usage guide](docs/ai-usage-guide.md).

Maintainers should follow [RELEASING.md](RELEASING.md); publishing is manually approved and never runs automatically on a branch push.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Report vulnerabilities through the process in [SECURITY.md](SECURITY.md).

StageCut is available under the [MIT License](LICENSE).
