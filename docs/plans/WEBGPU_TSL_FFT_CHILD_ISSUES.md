# Child issues — Epic #165 WebGPU TSL + FFT ocean

Ready-to-file GitHub issue bodies for phases A–C of epic [#165](https://github.com/ford442/HarborGlow/issues/165).  
Architecture decision: [`docs/adr/0001-webgpu-tsl-vs-glsl-first.md`](../adr/0001-webgpu-tsl-vs-glsl-first.md).

**Process:** File each child issue on GitHub, label with `graphics` / `webgpu` / `epic`, and set the body parent to #165 **before** opening implementation PRs. Do not combine A+B+C in one PR.

**Out of scope for these children:** VR, multiplayer, mobile touch, light-show video export (separate epics).

---

## Issue A — Three.js / WebGPU baseline bump + capability probes

**Title:** `Phase A: three bump (three/webgpu+tsl) + extend RendererCapabilities for compute`

**Parent:** #165  
**Blocked by:** none (prerequisites WASM / water hygiene / bootstrap already landed)  
**Blocks:** Phase B, Phase C compute path

### Context

The Phase A baseline now pins `three@0.183.1` and `@types/three@0.183.1`, with
React 19 / R3F 9 ecosystem peers. HarborGlow imports the public
`three/webgpu` and `three/tsl` entry points, and diagnostics expose
`computeShaders`, `float32Filterable`, and a storage-texture compute probe.

### Scope

1. Keep the exact r183 baseline aligned with the React 19 / R3F 9 peer graph; do not move to Three 0.185.x while `postprocessing@6.39.x` caps Three below 0.184.
2. Keep `createRenderer.ts` on `three/webgpu` and the TSL material/compute code on `three/tsl`, without a JSM renderer or constructor shim.
3. Extend `RendererCapabilities` / `readRendererCapabilities` with:
   - `computeShaders: boolean | null`
   - `float32Filterable: boolean | null`
   Persist via existing diagnostics / `window.harborglowRenderer`.
4. Re-run Playwright WebGL baselines (`npm run test:e2e`); update only if intentional and documented.
5. Report **before/after `vendor-3d` gzip** in the PR body (soft ceiling ~1.1 MB; reject unexplained jumps past ~1.25 MB).

### Non-goals

- Porting materials to TSL (Phase B).
- FFT ocean (Phase C).
- Migrating `PostProcessing.tsx` off GLSL EffectComposer (follow-up after A unless peers force it).

### Acceptance

- [ ] App boots on `?renderer=webgpu` and `?renderer=webgl` after the bump.
- [ ] Import path uses `three/webgpu` (no JSM WebGPURenderer shim) **or** ADR amended with why not.
- [ ] Diagnostics expose compute / float32-filterable probes (null-safe on WebGL / software GL).
- [ ] `npm run typecheck && npm run test && npm run build` green; e2e WebGL baselines non-regressing.
- [ ] Bundle delta for `vendor-3d` recorded in PR.

---

## Issue B — TSL materials parity (light rigs, god-rays, water) + GLSL fallback

**Title:** `Phase B: TSL light-rig / god-ray / water materials with GLSL fallback`

**Parent:** #165  
**Blocked by:** Phase A  
**Blocks:** none (can parallelize with Phase C design; C may consume water TSL)

### Context

`src/shaders/lightShowNodes.ts` still returns `MeshStandardMaterial` / GLSL `ShaderMaterial`. ADR 0001 requires dual-path parity: TSL on real WebGPU, GLSL under `?renderer=webgl`. Visual parity checklist lives in `docs/RENDERER.md`.

### Scope

1. Port (or dual-build) materials for:
   - Emissive / RGB matrix light-rig surfaces used by the light show
   - God-ray cone / shaft material (keep depth-friendly behavior compatible with the post stack)
   - Water surface shading hooks used by `Water.tsx` (appearance only — displacement backend is Phase C)
2. Select implementation via `activeBackend === 'webgpu'` **and** capability checks; never break the WebGL path.
3. Extend the parity checklist in `docs/RENDERER.md` if new surfaces need explicit rows.
4. Guard any `three/tsl` imports so the WebGL/CI bundle does not hard-crash on missing NodeMaterial APIs.

### Non-goals

- FFT displacement / compute butterflies (Phase C).
- Replacing EffectComposer with a full TSL post graph (optional later).
- Changing Playwright to exercise WebGPU (baselines stay WebGL).

### Acceptance

- [ ] Same scene under `?renderer=webgl` and `?renderer=webgpu` passes the parity checklist for emissive rigs, god-rays, water+fog.
- [ ] Playwright WebGL visual baselines unchanged (or intentionally updated with screenshots + rationale).
- [ ] No `@ts-ignore` / `@ts-nocheck`; TSL entry points typed.
- [ ] `vendor-3d` gzip delta reported; no new engine dependencies.

---

## Issue C — FFT ocean quality tiers (Gerstner / WASM ↔ FFT texture) under Water.tsx

**Title:** `Phase C: FFT ocean hybrid tiers behind Water.tsx + WaveSystem`

**Parent:** #165  
**Blocked by:** Phase A (for GPU compute path); Gerstner/WASM CPU FFT prototype may start after A capability probes land  
**Related:** archived `scripts/archive/scenes/FFTOcean.tsx` (mine or replace; do not remount as a second ocean)

### Context

Live ocean is Gerstner + `WaveSystem` (WASM batch heights). Feature plan tiers: Low = Gerstner; High = FFT texture displacement; Cinema = higher res ± tessellation. ADR 0001: **no second ocean authority** — integrate into `Water.tsx` / wave system / bootstrap `waves` group.

### Scope

1. Define quality mapping onto existing presets (`low | medium | high | cinema`):
   - Low / Medium → Gerstner JS/WASM (current path, possibly tuned)
   - High → FFT height/displacement texture (CPU worker or GPU compute if `computeShaders`)
   - Cinema → higher FFT resolution; tessellation only if feasible and budget-safe in-browser
2. Keep Rapier buoyancy sampling on trustworthy height queries (`WaveSystem` / WASM); document how FFT heights sync to CPU samples (readback, dual sim, or shared spectrum).
3. If GPU FFT: WGSL butterfly passes behind capability gates; reuse orphaned compute-shader **patterns** from `god-rays-compute.wgsl` docs — not necessarily that shader.
4. If main-thread budget exceeded: Worker or SharedArrayBuffer path for large grids (feature-detect; fall back cleanly).
5. Delete or leave archived any losing FFT prototype; update `docs/ARCHIVE.md` / archive README.

### Non-goals

- Babylon or other engines.
- VR / dock-walk product features.
- Shipping Cinema tessellation if it fails perf gates — document deferral.

### Acceptance

- [ ] Only `Water.tsx` mounted for ocean; no parallel FFT scene component in `MainScene`.
- [ ] Low tier matches current Gerstner visual/perf character; High tier demonstrably FFT-driven when enabled.
- [ ] WebGL path never requires compute; Playwright baselines green.
- [ ] Capability probe gates compute; missing caps → Gerstner/WASM.
- [ ] Frame-time notes + `vendor-3d` / MainScene chunk deltas in PR.
- [ ] Loser FFT sketch removed or explicitly kept archived with pointer to the winner.

---

## Issue D (optional / later) — Library & physics evaluations

**Title:** `Phase D (eval): stay Three-only; WASM synth + Rapier buoyancy batch (no Babylon by default)`

**Parent:** #165  
**Blocked by:** Phase C (meaningful only after FFT heights exist)

File only when ready to evaluate. Default outcome per ADR: **reject Babylon**; keep Tone.js + Rapier; consider WASM wave → Rapier buoyancy force batch if profiling warrants.

### Acceptance (eval PR)

- [ ] Written go/no-go with gzip and frame-time measurements.
- [ ] No merge of `@babylonjs/core` without beating the bundle budget rule in ADR 0001.

---

## Filing checklist

When creating the GitHub issues, paste the sections above and add:

```markdown
Epic: #165
ADR: docs/adr/0001-webgpu-tsl-vs-glsl-first.md
```

After filing, replace this doc’s headings with links (`## [Issue A](url) — ...`) or list issue numbers under the epic body checkboxes.
