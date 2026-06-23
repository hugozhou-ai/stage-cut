# Stagecut

Stagecut is an open-source prototype for making playable DOM player-videos with Agent and engineer collaboration.

It is closer to a lightweight production platform than a normal animation package. A Stagecut project describes stages, surfaces, frames, transitions, metadata, and playback settings. The Studio previews that structure in the browser and exports both the project file and an Agent prompt for implementing the same player-video in a target repository.

## What Stagecut Is

- A structured DOM animation studio for player-videos.
- A way to compose reusable surfaces into frame-based timelines.
- A Remotion-backed preview/player runtime for React pages.
- A handoff tool that exports project JSON and an Agent implementation prompt.

## What Stagecut Is Not

- It is not a traditional video editor.
- It is not an iframe hosting product in v1.
- It is not a pixel-level drag-and-drop design tool yet.
- It is not centered on publishing a package name; runtime packages are implementation support for the platform.

## Workspace

```text
apps/studio       Stagecut Studio app
packages/core     Pure project, video, frame, timeline, transition, and export model
packages/react    React + Remotion player adapter, composition, controller, and hooks
```

## Development

```bash
pnpm install
pnpm dev
```

Open the Studio URL printed by Vite. The default demo project includes:

- one stage: `desktop-stage`
- three surfaces: `workspace-shell`, `agent-dialog`, `file-review`
- one player-video: `studio-demo-video`

## From Studio To A Target Repo

1. Define the project structure in Studio: stage size, surfaces, frames, transition rules, and metadata.
2. Preview the video and inspect the active frame state.
3. Export the project JSON as the durable source of truth.
4. Export the Agent prompt.
5. In the target React repository, ask an Agent to implement the listed surfaces and compose them with the Stagecut runtime.

The prompt is intentionally structural. It tells the Agent which surfaces to create, how frames reference them, which durations and transitions must be preserved, and where to keep the project definition for future edits.

## Minimal Player-Video

```tsx
import { PlayerVideo, VideoFrame } from "@stagecut/core";
import { StagecutPlayer } from "@stagecut/react";

const video = new PlayerVideo({
  fps: 30,
  height: 720,
  id: "hello-video",
  name: "Hello Video",
  stageId: "main-stage",
  width: 1280,
  frames: [
    new VideoFrame({
      durationInFrames: 60,
      id: "hello-frame",
      inputProps: { title: "Hello Stagecut" },
      surfaceId: "hello-surface",
    }).toJSON(),
  ],
});

function HelloSurface({ title }: { title?: string }) {
  return <div>{title}</div>;
}

export function Preview() {
  return <StagecutPlayer surfaces={{ "hello-surface": HelloSurface }} video={video} />;
}
```

## Verification

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```
