# Contributing to Stagecut

## Development

Use Node.js 20 or 22 and pnpm 10.25.0 through Corepack.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm verify
```

Do not edit generated `dist` files. Public behavior changes require tests and a Changeset. Browser-based visual or performance verification must be recorded in the pull request when the change affects rendering.

## Commits and pull requests

- Follow Conventional Commits, for example `fix(core): validate scene references`.
- Keep pull requests focused and document breaking schema or API changes.
- Update README and migration documentation whenever public usage changes.
- Add a Changeset with `pnpm changeset` for publishable package changes.

By contributing, you agree that your contribution is licensed under the MIT License and that you will follow the [Code of Conduct](CODE_OF_CONDUCT.md).
