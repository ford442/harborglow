# FFT ocean (quality-gated)

The `high` quality tier replaces HarborGlow's 4-layer Gerstner swell with a
Phillips-spectrum FFT ocean. `low` and `medium` are untouched. When the boot
probe reports `compute === 'passed'` and `?no_gpu_compute` is off, **high and
cinema displacement IFFT run as a WGSL Stockham compute pass** on the adopted
probe device (ADR 0001 Phase C, issue #219). The CPU/WASM path remains the
hull-probe source of truth and the fallback on SwiftShader / kill-switch.

`src/scenes/Water.tsx` remains the only mounted ocean. FFT is a *backend*
behind it, not a second scene authority.

## Tier map

| Preset | Displacement | Height queries (Rapier / foam / tug) |
|---|---|---|
| `low` / `medium` | Gerstner (`gerstnerTsl` + `WaveSystem` / `dsp_hull_sample_batch`) | `getHullSampleBatch` / `waveHeightBatch` WASM |
| `high` | FFT 128² — GPU Stockham when gated, else CPU/WASM | `OceanFFTField.heightAt()` — bilinear read of the *same* IFFT grid |
| `cinema` | FFT 256² **GPU-only** | same 256² CPU/WASM grid (never a 128 stand-in) |

`cinema` is an **ocean-only** tier, not a store `QualityPreset`. Opt in with
`?ocean=cinema` or the Leva **Ocean / Cinema 256** toggle. If the GPU gate is
closed, cinema falls back to 128² (high) and logs once — a 256² JS IFFT is
never scheduled as the visual path.

## Pipeline

`src/systems/ocean/` is pure math — no THREE, no store, no clock, no
`Math.random` — so the headless determinism harness can run it without a
renderer. GPU code lives under `src/scenes/water/`.

| File | Role |
|---|---|
| `fft2d.ts` | Radix-2 Cooley-Tukey **reference**. WASM `dsp_fft2d` / `dsp_fft2d_r2c` match this kernel. |
| `stockham2d.ts` | Self-sorting Stockham schedule; oracle for the WGSL butterflies. |
| `OceanFFTField.ts` | Phillips spectrum, time evolution, CPU/WASM IFFT, CPU sampling. Copies `spectrumH*` / `spectrumD*` before the in-place IFFT for the GPU. |
| `index.ts` | Quality mapping (`resolveOceanFftSize`) and the deterministic seed. |
| `oceanGpuGate.ts` | `canUseGpuOceanFft` / `parseOceanCinema`. |
| `../../scenes/water/oceanFFTTexture.ts` | CPU fallback: packs the field into a tiling `DataTexture`. |
| `../../scenes/water/oceanFftWgsl.ts` | Stockham + centre-shift pack WGSL. |
| `../../scenes/water/oceanFFTCompute.ts` | Adopt-only device, `computeAsync` StorageTexture alloc, butterfly + pack. |

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
grid, because both are real fields and the IFFT is linear. Height IFFT uses
`dsp_fft2d_r2c(..., inverse)` / `fft2dC2R` (Hermitian → real); choppy stays
full complex `dsp_fft2d`.

### `dsp_fft2d_r2c`

Full N×N layout, **not** packed N×(N/2+1). Packed r2c would be a second
convention the JS reference does not speak. `inverse = 0` copies `real_in` into
`re`, zeros `im`, then forward `dsp_fft2d`. `inverse ≠ 0` is c2r (inverse
`dsp_fft2d`). Twiddles are C++ `float`; JS `Fft1D` uses `Float64Array` — the
Vitest bound is 1e-4, not bit-identical.

### FFT convention

Both directions are **unnormalised**:

```
forward(x)[k] = Σ x[n]·e^(−2πi·kn/N)
inverse(X)[n] = Σ X[k]·e^(+2πi·kn/N)
```

so `inverse(forward(x)) === x · N²` on a 2-D grid. This matches Tessendorf's
`h(x,t) = Σ_k h̃(k,t)·e^(i k·x)`, where amplitude is carried by the Phillips
constant instead. Callers wanting a normalised IDFT divide by N² themselves.

## GPU path

Gate (all must hold):

- `getWebgpuProbe().compute === 'passed'`
- `?no_gpu_compute` is not `1` / `true` (this **does** force ocean FFT onto
  CPU/WASM; gpuChores image helpers keep their own use of the same flag)
- `renderer.computeAsync` exists
- `adoptComputeDevice(renderer)` returns the probe-owned device — **never**
  `requestAdapter` / `requestDevice`

`float32-filterable` is **not** required: displacement stays `rgba16float`.

Butterflies: raw WGSL on the adopted device. Stage params never change, so
`init()` writes one 16-byte uniform buffer per Stockham stage and builds every
ping-pong bind group once (step *k* reads A → B when *k* is even; after
2·log₂N steps the result is back in A, which the pack group binds). A dispatch
is two spectrum `writeBuffer`s, one pack-params write, **one compute pass and
one submit**. Pack writes a Three `StorageTexture` allocated via
`renderer.computeAsync` (same contract as `buildStorageTextureProbeNode`).
Dispatch is fire-and-forget — no `await` and no `mapAsync` on the frame path.

WGSL compile and pipeline validation errors are *asynchronous* — they never
throw — so `init()` builds buffers, shaders, pipelines and bind groups inside
`validation` + `out-of-memory` error scopes and awaits them. Any error latches
the session to the CPU `DataTexture` pack and warns once. (Before this, a bad
shader reported `ready` and left a flat ocean under bobbing hulls.)

### Parity on a real device

`e2e/ocean-gpu-parity.spec.ts` drives `OceanFFTCompute` on Chromium's
SwiftShader WebGPU adapter (`--use-webgpu-adapter=swiftshader`) through a Vite
dev server, reads the texture back **in the test only**, and asserts it equals
`OceanFFTField.heights` / `displacementX` / `displacementZ`:

| Grid | max \|h\| | max \|Δh\| | max \|ΔD\| |
|---|---|---|---|
| 128² | 2.88 m | 1.6 mm | 1.1 mm |
| 256² | 2.98 m | 2.0 mm | 1.4 mm |

The residual is half-float quantisation (2⁻⁹ m for \|h\| ∈ [2, 4)); the bound
is 5 mm. The same spec injects a renamed WGSL entry point and asserts `init()`
refuses the GPU path. The app's boot probe still rejects SwiftShader, so this
does not change what CI users see; it skips when no adapter exists.

## The buoyancy contract

**Rule: hull probes and the water shader read the same field.** Everything
below exists to make that true without a GPU readback.

`WaveSystem.getWaterHeight()` / `getWaterHeightBatch()` short-circuit to
`OceanFFTField.heightAt()` whenever a field is active. That is a bilinear read
of the same `heights` grid the CPU/WASM IFFT just wrote. When the GPU path is
on, the visual texture is a Stockham IFFT of the **same frequency-domain copy**
(`spectrumH*` / `spectrumD*`); hull still uses the CPU grid. Iteration 1
therefore runs both IFFTs — duplicate work, correct buoyancy.

`dsp_ocean_displace_batch` bilinear-samples height + Dx + Dz together (WASM
fast path for `OceanFFTField.displaceBatch` / `heightBatch`).

Rejected alternatives:

- **GPU readback.** Correct by construction, but a `mapAsync` on the render
  path stalls the frame.
- **Second analytic evaluation.** Evaluating the spectrum again at hull points
  would be a *different* approximation of the same field.

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
  identically whether the FFT tier is on or off, which keeps the GPU path (not
  bit-exact vs Cooley-Tukey) out of the replay fingerprint. **With the GPU
  path off (Vitest / Node / `?no_gpu_compute=1`) the hash is unchanged.**
- Field updates are throttled to 30 Hz by an accumulator driven by `SIM_DT`, so
  the cadence is a pure function of accumulated sim time, not of frame rate.

`loopPeriod` quantises ω to multiples of 2π/T so the surface repeats every T
seconds (to within float rounding — the residual is ~1e-6 m). This keeps long
sessions and replays from wandering into an unrepresentative sea state.

## Frame-time budget

Re-measured 2026-09-14 on Node 22 / x64 (mean of 15 `OceanFFTField.update`
calls after warmup, plus `createOceanFFTTexture.sync`). GPU butterfly time
needs a real WebGPU adapter; SwiftShader / this environment hits the WebGPU
fatal overlay, so GPU ms are **not measurable here**.

| Grid | Stage | Before (CPU visual) | After (CPU hull + GPU visual when gated) |
|---|---|---|---|
| 128² | Field update (2 × IFFT + spectrum) | 5.70 ms | same (hull still CPU/WASM) |
| 128² | Texture pack (half-float upload) | 1.07 ms | 0 on GPU path (WGSL pack) |
| 128² | Amortised at 60 fps / 30 Hz field | 3.4 ms/frame | 2.85 ms/frame CPU + GPU submit |
| 256² | Field update | 24.0 ms JS (never the visual path) | GPU visual; hull still this 256² IFFT |
| 256² | Texture pack | 1.79 ms (CPU fallback only) | WGSL pack, no CPU half conversion |
| either | `heightBatch` × 64 hull probes | ~0.16 ms JS | `dsp_ocean_displace_batch` when WASM |

The field still runs at 30 Hz (`OCEAN_FFT_UPDATE_INTERVAL`). The CPU
`DataTexture` is packed only when the GPU gate is closed.

GPU-path **main-thread** cost of `OceanFFTCompute.dispatch()` (interleave +
uploads + encode + submit), mean of 20 calls, Chromium/SwiftShader, three runs
each — noisy, so ranges:

| Grid | Per-stage submits + per-call bind groups (initial) | Static bind groups, one submit (current) |
|---|---|---|
| 128² | 1.26–3.15 ms (15 submits, 29 bind groups) | 0.87–1.41 ms (1 submit, 0 bind groups) |
| 256² | 2.44–5.92 ms (17 submits, 33 bind groups) | 1.64–3.87 ms |

Butterfly execution time on a hardware adapter is still unmeasured here;
SwiftShader wall-clock is not representative.

No new dependency — in-tree radix-2 only.

## Texture format

RGBA **half-float**, `R = Dx`, `G = height`, `B = Dz`. The vertex shader samples
`fract(worldXZ / patchSize)` with `textureLevel(..., 0)` so a GPU
`StorageTexture` without `RepeatWrapping` still tiles. Implicit-derivative
sampling is illegal in the vertex stage.

Half-float on purpose: `rgba16float` is filterable in core WebGPU, so the water
vertex shader can use `LinearFilter` without negotiating `float32-filterable`.
Displacement is a few metres, comfortably inside half precision (±0.001 m).

## `?no_gpu_compute=1`

**Forces the CPU/WASM ocean FFT** (DataTexture pack). gpuChores image helpers
also honour this flag. God-rays keep their own gates.

`buildStorageTextureProbeNode()` (formerly `buildOceanFFTNode`) is a device
capability probe that writes normalised UV to a 4×4 storage texture. It was
never an ocean and is not one now; `OceanFFTCompute` uses the same
`computeAsync` + `StorageTexture` allocation trick, then writes Tessendorf
displacement into that texture.

## Deferred

- **Cinema tessellation**, only if it fits the frame budget.
- Dropping the duplicate CPU IFFT once a non-stalling hull grid is proven
  (not `mapAsync` on the frame path).
