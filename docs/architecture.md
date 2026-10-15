# Architecture

Stagecut separates browser runtime, development tools, and optional offline rendering:

- `@stage-cut/core` owns serializable definitions, validation, canonical JSON, and timeline compilation. It has no runtime dependencies.
- `@stage-cut/react-player` owns the React player, controller, Surface registry, resource readiness, render-root adapter and the internal Remotion adapter.
- `@stage-cut/devtools` owns development-time editing and Agent Prompt generation.
- `@stage-cut/render` is an optional Node CLI/SDK for offline output and review artifacts.

A Video references one Stage and contains sequential Scenes. A Scene contains bottom-to-top Layers with optional independent ranges inside its duration. `transitionToNext` overlaps adjacent Scenes; the compiled timeline guarantees that incoming and outgoing ranges cannot consume a Scene's full duration.

At playback time, binary search selects the incoming active Scene. The render window contains that Scene and, only during an overlap, its outgoing predecessor. Scene transitions are applied to the composed layer group, so the runtime mounts no unrelated Scene trees.

Video-level `backgroundLayers` and `overlayLayers` are independent of scene lifetimes. Their active ranges use video time. Each Layer provides a local media clock through a Remotion Sequence. See [the video workflow](scene-to-film.md) for range and resource semantics.

Project definitions are copied, validated, and deeply frozen. Compiled videos are also immutable. React Surface components receive immutable JSON input separately from frame context and cannot capture pointer input through the player root.
