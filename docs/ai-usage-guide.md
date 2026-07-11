# Stagecut Project Usage Guide for Developers and AI Agents

This guide explains how to add, modify, preview, and verify Stagecut animations without reverse-engineering the
repository. It is intentionally explicit so a developer or coding Agent can follow the same workflow.

## 1. What Stagecut Does

Stagecut plays deterministic React DOM animations in a browser. A serializable project describes the timeline, while
React Surface components provide the rendered UI.

Stagecut does:

- Validate and freeze serializable project definitions.
- Compile sequential scenes and overlapping transitions into a frame timeline.
- Render only the active scene and, during a transition, its outgoing predecessor.
- Expose playback through a Stagecut-owned controller.
- Provide development-only timeline editing and debugging through `@stage-cut/devtools`.

Stagecut does not:

- Export MP4 or WebM.
- Manage audio.
- Generate Surface component code.
- Persist Devtools changes back to source files.
- Act as a pixel-level visual editor.

## 2. Repository and Package Responsibilities

| Location | Responsibility |
| --- | --- |
| `packages/core` | Project types, validation, canonical JSON, transitions, and timeline compilation. No runtime dependencies. |
| `packages/react` | React Surface registry, player, composition adapter, controller, and hooks. |
| `packages/devtools` | Development-only launcher, Studio, draft editing, runtime inspection, and Agent Prompt generation. |
| `apps/gallery` | Production-style examples built only with public Stagecut APIs. |

When changing behavior, put it in the package that owns that responsibility. Do not add reusable runtime behavior to
the Gallery and do not add Devtools UI to `@stage-cut/react-player`.

## 3. Mental Model

The hierarchy is:

```text
Project
├── Stages       fixed canvas dimensions and background
├── Surfaces     serializable declarations for React component slots
└── Videos
    └── Scenes   sequential timeline units
        └── Layers   bottom-to-top Surface instances rendered in parallel
```

Important distinctions:

- A Surface declaration is JSON. Its React implementation lives in the Surface registry.
- A Scene owns duration. Every Layer in that Scene receives the same frame range.
- Scene order defines playback order. Layers are rendered in array order, bottom to top.
- `inputProps` contains static JSON data. Frame-dependent state comes from the Surface render context.
- `transitionToNext` belongs to the outgoing Scene. The final Scene cannot define it.

## 4. Install

Runtime application:

```bash
pnpm add @stage-cut/core @stage-cut/react-player react react-dom
```

Optional development Studio:

```bash
pnpm add -D @stage-cut/devtools
```

`@stage-cut/react-player` uses Remotion internally. Review `docs/remotion-license.md` and pass
`acknowledgeRemotionLicense` where appropriate.

## 5. Recommended File Layout

Keep the serializable definition close to its Surface registry and player entrypoint:

```text
src/animation/
├── project.ts
├── surfaces.tsx
└── Preview.tsx
```

- `project.ts` exports the project and compiled Videos.
- `surfaces.tsx` exports the exact Surface registry.
- `Preview.tsx` mounts the player and, in development, Devtools.

This layout is a recommendation, not a runtime requirement.

## 6. Define a Project

Use `defineStagecutProject()` for source-controlled definitions. It validates, copies, and deeply freezes the result.
Never mutate the returned project.

```tsx
// project.ts
import { compileStagecutVideo, defineStagecutProject } from "@stage-cut/core";

export const project = defineStagecutProject({
  schemaVersion: 1,
  id: "onboarding-project",
  name: "Onboarding",
  stages: [
    {
      id: "desktop",
      name: "Desktop",
      width: 1280,
      height: 720,
      background: "#101827",
    },
  ],
  surfaces: [
    { id: "title", name: "Title" },
    { id: "summary", name: "Summary" },
  ],
  videos: [
    {
      id: "main",
      name: "Main video",
      stageId: "desktop",
      fps: 30,
      playback: {
        autoPlay: false,
        controls: false,
        loop: true,
      },
      defaultTransition: { kind: "fade", durationInFrames: 8 },
      scenes: [
        {
          id: "intro",
          name: "Introduction",
          durationInFrames: 60,
          transitionToNext: { kind: "slideLeft", durationInFrames: 10 },
          layers: [
            {
              id: "intro-title",
              surfaceId: "title",
              inputProps: { text: "Welcome" },
            },
          ],
        },
        {
          id: "summary",
          name: "Summary",
          durationInFrames: 75,
          layers: [
            {
              id: "summary-content",
              surfaceId: "summary",
              inputProps: { items: ["Deterministic", "DOM", "Typed"] },
            },
          ],
        },
      ],
    },
  ],
});

export const mainVideo = compileStagecutVideo(project, "main");
```

Supported transitions are:

```text
none, fade, slideLeft, slideRight, slideUp, slideDown,
zoomIn, zoomOut, wipeLeft
```

## 7. Implement and Register Surfaces

Use `defineSurfaceRegistry()` so TypeScript derives each Surface's input from matching Layers and runtime validation
checks that the registry contains exactly the declared Surface IDs.

```tsx
// surfaces.tsx
import { defineSurfaceRegistry } from "@stage-cut/react-player";
import { project } from "./project";

export const surfaces = defineSurfaceRegistry(project, {
  title: ({ input, context }) => (
    <h1
      style={{
        opacity: context.progress,
        transform: `translateY(${(1 - context.progress) * 20}px)`,
      }}
    >
      {input.text}
    </h1>
  ),
  summary: ({ input }) => (
    <ul>
      {input.items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  ),
});
```

Every Surface receives:

```ts
interface SurfaceComponentProps {
  input: Readonly<JsonObject>;
  context: {
    fps: number;
    globalFrame: number;
    localFrame: number;
    progress: number;
    sceneId: string;
    layerId: string;
  };
}
```

Surface rules:

- Render from `input` and `context`; do not implement a separate animation clock.
- Keep `inputProps` JSON-compatible: no functions, React nodes, class instances, `undefined`, `NaN`, or `Infinity`.
- Use `context.localFrame` or `context.progress` for deterministic animation.
- Keep business state outside the Surface unless the player is intentionally interactive.
- Do not change a declared Surface ID without updating every Layer reference and the registry key.

## 8. Mount the Player

```tsx
// Preview.tsx
import { StagecutPlayer } from "@stage-cut/react-player";
import { mainVideo } from "./project";
import { surfaces } from "./surfaces";

export function Preview() {
  return (
    <StagecutPlayer
      acknowledgeRemotionLicense
      surfaces={surfaces}
      video={mainVideo}
    />
  );
}
```

The player is SSR-safe. On the server it renders a dimension-preserving placeholder, then mounts the Remotion-backed
player on the client.

Surface pointer interaction is disabled by default to preserve deterministic playback. Pass `interactive` only when
buttons, inputs, links, focus, or text selection must work. During transitions only the active incoming Scene accepts
pointer input.

## 9. Custom Playback Controls

Use one controller instance for both the player and controls:

```tsx
import {
  StagecutPlayer,
  useStagecutPlayerController,
  useStagecutPlayerState,
} from "@stage-cut/react-player";
import { mainVideo } from "./project";
import { surfaces } from "./surfaces";

export function ControlledPreview() {
  const controller = useStagecutPlayerController(mainVideo);
  const state = useStagecutPlayerState(controller);

  return (
    <>
      <StagecutPlayer acknowledgeRemotionLicense controller={controller} surfaces={surfaces} video={mainVideo} />
      <button onClick={() => controller.toggle()} type="button">
        {state.status === "playing" ? "Pause" : "Play"}
      </button>
      <button onClick={() => controller.stepByFrames(1)} type="button">Next frame</button>
      <input
        min={0}
        max={state.durationInFrames - 1}
        onChange={(event) => controller.seekToFrame(Number(event.currentTarget.value))}
        type="range"
        value={state.currentFrame}
      />
    </>
  );
}
```

Public controller commands:

- `play()`, `pause()`, and `toggle()`
- `seekToFrame(frame)` and `seekToSeconds(seconds)`
- `stepByFrames(delta)`
- `getCurrentFrame()`, `getState()`, and `getPlaybackState()`

Use `useStagecutPlayerState()` when frame-by-frame updates are required. Use
`useStagecutPlayerPlaybackState()` when a component only needs readiness, status, duration, or errors and should not
rerender every frame.

## 10. Validate External JSON

Do not pass untrusted or external JSON directly to `defineStagecutProject()` or the compiler. Parse it explicitly:

```ts
import { safeParseStagecutProject } from "@stage-cut/core";

function readExternalProject(input: unknown) {
  const result = safeParseStagecutProject(input);
  if (!result.success) {
    return {
      project: null,
      issues: result.error.issues.map(({ path, code, message }) => ({ path, code, message })),
    };
  }
  return { project: result.data, issues: [] };
}
```

Use `parseStagecutProject()` when throwing is preferred. Validation errors are `StagecutValidationError` instances
with an `issues` array containing `path`, `code`, and `message`. Use `serializeStagecutProject()` to produce canonical,
formatted JSON.

## 11. Validation and Timeline Invariants

An Agent modifying a project must preserve these rules:

- `schemaVersion` is exactly `1`.
- A Project contains at least one Stage and one Video.
- Every Video contains at least one Scene. A Scene may contain zero Layers.
- IDs are non-empty, have no leading or trailing whitespace, and are unique within their collection.
- Stage width/height, Video fps, and Scene duration are positive safe integers.
- Transition duration is a non-negative safe integer.
- A Layer references a declared Surface; a Video references a declared Stage.
- A final Scene cannot contain `transitionToNext`.
- A transition cannot be longer than either adjacent Scene.
- Incoming and outgoing transition ranges cannot consume more than the Scene's duration.
- Unknown object keys are rejected.
- Metadata and `inputProps` must be JSON objects.

Transition overlap changes the compiled timeline duration. Do not calculate total frames by simply summing Scene
durations; use `compiledVideo.timeline.durationInFrames`.

## 12. Use Devtools

Mount Devtools once near the application root and require an explicit development flag:

```tsx
import { StagecutDevtools } from "@stage-cut/devtools";

<StagecutDevtools
  acknowledgeRemotionLicense
  enabled={import.meta.env.DEV}
  project={project}
  surfaces={surfaces}
/>;
```

Workflow:

1. Start the host application normally.
2. Add `?stagecut` to its URL.
3. Click the global `S` launcher.
4. Devtools opens the same host URL in a new tab with `?stagecut=studio`, preserving other query parameters and Hash.
5. Select a Video and edit Scene order, duration, transitions, Layers, Surface references, or `inputProps`.
6. Fix any structured validation errors before trusting the preview.
7. Click **Copy Agent Prompt**.
8. Give the Prompt to an Agent working in the source repository.

Devtools behavior:

- Drafts are stored in the current tab's `sessionStorage` and never modify source files.
- If the source Project changes, a saved draft is not merged automatically.
- Invalid drafts are not sent to the player; the Studio shows exact validation paths instead.
- `enabled={false}` prevents activation even when the URL contains the query parameter.
- Keep the package development-only and use a development-only dynamic import when production bundle size matters.

## 13. Common Agent Tasks

### Add a Scene

1. Locate the correct Video by stable ID.
2. Insert a uniquely identified Scene in the requested order.
3. Choose a positive `durationInFrames`.
4. Add Layers referencing existing Surface IDs.
5. Add `transitionToNext` only if the Scene is not final.
6. Compile and run tests.

### Add a Surface

1. Add its declaration to `project.surfaces`.
2. Implement the React component in the Surface registry file.
3. Add the exact registry key through `defineSurfaceRegistry()`.
4. Reference the Surface from one or more Layers.
5. Keep Layer input JSON-compatible.

### Reorder or Delete Scenes

1. Treat Scene IDs as stable identities; reorder objects instead of renaming IDs.
2. Review the new final Scene and remove `transitionToNext` from it.
3. Recheck transition lengths against the new adjacent Scenes.
4. Verify total duration through the compiled timeline.

### Change Surface Input

1. Update `inputProps` on relevant Layers.
2. Update the Surface implementation to accept all inferred variants when different Layers use different shapes.
3. Do not move frame-dependent values into static `inputProps`.

## 14. Verification

For changes in this repository, run:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm pack:check
```

Before release or after changing package boundaries, also run:

```bash
pnpm test:consumers
```

For focused package coverage:

```bash
pnpm test:coverage
```

Do not declare a change complete merely because the Gallery looks correct. The Gallery is an example consumer; package
tests, type checks, build output, package validation, and consumer tests are the source of verification.

## 15. Completion Checklist for Agents

- [ ] The change uses public Stagecut APIs unless package internals are intentionally being modified.
- [ ] Project definitions remain serializable and immutable.
- [ ] IDs and references remain valid.
- [ ] Final Scenes have no `transitionToNext`.
- [ ] Surface registry keys exactly match declarations.
- [ ] Runtime code remains in the owning package, not the Gallery.
- [ ] Obsolete code from refactors has been removed.
- [ ] Required verification commands pass.
- [ ] Commits follow Conventional Commits.
