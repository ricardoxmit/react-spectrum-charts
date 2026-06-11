# AGENTS.md

General development guidance for this repo lives in `CLAUDE.md` (architecture, package layout, common `yarn` commands) and `CONTRIBUTING.md`. Read those first.

## Cursor Cloud specific instructions

This is a `yarn` (classic, v1) workspaces monorepo for the `react-spectrum-charts` library. There is no backend/database — end-to-end development uses Storybook + Jest only.

- **Node/yarn**: `.nvmrc` pins Node 20, but the cloud VM's default `node` on `PATH` is the platform build (currently v22.x) and cannot be shadowed by nvm. All checks (`yarn lint`, `yarn test`, `yarn build`/`build:parallel`, `yarn storybook`) run correctly on it, so there is no need to force Node 20. `yarn` (1.22.x) is already on `PATH`.
- **Dependency refresh**: the startup update script runs `yarn install`. After reinstalling dependencies, restart any running Storybook dev server so it picks up changes.
- **Run / dev surface**: `yarn storybook` (alias `yarn start`) serves Storybook on port **6009**; the Spectrum 2 variant is `yarn storybook:s2` on port **6010**. These are the primary visual dev/test harnesses. Standard commands are documented in `CLAUDE.md`.
- **`yarn tsc` caveat**: at the current `main` commit, `yarn tsc` reports pre-existing type errors in a few test/story files (e.g. `useChartInspectInteractions.test.tsx`, `Line.story.tsx`). This is not an environment problem — Jest (`yarn test`) transpiles via Babel and all suites pass. Don't treat those tsc errors as something your environment introduced.
