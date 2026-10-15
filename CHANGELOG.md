# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning.

## Unreleased

## 1.0.0 — 2026-10-15

### Features

- Add the optional `@stage-cut/render` CLI and SDK for MP4 export, interval previews, keyframes, contact sheets and machine-readable render feedback.
- Add independent Layer ranges and persistent background/overlay layers for shared worlds, audio and subtitles.
- Add `StagecutResource` for asynchronous preparation and cleanup, and `StagecutRenderRoot` for deriving render compositions from Project definitions.
- Add an Agent Skill and a 48-second WebGL film benchmark alongside the existing DOM examples.

### Breaking Changes

- Nested Remotion frame hooks and media now use a Layer-local Sequence clock. Use `context.globalFrame` when absolute Video time is required.
- Extend Surface frame context with `ownerFrame`, `durationInFrames` and `scope`. Persistent layers use an empty `sceneId`.

### Validation

- Add encoded-media regression checks for Layer audio boundaries, persistent audio, resource readiness, frame count and repeatable capture.
- Support and validate ESM/CommonJS exports for all four packages.
- Isolate consumer-verification tarballs in a dedicated temporary directory so release checks preserve rendered films.

See [the 1.0 migration guide](docs/migration-1.0.md).

## Before 1.0

### Breaking Changes

- Replace Class-based Frame APIs with serializable Project, Scene, and Layer definitions.
- Replace frame transition overrides with scene-level `transitionToNext`.
- Change Surface props to `{ input, context }`.
- Rename the published packages to `@stage-cut/core` and `@stage-cut/react-player`.

### Features

- Add structured external JSON validation and compiled O(log n) scene lookup.
- Add parallel layers, bounded scene rendering, SSR mounting, Gallery examples, and public package builds.
- Add interactive DOM surfaces (`interactive` prop on `StagecutPlayer`) for real button, link, input, and focus behavior during playback.
- Add `@stage-cut/devtools`, an in-page preview Studio for editing scenes, transitions, layers, and input props, and copying changes as an Agent Prompt.
- Add and expand the production-style Gallery showcase with additional cases and rendered previews.
