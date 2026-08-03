# ADR 0001 — WebGPU TSL materials + FFT ocean (vs GLSL-first)

- **Status:** Accepted (planning decision for epic [#165](https://github.com/ford442/HarborGlow/issues/165))
- **Date:** 2026-08-03
- **Deciders:** HarborGlow graphics / foundation track
- **Related:** [`docs/RENDERER.md`](../RENDERER.md), [`docs/plans/feature-plan.md`](../plans/feature-plan.md), [`docs/ARCHIVE.md`](../ARCHIVE.md), [`docs/systems/SYSTEM_BOOTSTRAP.md`](../systems/SYSTEM_BOOTSTRAP.md), child-issue specs in [`docs/plans/WEBGPU_TSL_FFT_CHILD_ISSUES.md`](../plans/WEBGPU_TSL_FFT_CHILD_ISSUES.md)

## Context

HarborGlow is already **WebGPU-primary with a toggleable WebGL2 fallback** (`src/rendering/`, unified context options + `configureRendererDefaults` via #143). Playwright visual regression pins `?renderer=webgl`. Living-harbor systems tick through the bootstrap registry (#160). Ocean rendering has a single live authority: `src/scenes/Water.tsx` (Gerstner + `WaveSystem` / WASM batch heights); parallel stacks including `FFTOcean.tsx` were archived (#162).

What remains aspirational from the feature plan and research synthesis:

| Area | Today | North star |
|------|--------|------------|
| Materials | `lightShowNodes.ts` → `MeshStandardMaterial` / GLSL god-ray | TSL node materials on WebGPU |
| Post | Vanilla JSM `EffectComposer` (GLSL only) | Dual-path; compute/TSL only behind capability gates |
| Ocean | Gerstner JS/WASM via `Water.tsx` | Quality-tier FFT displacement (High/Cinema) without a second scene authority |
| three.js | `0.160.x`; WebGPU via `examples/jsm/.../WebGPURenderer.js` shim | Bump when R3F/drei peers allow; prefer `three/webgpu` + `three/tsl` exports |
| Caps probe | `maxTextureSize`, `maxAnisotropy`, `preserveDrawingBuffer`, `adapterInfo` | Also `computeShaders`, `float32Filterable` |

Two competing strategies were on the table:

1. **GLSL-first forever** — keep one shader dialect, treat WebGPU as a drop-in renderer only.
2. **TSL / WebGPU-native only** — abandon GLSL once the three bump lands.

Neither matches the dual-renderer + CI reality of this repo.

## Decision

**Adopt a hybrid dual-path: GLSL remains the WebGL / CI reference; TSL (and optional WGSL compute) are progressive enhancements on a real WebGPU device.**

Concrete rules:

1. **Stay Three.js-only by default.** Do not add `@babylonjs/core` (or another engine) unless a measured compute helper wins against the [vendor-3d bundle budget](#bundle-budget). Phase D evaluations must publish gzip delta before merge.
2. **GLSL path is mandatory for anything in the shared scene graph.** Every new material / post pass that ships for gameplay must remain correct under `?renderer=webgl`. Playwright baselines must not regress when WebGPU gains features.
3. **TSL is the preferred WebGPU material dialect after Phase A** (three bump unlocking `three/tsl` / `three/webgpu`). Port light-rig, god-ray, and water shading with explicit fallbacks — not a silent NodeMaterial-only fork.
4. **`Water.tsx` stays the sole ocean authority.** FFT is a *backend* behind quality tiers (Low = Gerstner JS/WASM; High = FFT texture displacement; Cinema = higher res ± tessellation if feasible), registered/updated via existing wave bootstrap (`waves` order 120), not a revived parallel `FFTOcean` scene. Archive sketch may be mined; the loser is deleted or stays archived.
5. **Compute is opt-in behind capability probes**, never assumed. Extend `RendererCapabilities` with `computeShaders` and `float32Filterable` before any WGSL FFT / god-ray compute lands. CPU/WASM Gerstner remains the universal fallback.
6. **Post-processing stays on the GLSL `EffectComposer` contract until Phase A completes.** Migration to TSL/WGSL passes is a follow-up PR, gated on three + `@react-three/postprocessing` peer alignment (`docs/RENDERER.md` already documents this).
7. **Out of scope for this epic’s implementation PRs:** VR crane cab, mobile touch, light-show video export, multiplayer — track as separate epics.

### Chosen three.js target (Phase A)

- **Minimum unlock:** a three release where package exports include `three/webgpu` and `three/tsl`, and current `@react-three/fiber` / `drei` / `rapier` / `postprocessing` peers allow the bump without forcing an R3F major unless that major is itself the unlock.
- **Pinned today:** `three@^0.160.0` (installed `0.160.1`) with **no** `webgpu`/`tsl` export map entries — the JSM shim stays until the bump PR.
- **Do not** drive-by bump three inside a materials or ocean PR; Phase A is its own child issue.

## Consequences

### Positive

- CI and agent workflows keep a stable GLSL/WebGL2 reference while production WebGPU can gain fidelity.
- Matches the existing parity checklist and “tune on webgl → verify on webgpu” workflow in `docs/RENDERER.md`.
- Ocean work reuses WASM DSP + `WaveSystem` instead of forking a second water stack.
- Capability gates prevent shipping compute that silently no-ops or crashes on software rasterizers.

### Negative / costs

- Two material dialects to maintain for ported surfaces until a distant GLSL sunset (not planned in this epic).
- three bump may force coordinated peer upgrades (R3F, drei, postprocessing) and a one-time EffectComposer revalidation.
- FFT High/Cinema tiers add complexity (textures, optional workers/SAB) and must justify frame-time and bundle cost.

### Neutral

- `shaders/god-rays-compute.wgsl` remains a **pattern reference**, not production, until bind-group contracts match the live post stack post-bump.
- Tone.js and Rapier stay; optional WASM additive synth / buoyancy batch sampling are Phase D evaluations, not dependencies of A–C.

## Bundle budget

| Chunk | Soft ceiling (gzip) | Notes |
|-------|---------------------|--------|
| `vendor-3d` (three + R3F + drei + rapier + postprocessing) | **~1.1 MB** (measured ~1,096 kB, Apr 2026) | Hard review gate |
| `vendor-audio` (tone) | ~70 kB gzip | Not in scope for graphics deps |
| MainScene lazy | ~50 kB gzip | Materials/ocean code preferably here or smaller app chunks, not new top-level vendors |

**Rules for implementation PRs:**

- Run `npm run build` (or `build:analyze`) and report **before/after `vendor-3d` gzip** in the PR body.
- Reject any new dependency that grows `vendor-3d` past **~1.25 MB gzip** (~15% headroom) without a measured frame-time or fidelity win documented in the PR.
- Prefer tree-shakeable `three/tsl` / `three/webgpu` subpath imports over pulling alternate engines.
- FFT CPU reference code and large lookup tables must not inflate the cold main bundle; lazy / quality-gated load is required for Cinema tier.

See also the metrics table in `AGENTS.md` and the porting notes in `docs/RENDERER.md`.

## Prerequisites (do not start A–C implementation until green)

| Prerequisite | Status (as of ADR date) | Why |
|--------------|-------------------------|-----|
| Real WASM DSP + `WaveSystem` batch heights | In tree (`public/wasm/`, `wasmDSP`) — keep #159/#147 hygiene | FFT/buoyancy need trustworthy CPU/WASM heights |
| Single ocean authority | Done (#162) — `Water.tsx` only | Avoid parallel stacks |
| System bootstrap registry | Done (#160) — `docs/systems/SYSTEM_BOOTSTRAP.md` | Compute/update systems register cleanly |

## Implementation sequencing

```
Phase A (baseline) → Phase B (TSL materials) → Phase C (FFT hybrid)
                         ↘ optional compute probes can land in A
Phase D (Babylon? WASM synth? buoyancy batch) — evaluate only after C
```

Child issues with acceptance criteria: [`docs/plans/WEBGPU_TSL_FFT_CHILD_ISSUES.md`](../plans/WEBGPU_TSL_FFT_CHILD_ISSUES.md). File them on GitHub under epic #165 before opening implementation PRs.

## Alternatives considered

| Option | Why rejected |
|--------|----------------|
| GLSL-only indefinitely | Leaves WebGPU as a hollow primary; blocks FFT compute and TSL materials called out in the feature plan |
| TSL-only / drop WebGL path | Breaks Playwright baselines, Spector debugging, and the documented agent workflow |
| Add Babylon for compute helpers up front | Likely blows `vendor-3d` budget; Three compute + WASM already cover the planned workloads |
| Revive `FFTOcean.tsx` as a sibling of `Water.tsx` | Reintroduces dual ocean authorities; contradicts #162 hygiene |

## References

- Epic: [#165](https://github.com/ford442/HarborGlow/issues/165)
- Foundation: [#143](https://github.com/ford442/HarborGlow/issues/143) context/pipeline hygiene
- Feature plan §1.1–1.2: `docs/plans/feature-plan.md`
- Archived FFT sketch: `scripts/archive/scenes/FFTOcean.tsx`
