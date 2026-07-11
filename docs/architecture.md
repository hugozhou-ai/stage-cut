# Architecture

Stagecut has two public packages:

- `@stagecut/core` owns serializable definitions, validation, canonical JSON, and timeline compilation. It has no runtime dependencies.
- `@stagecut/react-player` owns the React player, controller, Surface registry, and the internal Remotion adapter.

A Video references one Stage and contains sequential Scenes. A Scene contains bottom-to-top Layers that share its duration. `transitionToNext` overlaps adjacent Scenes; the compiled timeline guarantees that incoming and outgoing ranges cannot consume a Scene's full duration.

At playback time, binary search selects the incoming active Scene. The render window contains that Scene and, only during an overlap, its outgoing predecessor. Scene transitions are applied to the composed layer group, so the runtime mounts no unrelated Scene trees.

Project definitions are copied, validated, and deeply frozen. Compiled videos are also immutable. React Surface components receive immutable JSON input separately from frame context and cannot capture pointer input through the player root.
