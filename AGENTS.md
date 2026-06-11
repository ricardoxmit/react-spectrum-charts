# AGENTS.md

## Cursor Cloud specific instructions

This is the `spectrum-charts-monorepo` (Yarn v1 workspaces). The published product is the
`@adobe/react-spectrum-charts` declarative React charting library plus its Spectrum 2 (S2)
variant. There is no backend, database, or Docker — everything runs as local Node processes.
See `CLAUDE.md` for the architecture/pipeline and the canonical list of commands; this section
only captures non-obvious startup/run caveats.

### Node version
- Use **Node 20** (`.nvmrc` = `20`, CI uses 20). The base VM image's default `node` on `PATH`
  is v22 (`/exec-daemon/node`); interactive login shells are configured (`~/.bashrc` runs
  `nvm use default`, with the default alias = 20) to select Node 20, and `yarn` is installed
  for that Node. If a script runs in a non-login shell and picks up Node 22, run
  `source "$HOME/.nvm/nvm.sh" && nvm use 20` first.

### Package manager
- Always use **`yarn`** (Yarn v1), never npm/npx. This is a yarn workspaces monorepo.

### Build before consuming packages
- Workspace packages import siblings from their built `dist/` (gitignored). After a fresh
  `yarn install`, run `yarn build` before relying on cross-package imports. Storybook itself
  tolerates unbuilt siblings (it bundles via webpack), but tests/typecheck and the docs sites
  expect built `dist/` output. `yarn build:s2` requires `yarn build` (s1) to have run first.

### Dev servers / ports (non-obvious bits)
- **Storybook S1**: `yarn storybook` (alias `yarn start`) → http://localhost:6009. This is the
  primary dev UI for chart work.
- **Storybook S2**: `yarn storybook:s2` → http://localhost:6010 (needs `yarn build:s2` first).
- Both storybook scripts set `NODE_OPTIONS=--openssl-legacy-provider` — keep that if invoking
  storybook directly.
- Docs (Docusaurus): `yarn start:docs` and `yarn start:docs:s2` both default to port 3000 —
  don't run them at the same time.

### Lint / test / typecheck
- `yarn lint`, `yarn test` (Jest, runs `cross-env TZ=UTC`), and `yarn build` are the CI-gating
  checks (`.github/workflows/pr-checks.yml`). `yarn tsc` is **not** part of CI.
- Known caveat: `yarn tsc` currently reports pre-existing type errors in some test/story files
  (e.g. `react-spectrum-charts-s2/src/hooks/useChartInspectInteractions.test.tsx`,
  `react-spectrum-charts/src/stories/components/Line/Line.story.tsx`). These exist on `main`
  and are unrelated to environment setup; `yarn test` still passes.
