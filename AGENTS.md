# AGENTS.md

This repository (`react-spectrum-charts`) is a yarn workspaces monorepo. The primary runnable app for local development is **Storybook**. See `CLAUDE.md` for architecture, package layout, and the full list of standard commands (build/test/lint/storybook). This file only captures durable, non-obvious operating notes.

## Cursor Cloud specific instructions

- **Package manager:** always use `yarn` (Yarn 1 / workspaces). Never `npm`/`npx`. Dependency install is handled by the startup update script (`yarn install`).
- **Node version:** `.nvmrc` pins Node 20, but the project's `engines` only require `>=18`. The cloud VM ships Node 22, which builds, tests, lints, and runs Storybook without issue — no need to switch Node versions.
- **Run the app (Storybook):** `yarn storybook` (or `yarn start`) serves on port **6009**; the S2 variant is `yarn storybook:s2` on port **6010**. Both scripts already set `NODE_OPTIONS=--openssl-legacy-provider`, which is required — do not run the underlying `storybook dev` directly without it. First preview compile takes ~10–15s after the "Storybook started" banner appears.
- **Tests:** `yarn test` runs the full Jest suite (~3400 tests, ~90s) with `TZ=UTC` baked into the script. Use `yarn test --testPathPattern=<name>` to scope.
- **`yarn tsc` currently fails on pre-existing type errors** in a few test files (e.g. `packages/react-spectrum-charts-s2/src/hooks/useChartInspectInteractions.test.tsx`, `packages/react-spectrum-charts/src/stories/components/Line/Line.story.tsx`). These are unrelated to environment setup and exist on a clean checkout. `yarn lint`, `yarn test`, and `yarn build` all pass.
- **Build:** `yarn build` builds all packages in dependency order; `yarn build:s2` builds the Spectrum 2 packages (which depend on the s1 packages being built first).
