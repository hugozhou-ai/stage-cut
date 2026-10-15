# Agent video workflow

StageCut separates creative decisions from reliable execution. Agents can write any React Surface, including Canvas or WebGL. The runtime controls timing and composition; the optional render package exports the result. No specific narrative, visual style, number of scenes, TTS provider or image generator is required.

## Plan before implementing

Write a short brief covering audience, duration, aspect ratio, narrative beats and deliverables. For each shot, identify its purpose, camera or UI action, text, sound cues and assets. Start with representative frames and a short motion sample. Compare actual output against the brief before expanding the film.

## Choose the right lifecycle

Scene layers are bounded to the active scene window. Use them for independent shots. Use `video.backgroundLayers` for a shared world or continuous audio and `video.overlayLayers` for titles and subtitles that cross scene boundaries. Both persistent arrays use video time, and their components remain mounted while their layer range remains active.

```ts
{
  backgroundLayers: [{ id: "world", surfaceId: "grotto" }],
  overlayLayers: [{
    id: "subtitle", surfaceId: "caption", startFrame: 120,
    durationInFrames: 96, inputProps: { text: "A light within" }
  }]
}
```

Layer `startFrame` defaults to zero relative to its owner. `durationInFrames` defaults to the owner's remaining duration. Ranges are half-open and must fit within their owner; compilation reports invalid ranges without silently clamping them. Video duration includes transition overlap, so validate persistent ranges against the compiled duration.

Surface context contains:

- `globalFrame`: absolute video frame.
- `ownerFrame`: scene-local frame for scene layers, absolute frame for persistent layers.
- `localFrame`: frame relative to the Layer's start.
- `durationInFrames`, `progress`: Layer duration and normalized progress.
- `scope`: `scene`, `background`, or `overlay`.
- `sceneId`: scene identity, or the empty string for persistent layers; use `scope` to distinguish them.

Each Layer establishes a Remotion Sequence, so nested audio/video components receive a Layer-local media clock. This also makes nested `useCurrentFrame()` Layer-local; use `context.globalFrame` when an absolute clock is required. Existing Surfaces using `context.localFrame` without Layer offsets retain their previous timing.

Persistent layers add to the scene render budget. Keep their number explicit and profile heavy worlds independently. Do not keep every historical Scene mounted to retain simulation state.

## Prepare resources once

`StagecutResource` gates preview and export until a resource has loaded and its consumers have committed. It passes an AbortSignal, disposes assets on unmount, and cancels failed renders with the resource identity.

```tsx
<StagecutResource
  id={`model:${url}`}
  load={(signal) => loadModel(url, signal)}
  dispose={(model) => model.dispose()}
>
  {(model) => <World model={model} context={context} />}
</StagecutResource>
```

Resource identity is `id`, not callback identity. Include URLs, versions or other source changes in that ID. A Surface rerender does not reload a stable resource. Perform synchronous GPU upload and frame drawing in layout effects; release readiness only after the current frame can be captured. Follow the same preparation path in preview and export.

## Keep frame results reproducible

Use `globalFrame / fps` or `localFrame / fps` instead of browser elapsed time. Use seeded randomness. For simulations, implement fixed steps and restore checkpoints before seeking. A persistent component alone does not make a simulation seekable.

Do not use CSS keyframes, CSS transitions, timers or independent animation loops for film motion. Keep browser interaction state separate from scripted film state. Code-defined motion, raw WebGL shaders and custom rendering remain available to the agent.

## Sound and subtitles

Use the same timeline for narration, music, effects and subtitles. Existing Remotion audio/video components can be rendered inside timed Surfaces. This change supplies timing and export; it does not implement a mixer, TTS service, subtitle alignment model or visual audio editor.

Base shot lengths on final narration duration. Keep sound tails intentional and avoid truncating them to conceal a timing error. `StagecutPlayer` stays muted by default; `initiallyMuted` and `showVolumeControls` expose browser audio behavior without affecting offline audio export.

## Iterate on the tool using evidence

Use the commands in [the render package](../packages/render/README.md) to generate frames, a contact sheet, short motion intervals, and a final film. Inspect missing assets, text overflow, transitions, media timing, color and output parameters.

When a sample fails, identify whether the cause is content or a reusable runtime/tooling defect. Fix reusable defects in the owning package and add a meaningful regression check. Do not add a hardcoded branch for one film. Lint and type checks complement visual and audible evaluation; they do not replace it.

The `apps/grotto` sample is an original 48-second benchmark with a shared WebGL world, generated image assets, Mandarin narration, procedural music and independently timed captions. It uses 2.5D imagery for the central figure, with procedural room geometry and bounded reflections. It is not a reproduction of ILLUMINE's source or a claim of equivalent artistic quality.
