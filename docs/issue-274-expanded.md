# #274 (expanded 2026-11-01) — Gate mid-game ship spawn: safe RigidBody wrapper + import ban + opt-in every-ship-type e2e

Base: `main` @ `953abb5` (contains `25370e0`, the #273 fix). Do **not** build on `feat/231-transient-crane-store` — its `GameShell.tsx` has diverged.

## Context

`src/scenes/Ship.tsx` passed `enabledRotations={undefined}` (plus `mass`/damping `undefined`) to fixed `RigidBody`s from PR #133 (2026-07-19) to PR #273 (2026-10-26). `@react-three/rapier` 2.2.0 `setRigidBodyOptions` runs every mutable handler whose key is `in` props; the `enabledRotations` handler destructures `[x, y, z]` → `TypeError: undefined is not iterable` on any body mounted after the world exists (`ShipSpawner.spawnShip()`, festival act 2+). Other handlers (`setGravityScale(undefined)`, etc.) don't throw but write garbage. Ecosystem check 2026-11-01: 2.2.0 is still `latest`, the `key in options` path is unchanged, rapier 3.0 (tracking issue #789, R3F 10 alpha) has no date and no sign of changing this. No upstream ESLint plugin covers it.

## What changed from the first draft (expansion findings)

- **Fix the cause in one place instead of only linting for one shape.** An AST selector cannot see `const rot = cond ? arr : undefined; enabledRotations={rot}`, `{...props}` holding an undefined value, `undefined as number`, or `void 0`. A wrapper that drops `undefined`-valued keys before they reach rapier covers all of them at runtime; an import ban makes the wrapper mandatory. This replaces the `no-restricted-syntax` selector as the merge gate.
- **ESLint config detail:** `no-restricted-syntax` options are *replaced* by later blocks (`eslint.config.js:5`), so any syntax rule would have to be appended in both the `src/**` block (L46–49) and the `src/systems/**` block (L54–57). `no-restricted-imports` has the same replace semantics — put it in one block whose `files` covers `src/**/*.{ts,tsx}` and that no later block re-sets.
- **Festival leg needs rigs installed:** `HarborFestival.update` waits in `awaitingRigs` until the current ship is fully upgraded; nothing in the spec installs rigs, so act 2 never spawns without an `installCurrentShipUpgrades()` debug method.
- **The ErrorBoundary catch produces no `pageerror`**, so the shared fixture can't see the crash; the spec must assert on a boundary testid **and** on console errors containing `is not iterable`.
- **The debug object exists on the fatal overlay too**, so "debug object present" ≠ scene booted; race the overlay against canvas + `harborglowDebug.spawnShip`.

## Approach

### Commit 1 — `SafeRigidBody` + import ban (the merge gate)

1. `src/scenes/physics/SafeRigidBody.tsx` (new): re-exports a `RigidBody` that drops keys whose value is `=== undefined` (**not** `null`, not `false` — `colliders={false}` is meaningful) and forwards everything else, keeping rapier's `RigidBodyProps` typing and ref (React 19: `ref` is a prop; keep the `RapierRigidBody` ref type). Pure helper `omitUndefined(props)` exported for testing. Same module re-exports `RapierRigidBody` type etc. only if call sites need them.
2. Migrate the 9 call sites to import from the wrapper: `Ship.tsx`, `Tugboat.tsx`, `TugboatTargetShip.tsx`, `DistressedShip.tsx`, `Player.tsx`, `IceField.tsx`, `Dock.tsx`, `DockWalkEnvironment.tsx`, `Crane.tsx`. Other named imports from `@react-three/rapier` (`Physics`, colliders, hooks) stay.
3. `eslint.config.js`: `no-restricted-imports` with `paths: [{ name: '@react-three/rapier', importNames: ['RigidBody'], message: '…rapier applies undefined props (PR #273); import RigidBody from src/scenes/physics/SafeRigidBody' }]`, with an override block that turns it off for `SafeRigidBody.tsx` only.
4. Tests (vitest, no browser):
   - `omitUndefined`: drops `undefined`, keeps `null`, `false`, `0`, arrays, nested objects untouched.
   - `src/test/__tests__/rigidBodyImportBan.test.ts`: `new ESLint({ cwd: repoRoot })`, `lintText` with `filePath: 'src/scenes/rigidBodyFixture.tsx'` (must be `.tsx` under `src/` and not ignored; assert `results.length === 1`). Bad fixture `import { RigidBody } from '@react-three/rapier'` → exactly one `no-restricted-imports` message matching `/rapier/`; good fixture importing from the wrapper → zero.

### Commit 2 — debug hook, boundary testid, opt-in spec, docs

5. `src/GameShell.tsx`, inside main's existing `screenshotMode` effect (after the `if (!screenshotMode) return` guard), add to `harborglowDebug`: `shipTypes()` → `SHIP_TYPES`; `spawnShip(type)` → `{ id, name }`; `shipCount()`; `setOperationMode('crane'|'tugboat')`; `removeShip(id)`; `startFestival()` → `recordHostInput('event.festival.start', null)` (import from `src/systems/sim/hostInput.ts`, not the barrel); `installCurrentShipUpgrades()` → loop `currentShip.attachmentPoints` → `installUpgrade`. No chunk moves (all modules already in the entry graph).
6. `src/components/ErrorBoundary.tsx:49`: `data-testid="error-boundary"` on the fallback root.
7. `e2e/ship-spawn.spec.ts` (default project; imports `test`/`expect` from `e2e/helpers.ts`; copy, don't import, the six SwiftShader launch args from `e2e/show-particles.spec.ts` behind `PLAYWRIGHT_WEBGPU=1`; use the preview webServer):
   - Skip order: `goto('/?wireframe=0&screenshot=1')` → skip if no `navigator.gpu` → New Game → race `webgpu-fatal-overlay` vs canvas + `spawnShip` → skip "app probe rejected this adapter" if overlay wins. Test timeout ~180 s.
   - For each `shipTypes()`: spawn, two rAFs, count +1, boundary count 0. Then tugboat ↔ crane switch, `removeShip(last)`, same checks.
   - `attachConsoleCollector`; assert no console error contains `is not iterable` (string in the assertion message).
   - Second test: skip unless `PLAYWRIGHT_FESTIVAL=1` (also needs `PLAYWRIGHT_WEBGPU=1`), 10 min timeout: `startFestival` → `installCurrentShipUpgrades` → poll `shipCount` until +2, boundary 0.
8. `AGENTS.md` Testing Strategy: the debug members (only with `?screenshot=1`), the two env flags, "skips in CI; run on a GPU machine before touching `Ship.tsx`, `harborFestival.ts`, or the rapier version", and the `SafeRigidBody` rule.

## Acceptance criteria

- [ ] No file except `SafeRigidBody.tsx` imports `RigidBody` from `@react-three/rapier`; `npm run lint` clean.
- [ ] Import-ban vitest: bad fixture → 1 rapier-naming `no-restricted-imports` message, good → 0; fails if the rule is deleted (checked locally).
- [ ] `omitUndefined` vitest passes; `null`/`false` preserved.
- [ ] Negative control (local): `git revert --no-commit 25370e0` on top of commit 1 → GPU spec **passes** (wrapper absorbs it); the same revert with `Ship.tsx` importing raw rapier → lint fails. Restore afterwards.
- [ ] GPU machine: `PLAYWRIGHT_WEBGPU=1 npx playwright test e2e/ship-spawn.spec.ts` — 13 types, both mode switches, one remove, no boundary, no `is not iterable`. With `PLAYWRIGHT_FESTIVAL=1`, act 2 spawns.
- [ ] Flags unset (CI): both tests skip with the stated reasons; `e2e-visual` stays green, no 120 s timeout.
- [ ] `npm run build && npm run check:bundle`: every chunk within 0.5 KB gzip; `npm run verify` green; `npm run heartbeat` clean.

## Out of scope / rejected

- **No `no-restricted-syntax` undefined-prop selector.** Superseded by the wrapper; add it later only if someone wants an editor-time hint.
- **No mocked-rapier render test of `Ship.tsx`.** It mocks the exact internal behaviour (`key in options`) under test and rots on upgrade; `omitUndefined` + the GPU spec cover both sides.
- **No GPU CI job here.** Lavapipe/Dawn-Vulkan on hosted runners or a paid T4 runner is a separate decision (see open questions).
- Do not touch `src/systems/lightShows/**`, `src/components/lightShowEditor/**`, `src/scenes/particles/**`, `src/rendering/particles/**` (#270 swarm).

## Open questions (Noah)

1. Wrapper path: `src/scenes/physics/SafeRigidBody.tsx` OK, or keep the import name `RigidBody` via a `@/physics` alias?
2. Known limitation: if a prop changes from a value to `undefined`, the wrapper drops the key and rapier keeps the old value (it doesn't reset). That was a crash before, so it's no worse, but is that acceptable or should the wrapper map `undefined` to rapier's default per key?
3. GPU in CI: try lavapipe (`mesa-vulkan-drivers`) on `ubuntu-latest` as a follow-up issue, or accept that the spec stays manual?
