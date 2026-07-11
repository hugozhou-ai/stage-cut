# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning.

## Unreleased

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
