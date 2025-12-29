Fixing `@platform/rate-limiter` TS2322 caused by Express v4/v5 type bifurcation in this monorepo:

- Symptom: `pnpm -w run typecheck` failed in `packages/rate-limiter/src/index.ts` because `express-rate-limit` expected `Request` from `@types/express@5.x` while the code used `@types/express@4.x`.
- Workspace already had `pnpm.overrides` set in root `package.json` (and `pnpm-lock.yaml` `overrides:`) to force:
  - `@types/express: 4.17.25`
  - `@types/express-serve-static-core: 4.19.7`
- Root cause for continued failure: stale/partially-updated `node_modules` (pnpm virtual store) still had older Express type links, so TypeScript resolved mismatched copies.

Resolution (deterministic, vendor CLI only):
```bash
cd /Users/daniellynch/Developer
pnpm -w install --force
pnpm -C packages/rate-limiter run typecheck
pnpm -w run typecheck
mise run repo.check
```

Verification shortcuts:
- Confirm effective graph: `pnpm -w why @types/express` (should show only `4.17.25`).
- Confirm per-package link: `readlink packages/rate-limiter/node_modules/@types/express` (should point into `...@types+express@4.17.25...`).

Note: `pnpm -w install --force` may print an “ignored build scripts” warning; keep using `pnpm approve-builds` policy as desired.
