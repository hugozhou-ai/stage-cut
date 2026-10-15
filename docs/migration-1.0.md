# Migrating to StageCut 1.0

Version 1.0 stabilizes the programmatic video workflow across `@stage-cut/core`, `@stage-cut/react-player`, `@stage-cut/devtools`, and the new optional `@stage-cut/render` package.

## Frame clocks

Surfaces should use their explicit `context` clocks. `context.localFrame` is relative to the Layer's start; without a Layer offset it matches the previous Scene-local clock. `context.ownerFrame` is relative to the owning Scene, or to the Video for persistent layers. `context.globalFrame` always remains absolute Video time.

Nested Remotion hooks and media now run inside the Layer's Sequence. Code that previously used nested `useCurrentFrame()` as an absolute clock must use `context.globalFrame` instead. This change gives audio and video correct start and trim positions.

## Independent ranges and persistent layers

Layers accept optional `startFrame` and `durationInFrames`, with an exclusive end. They must fit their owner; invalid ranges produce structured compilation errors. Video duration still accounts for overlapping Scene transitions.

Use Video `backgroundLayers` and `overlayLayers` for shared worlds, music and cross-scene captions. They remain mounted through Scene cuts while their own range is active. Their `context.sceneId` is empty; distinguish them with `context.scope`. Their cost is additional to the bounded Scene render window.

## Resource readiness

Use `StagecutResource` for asynchronous assets and fonts. Change its `id` when the source changes. It waits for consumers to commit before allowing capture, supports abort and disposal, and identifies failed resources. It does not make a stateful simulation seekable: implement fixed steps and checkpoints where needed.

## Export

Use `StagecutRenderRoot` to derive compositions from the same Project and registry as browser preview. The optional `@stage-cut/render` CLI/SDK outputs MP4, keyframes, contact sheets and render manifests. It requires Node 20+, FFmpeg/ffprobe and an authorized browser rendering environment. Both ESM and CommonJS SDK consumers are supported.

See [the video workflow](scene-to-film.md), [renderer reference](../packages/render/README.md), and [Agent Skill](../skills/stagecut-video/SKILL.md). This source version does not itself establish that packages have been published to npm; npm publication runs separately through the protected Release workflow.
