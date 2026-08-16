# C++ WebAssembly DSP Module — HarborGlow

This directory contains the C++ source for `harborglow_dsp.wasm`, a
WebAssembly module that offloads performance-critical DSP and simulation
math from the main TypeScript game loop.

## What's in the module

| Function | Description |
|---|---|
| `dsp_mix(a, b, t)` | Linear interpolation |
| `dsp_clamp(x, lo, hi)` | Value clamping |
| `dsp_remap(v, lo1, hi1, lo2, hi2)` | Range remapping |
| `dsp_smooth_step(t)` | Cubic smoothstep |
| `dsp_smoother_step(t)` | Ken Perlin's smoother-step |
| `dsp_sin_approx(x)` | Fast sine (Bhaskara I, ~0.1 % error, [0, π]) |
| `dsp_sin_full(x)` | Full-cycle fast sine (any radian input) |
| `dsp_wave_height(...)` | Single Gerstner wave height sample (`sin(dot·freq + time·speed)`) |
| `dsp_wave_height_batch(...)` | Batch Gerstner query (many positions, one layer) |
| `dsp_additive_synth_sample(...)` | Additive synthesizer partial sum |
| `dsp_additive_block(...)` | Phase-continuous 256-partial block synthesis |
| `dsp_audio_rms(data, count)` | RMS of a float32 buffer |
| `dsp_convolver_*` | Stateful impulse-response convolution |
| `dsp_generate_room_ir(...)` | Deterministic cab/hold impulse responses |
| `dsp_ring_*` | C11 atomic SPSC command/analysis queues |
| `dsp_audio_engine_*` | Fixed-voice real-time synth/effect engine |
| `malloc` / `free` | Heap allocators for batch buffer passing from JS |

The TypeScript binding (`src/systems/wasmDSP.ts`) loads the **raw** `.wasm`
via `WebAssembly.instantiate` (not the Emscripten MODULARIZE glue). It falls
back to pure JS implementations when WASM is unavailable (e.g. in Node unit
tests).

## Building

### Requirements

- **Emscripten SDK ≥ 3.1** — [Installation guide](https://emscripten.org/docs/getting_started/downloads.html)

```bash
# 1. Install / activate Emscripten
git clone https://github.com/emscripten-core/emsdk.git ~/emsdk
cd ~/emsdk && ./emsdk install latest && ./emsdk activate latest
source ~/emsdk/emsdk_env.sh

# 2. Build from this directory
cd /path/to/harborglow/cpp
./build.sh          # optimised release  →  ../public/wasm/harborglow_dsp.wasm
./build.sh debug    # debug + sanitizers
./build.sh clean    # remove artifacts
```

Or directly via npm from the repo root:

```bash
npm run build:wasm
```

### Output

| File | Purpose |
|---|---|
| `../public/wasm/harborglow_dsp.wasm` | Private growable memory; simulation and direct TypeScript helpers |
| `../public/wasm/harborglow_audio_shared.wasm` | Fixed shared memory; scalar AudioWorklet engine |
| `../public/wasm/harborglow_audio_shared_simd.wasm` | Fixed shared memory; SIMD + relaxed-SIMD AudioWorklet engine |
| `../public/wasm/manifest.json` | Source MD5, binary SHA-256, sizes, and toolchain identity |

The `.wasm` file is **committed** to the repository so the game runs without a
local Emscripten install. CI runs `npm run check:wasm` to validate source
freshness, artifact hashes/imports/exports, and DSP golden vectors.

### Build flags (Makefile)

- `STANDALONE_WASM=1` + `--no-entry` — reactor library with no `main()`; loadable
  via raw `WebAssembly.instantiate` with a single `env.emscripten_notify_memory_growth`
  import stub (see `wasmDSP.ts`).
- `INITIAL_MEMORY=262144` (256 KB) — covers Emscripten runtime + batch float
  buffers; grows via `ALLOW_MEMORY_GROWTH`.
- Shared audio builds use a fixed 32 MiB imported memory, atomics/bulk-memory,
  and a scalar plus `-O3 -msimd128 -mrelaxed-simd` variant. The runtime probes
  the optimized artifact before falling back to scalar.
- **Not used at runtime:** MODULARIZE / `harborglow_dsp.js` glue (historical
  builds emitted this file; the game binds exports directly).

## Architecture

```
C++ (harborglow_dsp.cpp)
        │  Emscripten STANDALONE_WASM
        ▼
public/wasm/harborglow_dsp.wasm
        │  WebAssembly.instantiate (+ env stub)
        ▼
src/systems/wasmDSP.ts          await wasmDSP.init() at app boot
        │  waveHeight / waveHeightBatch / audioRms …
        ▼
src/systems/WaveSystem.ts       getWaterHeight + getWaterHeightBatch
src/scenes/FoamSystem.tsx       crest grid batch sampling
src/scenes/Tugboat.tsx          single-point buoyancy probes
```

Boot order: `App.tsx` `startGame()` calls `await wasmDSP.init()` on the loading
screen **before** MainScene / WaveSystem queries run.

The audio engine is initialized independently on the first user gesture by
`AudioRuntime`. Shared-memory audio requires HTTPS (or localhost),
`SharedArrayBuffer`, `AudioWorklet`, and these response headers:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

Vite dev/preview sets them. Production hosting must do the same and serve WASM
as `application/wasm`; otherwise the native Web Audio compatibility path is
selected without blocking game startup.

## Adding new functions

1. Declare in `harborglow_dsp.h` (with `extern "C"` and doxygen comment).
2. Implement in `harborglow_dsp.cpp` (with `DSP_EXPORT`).
3. Add to `EXPORTS` in `Makefile`.
4. Add TypeScript binding in `src/systems/wasmDSP.ts` (interface + JS fallback).
5. Add export name to `scripts/check-wasm.mjs` `REQUIRED_EXPORTS` if public.
6. Re-run `npm run build:wasm`, `npm run check:wasm`, and commit the updated `.wasm`.
