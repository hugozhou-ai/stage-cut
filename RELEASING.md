# Releasing Stagecut

Stagecut packages use a fixed Changesets group and are published together.

1. Confirm ownership of the `@stagecut` npm scope and configure trusted publishing or `NPM_TOKEN` in the protected GitHub `npm` environment.
2. Ensure every publishable pull request contains a non-empty Changeset and that `pnpm verify:release` passes.
3. Merge the generated version pull request after reviewing `CHANGELOG.md`, package versions, and migration notes.
4. Manually run the Release workflow. The protected `npm` environment must require maintainer approval.
5. Verify npm provenance, package tarballs, the annotated version tag, and GitHub release notes before promoting a prerelease tag to `latest`.

Do not publish directly from a developer workstation. The repository does not publish automatically on pushes to `master`.
