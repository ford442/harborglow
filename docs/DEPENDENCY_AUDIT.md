# Dependency / lockfile reproducibility audit — 2026-08-17

Pure hygiene audit per the "CI red for ~2 weeks" incident. No app code changed,
no `three` upgrade (that's a separate PR). Scope: is `package-lock.json`
actually reproducible, and what stops the next peer-range float from doing
this again.

## 1. `npm ci` from a clean state — FAILED before this PR

```bash
rm -rf node_modules && npm ci
```

exited **1** with `EUSAGE`:

```text
npm error `npm ci` can only install packages when your package.json and
package-lock.json or npm-shrinkwrap.json are in sync. Please update your
lock file with `npm install` before continuing.
npm error Missing: esbuild@0.28.2 from lock file
npm error Missing: @esbuild/aix-ppc64@0.28.2 from lock file
... (27 missing entries total)
```

This is **not** the historical `postprocessing`/`three` ERESOLVE (that was
fixed on 2026-08-14, commit `4938624`). It's a second, independent lockfile
drift: `vitest@4.1.5` (added in the initial commit that introduced Vitest)
requires `vite@^6.0.0 || ^7.0.0 || ^8.0.0` as a **non-optional** peer, but the
project pins `vite@^5.0.8`. Because the top-level `esbuild@0.21.5` (pulled in
by vite 5) doesn't satisfy vitest's own `esbuild@^0.27.0 || ^0.28.0`
dependency, npm must nest a private `esbuild@0.28.2` (plus all its optional
per-platform binaries) under `node_modules/vitest`. The committed
`package-lock.json` never had those 27 entries — it was generated in a state
that didn't include them, and nobody re-ran `npm ci` against the committed
file before merging.

Running `npm install` instead of `npm ci` "fixes" this **silently**: it adds
the 27 missing entries to `package-lock.json` and exits 0 with no warning
that the previously-committed lock was broken. This is exactly the failure
mode described in the task: a routine that checks `npm install` (or reuses
an existing `node_modules`) will never notice that `npm ci` — what CI
actually runs — is red.

**This bug is live on `main` right now** (this branch was cut from `main` at
the same commit, `dc077b4`). Every CI job fails at "Install dependencies."

**Fix in this PR:** regenerated `package-lock.json` from a clean install so
`rm -rf node_modules && npm ci` now exits 0. The vite5/vitest4 pairing itself
is left as-is — vitest 4's `vite` peer being non-optional is unusual but
harmless in practice (Vitest resolves its own nested esbuild/vite tooling
internally and doesn't actually invoke the project's vite instance for
`vitest run`); re-pairing to a vitest version that matches vite 5, or
upgrading vite, is a version-bump decision for a separate PR, not a
lockfile-hygiene one.

## 2. Peer-dependency graph for the `three` ecosystem

`npm ls three postprocessing @react-three/fiber @react-three/drei
@react-three/rapier` (clean install, this PR's lockfile):

```text
+-- @react-three/drei@10.7.8        (peer three >=0.159)          → three@0.183.1 deduped
+-- @react-three/fiber@9.7.0        (peer three >=0.156)          → three@0.183.1 deduped
+-- @react-three/postprocessing@3.0.5
|     (peer postprocessing ^6.36.0, three >=0.182.0)
|   +-- n8ao@2.0.1 (peer postprocessing >=6.30.0, three >=0.137) → postprocessing@6.39.4, three@0.183.1
|   `-- postprocessing@6.39.4 deduped
+-- @react-three/rapier@2.2.0       (peer three >=0.159.0)        → three@0.183.1 deduped
+-- postprocessing@6.39.4           (peer three >= 0.168.0 < 0.186.0)
+-- three-stdlib@2.36.1             (peer three >=0.128.0)
`-- three@0.183.1
```

Everything currently resolves cleanly against `three@0.183.1` (pinned exact)
and `@types/three@0.183.1` (also pinned exact).

**Every dep that floats a caret wide enough to re-break the `three` peer
contract** — i.e. every direct dependency whose SemVer range admits a future
release that could raise its `three` (or `postprocessing`) peer floor past
our pin, exactly the class of bug that broke CI on 2026-08-10:

| Package | Current range (before this PR) | Why it's risky |
|---|---|---|
| **`postprocessing`** | `^6.39.0` (any `6.x`, `x`≥39) | **This is the exact package that broke CI before.** Its `three` peer floor has moved twice in recent 6.x releases (6.32.1 → `three@157-183`; 6.39.0 → `three≥0.168`; 6.39.4's upper bound is already `<0.186.0`). A caret here re-admits every future `6.x` patch/minor without review — the same shape of break can recur with zero code change on our side. |
| `@react-three/postprocessing` | `^3.0.5` | Peers `postprocessing@^6.36.0` and `three@>=0.182.0`. A `3.x` bump could raise either floor; less historically volatile than `postprocessing` itself but sits directly downstream of it. |
| `@react-three/drei` | `^10.7.8` | Peer range is wide (`three>=0.159`) today, but drei ships very frequently and has tightened peer floors in past majors/minors. |

Deps whose peer ranges are wide enough that a float is low-risk (`>=0.128`
`>=0.137`, `>=0.156`, `>=0.159`, no versions in flight are near those floors):
`@react-three/fiber`, `@react-three/rapier`, `three-stdlib`, `n8ao`,
`three-mesh-bvh`, `troika-three-text`, `camera-controls`, `maath`,
`meshline`, `@monogrid/gainmap-js`. Not flagged as action items — floating
them is normal and low-blast-radius.

One pre-existing non-peer risk, noted but **not changed** (out of scope,
doesn't affect the app or `npm ci`): `stats-gl@2.4.2` bundles its own
`three@^0.170.0` as a hard (non-peer) `dependencies` entry, so it always
ships a second, older `three` copy under `node_modules/@react-three/drei/
node_modules/stats-gl/node_modules/three` regardless of dedup. Harmless for
correctness (stats-gl doesn't share objects with the app's three instance)
but adds ~1 extra copy to disk.

**Fix in this PR:** `postprocessing` pinned to the exact resolved version
(`6.39.4`, mirroring how `three` and `@types/three` are already pinned
exact) instead of `^6.39.0`. This removes the single highest-risk float
without touching `three` or any other package.

## 3. `npm ci` vs `npm install` in CI, and lockfile-drift guardrail

- CI already runs `npm ci` (not `npm install`) in every job across both
  `.github/workflows/ci.yml` and `copilot-setup-steps.yml` — this part was
  already correct, and it's precisely why CI is currently red on `main`
  rather than silently drifting further.
- The gap isn't CI's install command; it's that when the lockfile breaks,
  **all seven gate jobs fail identically** at "Install dependencies" after
  their own multi-to-fifteen-minute timeout, with no single fast, clearly
  labeled signal pointing at the lockfile. That's a plausible reason a
  lockfile break sat unnoticed/unfixed for two weeks — the failure looks
  like generic CI flakiness spread across every job rather than one
  specific, diagnosable problem.

**Guardrail added in this PR** (`.github/workflows/ci.yml`):

- New `gate-lockfile` job, ~1 minute, runs first: `npm ci` (fails loudly on
  drift or ERESOLVE) then `npm ls three postprocessing @react-three/fiber
  @react-three/drei @react-three/rapier` (fails loudly on any unmet/invalid
  peer in this specific graph, belt-and-suspenders alongside `npm ci`'s own
  strict peer resolution).
- Every other gate job (`gate-wasm`, `gate-typecheck`, `gate-lint`,
  `gate-test`, `gate-smoke`, `gate-build`, `gate-size`) and `e2e-visual` now
  `needs: gate-lockfile`, so a lockfile break shows one fast red job instead
  of seven slow ones, and downstream jobs don't burn CI minutes reinstalling
  a lockfile that's already known-broken.
- `merge-gate` now requires `gate-lockfile` too.
- `AGENTS.md`'s CI gate table and "run locally before pushing" section
  updated to match, and the local pre-push command now starts with
  `rm -rf node_modules && npm ci` instead of assuming an existing
  `node_modules` reflects the committed lock (this is the actual local
  routine that let the break through — verifying against a stale
  `node_modules`, or running `npm install`, both mask exactly this failure).

## 4. `build:wasm` / `models:verify` without Emscripten

Verified directly (`which em++` → not found in this environment):

- `npm run build:wasm` → `cpp/build.sh` checks for `em++` on `PATH`; when
  `ALLOW_MISSING_EMSDK=1` (set by `gate-build` and `gate-size`) it prints a
  warning and **exits 0** without attempting a build. Confirmed locally.
  `gate-wasm` is the only job that requires a real Emscripten toolchain
  (it installs one via `mymindstorm/setup-emsdk`), which is correct — it's
  the job responsible for verifying committed WASM binaries aren't stale.
- `npm run models:verify` (`scripts/verify-ship-glb.mjs`) has **no**
  dependency on Emscripten at all — it only parses the JSON chunk of
  committed `.glb` files and cross-checks them against
  `src/blueprints/ships.json`. It ran successfully with no toolchain present
  and needs no guard.

No changes needed here; both already degrade correctly in a CI environment
without Emscripten.

## Out of scope (found, not fixed)

While validating the lockfile fix, `npm run typecheck` and `npx vitest run`
surfaced pre-existing **application** bugs unrelated to dependencies —
missing `icebreaker` ship-type entries in several `Record<ShipType, …>`
literals (`src/systems/shipSpawner.ts`, `src/systems/trafficSystem.ts`,
`src/scenes/Ship.tsx`) and a missing `TrafficSystem.reset()` method
(`src/systems/sim/headless.ts`), causing 4 Vitest failures in
`determinism.harness.test.ts`. These predate this branch (reproduced against
`origin/main` at the same commit) and are app-code, not dependency/lockfile
issues — flagging for a separate fix, not touched here per task scope.

## Summary of changes

| File | Change |
|---|---|
| `package.json` | `postprocessing`: `^6.39.0` → `6.39.4` (exact pin, matches `three`/`@types/three` strategy) |
| `package-lock.json` | Regenerated from a clean `npm install`; adds the 27 entries (`esbuild@0.28.2` + platform binaries nested under `vitest`) that were missing, restoring `npm ci` reproducibility. No dependency was removed or unexpectedly upgraded. |
| `.github/workflows/ci.yml` | New `gate-lockfile` job; wired as a dependency of every other gate + `merge-gate` + `e2e-visual`. |
| `AGENTS.md` | CI gate table updated (added `gate-lockfile`/`gate-size`, fixed stale `gate-summary` → `merge-gate` name); local pre-push instructions now start from a clean install. |

Verified locally after the fix: `rm -rf node_modules && npm ci` exits 0;
`npm ls three postprocessing @react-three/fiber @react-three/drei
@react-three/rapier` exits 0 with no invalid/unmet peers; `npm run
build:wasm` no-ops correctly without Emscripten; `npx vitest run` runs
(429/433 passing, 4 pre-existing unrelated failures per above).
