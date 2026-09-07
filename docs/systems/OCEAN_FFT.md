# FFT ocean (quality-gated)

The `high` quality tier replaces HarborGlow's 4-layer Gerstner swell with a
Phillips-spectrum FFT ocean. `low` and `medium` are untouched.

This is the CPU/WASM half of [ADR 0001](../adr/0001-webgpu-tsl-vs-glsl-first.md)
Phase C. The GPU butterfly passes are a follow-up, gated on device feature
negotiation (#199) — see [Deferred](#deferred-to-the-gpu-pr).

`src/scenes/Water.tsx` remains the only mounted ocean. FFT is a *backend*
behind it, not a second scene authority.

## Tier map

| Preset | Displacement | Height queries (Rapier / foam / tug) |
|---|---|---|
| `low` / `medium` | Gerstner (`gerstnerTsl` + `WaveSystem` / `dsp_hull_sample_batch`) | `getHullSampleBatch` / `waveHeightBatch` WASM |
| `high` | FFT 128² height + choppy displacement texture | `OceanFFTField.heightAt()` — bilinear read of the *same* IFFT grid |
| `cinema` | FFT 256² | same |

`cinema` is not a `QualityPreset` the store models yet. When it lands, add the
row to `OCEAN_FFT_SIZE_BY_QUALITY` in `src/systems/ocean/index.ts`; nothing else
changes. A 256² transform costs ~17 ms on the CPU, so it is gated on the GPU
path rather than shipped on this one.

## Pipeline

`src/systems/ocean/` is pure math — no THREE, no store, no clock, no
`Math.random` — so the headless determinism harness can run it without a
renderer.

| File | Role |
|---|---|
| `fft2d.ts` | Radix-2 Cooley-Tukey (JS fallback). WASM `dsp_fft2d` is preferred when the reactor is ready. |
| `OceanFFTField.ts` | Phillips spectrum, time evolution, IFFT, CPU sampling. |
| `index.ts` | Quality mapping and the deterministic seed. |
| `../../scenes/water/oceanFFTTexture.ts` | Packs the field into a tiling `DataTexture`. |

Following Tessendorf, *Simulating Ocean Water*:

1. **h̃₀(k) = (ξr + i·ξi)/√2 · √P(k)** — built once per wind state, from a
   seeded RNG. `P(k)` is Phillips with a directional cos² term and a capillary
   cutoff at `smallWaveLength`.
2. **h̃(k,t) = h̃₀(k)·e^(iωt) + conj(h̃₀(−k))·e^(−iωt)** — Hermitian, so the
   inverse transform is real-valued. ω = √(g·|k|) (deep water).
3. **D̃(k,t) = −i·(k/|k|)·h̃(k,t)** — horizontal "choppy" displacement that
   sharpens crests and flattens troughs.
4. **IFFT**, then the `(−1)^(row+col)` centre shift that indexing k from −N/2
   leaves behind.

Two inverse transforms per update, not three: `D̃x + i·D̃z` rides in one complex
grid, because both are real fields and the IFFT is linear.

### Why not `dsp_fft_r2c`

The C++ core's existing entry point is a *packed real-to-complex 1-D* transform
capped at N ≤ 4096. An ocean needs a *2-D complex* transform of the spectrum
grid, which that signature cannot express. See [Deferred](#deferred-to-the-gpu-pr)
for the planned `dsp_fft2d_r2c` export.

### FFT convention

Both directions are **unnormalised**:

```
forward(x)[k] = Σ x[n]·e^(−2πi·kn/N)
inverse(X)[n] = Σ X[k]·e^(+2πi·kn/N)
```

so `inverse(forward(x)) === x · N²` on a 2-D grid. This matches Tessendorf's
`h(x,t) = Σ_k h̃(k,t)·e^(i k·x)`, where amplitude is carried by the Phillips
constant instead. Callers wanting a normalised IDFT divide by N² themselves.

## The buoyancy contract

**Rule: hull probes and the water shader read the same field.** Everything
below exists to make that true without a GPU readback.

`WaveSystem.getWaterHeight()` / `getWaterHeightBatch()` short-circuit to
`OceanFFTField.heightAt()` whenever a field is active. That is a bilinear read
of the same `heights` grid that gets packed into the displacement texture, so
`Tugboat.tsx` buoyancy, `FoamSystem`, `Ship.tsx` bob and the visible surface
cannot drift apart.

Rejected alternatives:

- **GPU readback.** Correct by construction, but a `mapAsync` on the render
  path stalls the frame. Not worth it when the CPU already holds the grid.
- **Second analytic evaluation.** Evaluating the spectrum again at hull points
  would be a *different* approximation of the same field, and the two would
  diverge as soon as either side was tuned.

Two approximations are deliberate and worth knowing about:

- **Choppy displacement is ignored by height queries.** The shader moves a
  vertex from grid point `p` to `p + (Dx, h, Dz)`, so the true surface height
  above world XZ is an implicit equation. We evaluate `h` at the query point
  directly. Horizontal error is bounded by `choppiness × amplitude` (well under
  a metre at default settings), and the vertex shader makes the same
  approximation when it finite-differences its own normals.
- **`time` is ignored on the FFT tier.** The field holds one transformed time
  slice, so `getWaterHeight(x, z, time)` always answers for "now". Every
  in-tree caller already passes `waveSystem.getTime()`.

## Determinism

The FFT ocean is inside the [deterministic sim core](./DETERMINISM.md), so:

- The only entropy is `OceanFFTConfig.seed`, drawn through `Rng` (xoshiro128\*\*).
  Same seed + config + time ⇒ bit-identical output.
- `oceanFFTSeed()` uses `Rng.fork()`, which derives an independent stream
  **without advancing** the sim RNG. Building or rebuilding the ocean therefore
  cannot shift the sim hash — asserted in
  `src/systems/ocean/__tests__/oceanDeterminism.test.ts`.
- The field is not part of `captureSimSnapshot()`. The headless harness hashes
  identically whether the FFT tier is on or off, which is what keeps the GPU
  path (a future, non-bit-exact backend) out of the replay fingerprint.
- Field updates are throttled to 30 Hz by an accumulator driven by `SIM_DT`, so
  the cadence is a pure function of accumulated sim time, not of frame rate.

`loopPeriod` quantises ω to multiples of 2π/T so the surface repeats every T
seconds (to within float rounding — the residual is ~1e-6 m). This keeps long
sessions and replays from wandering into an unrepresentative sea state.

## Frame-time budget

Measured on Node 22 / x64, 128² grid:

| Stage | Cost |
|---|---|
| Field update (2 × IFFT + spectrum evolution) | ~3.8–4.4 ms |
| Texture pack (float → half, 16 384 texels) | ~0.44 ms |
| `heightBatch` × 64 hull probes | ~5 µs |

The field runs at 30 Hz (`OCEAN_FFT_UPDATE_INTERVAL`), not per frame, so the
amortised cost at 60 fps is **~2.4 ms/frame**. The texture is re-packed only on
frames where `consumeOceanFFTDirty()` reports a new transform.

Two notes on that trade:

- 30 Hz is invisible on water this slow-moving, and it is the single biggest
  lever available before the GPU path lands.
- Hull sampling gets *cheaper*, not more expensive: one bilinear read replaces
  a 4-layer Gerstner sum per probe.

Bundle impact, gzip: `MainScene` 96.55 → 97.21 KB, `GameShell` 141.58 → 144.05 KB,
`index` unchanged. No new dependency — the transform is ~150 lines in tree.

## Texture format

RGBA **half-float**, `R = Dx`, `G = height`, `B = Dz`, with `RepeatWrapping` so
`uv = worldXZ / patchSize` tiles without an explicit `fract()`.

Half-float on purpose: `rgba16float` is filterable in core WebGPU, so the water
vertex shader samples it with `LinearFilter` without negotiating the
`float32-filterable` device feature (#199). Displacement is a few metres,
comfortably inside half precision (±0.001 m at these magnitudes).

The shader samples with `textureLevel(..., 0)`. This is mandatory, not
stylistic: the sample happens in the vertex stage, where implicit-derivative
sampling is illegal in WGSL.

## `?no_gpu_compute=1`

Unaffected. That switch is helpers-only, and this tier never touches the GPU —
the FFT runs on the CPU and uploads a `DataTexture`. The ocean stays fully
functional on SwiftShader and anywhere `computeShaders` probes as unsupported.

`buildStorageTextureProbeNode()` (formerly `buildOceanFFTNode`) is a device
capability probe that writes normalised UV to a 4×4 storage texture. It was
never an ocean and is not one now; it was renamed so it cannot be mistaken for
this system.

## Deferred to the GPU PR

- **WGSL butterfly passes** → `StorageTexture` height + normal, executed with
  `renderer.computeAsync` on the same device as the probe (adopt, never
  `requestDevice`). Gated on `computeShaders === 'passed'` and, if the
  displacement is filtered as float32, on a granted `float32-filterable`.
- **`dsp_fft2d_r2c` / `dsp_ocean_displace_batch`** in `harborglow_dsp.cpp`,
  wired through `wasmDSP.ts` + `scripts/wasm-exports.mjs`. Not in this PR
  because `check-wasm.mjs` verifies an MD5 of the C++ sources against the
  committed `public/wasm/manifest.json` and asserts each export exists in the
  binaries — so adding a C++ export without an Emscripten toolchain to rebuild
  and re-manifest the `.wasm` artifacts would break `npm run build`. The JS
  transform is the reference implementation the export will have to match;
  scalar first, `-msimd128` as a follow-up.
- **Cinema tessellation**, only if it fits the frame budget.
