# Migrating from the 0.1 prototype

The 0.1 workspace packages were private and are intentionally not source-compatible.

- Replace `new StagecutProject()`, `new PlayerVideo()`, and `new VideoFrame()` with `defineStagecutProject()`.
- Move Video width, height, and background to the referenced Stage.
- Replace `frames` with `scenes`; place one or more Surface references in each Scene's `layers`.
- Replace Frame `transition.in/out` with the outgoing Scene's `transitionToNext`.
- Compile a video with `compileStagecutVideo(project, videoId)` before passing it to React.
- Register components with `defineSurfaceRegistry()` and change component props from flattened values to `{ input, context }`.
- Replace `activeFrameId` with `activeSceneId`.
- Remove Agent Prompt export usage; canonical JSON is the only handoff format.
