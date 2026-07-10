# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning.

## Unreleased

### Breaking Changes

- Replace Class-based Frame APIs with serializable Project, Scene, and Layer definitions.
- Replace frame transition overrides with scene-level `transitionToNext`.
- Change Surface props to `{ input, context }`.

### Features

- Add structured external JSON validation and compiled O(log n) scene lookup.
- Add parallel layers, bounded scene rendering, SSR mounting, Gallery examples, and public package builds.
