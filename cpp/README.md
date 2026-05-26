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
| `dsp_wave_height(...)` | Single Gerstner wave height sample |
| `dsp_wave_height_batch(...)` | Batch Gerstner query (many positions) |
| `dsp_additive_synth_sample(...)` | Additive synthesizer partial sum |
| `dsp_audio_rms(data, count)` | RMS of a float32 audio buffer |

The TypeScript binding (`src/systems/wasmDSP.ts`) loads the module
asynchronously and falls back to pure JS implementations when WASM is
unavailable (e.g. in server-side test environments).

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
| `../public/wasm/harborglow_dsp.wasm` | WASM binary — loaded at runtime |
| `../public/wasm/harborglow_dsp.js` | Emscripten JS glue (not imported by game; raw WASM API is used) |

The `.wasm` file is committed to the repository so that the game runs
without requiring a local Emscripten installation.

## Architecture

```
C++ (harborglow_dsp.cpp)
        │  compiled by Emscripten
        ▼
public/wasm/harborglow_dsp.wasm
        │  loaded by
        ▼
src/systems/wasmDSP.ts
        │  consumed by
        ▼
src/systems/WaveSystem.ts   (wave_height_batch)
src/systems/musicSystem.ts  (additive_synth_sample)
src/scenes/Water.tsx        (wave height queries)
```

## Adding new functions

1. Declare in `harborglow_dsp.h` (with `extern "C"` and doxygen comment).
2. Implement in `harborglow_dsp.cpp` (with `DSP_EXPORT`).
3. Add to `EXPORTS` in `Makefile`.
4. Add TypeScript binding in `src/systems/wasmDSP.ts` (interface + fallback).
5. Re-run `npm run build:wasm` and commit the updated `.wasm`.
