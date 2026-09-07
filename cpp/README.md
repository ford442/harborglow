# C++ WebAssembly DSP Module — HarborGlow

This directory contains the C++ source for `harborglow_dsp.wasm`, a
WebAssembly module that offloads performance-critical DSP and simulation
math from the main TypeScript game loop.

## What's in the module

| Function | Description |
|---|---|
| `dsp_mix(a, b, t)` | Linear interpolation |
| `dsp_clamp(x, lo, hi)` | Value clamping |
| `dsp_remap(v, lo1, hi1, lo2, hi2)` | Range remapping (`lo2` if `|hi1-lo1| < 1e-20`) |
| `dsp_smooth_step(t)` | Cubic smoothstep |
| `dsp_smoother_step(t)` | Ken Perlin's smoother-step |
| `dsp_sin_approx(x)` | Fast sine (Bhaskara I, ~0.1 % error, [0, π]) |
| `dsp_sin_full(x)` | Full-cycle fast sine (any radian input) |
| `dsp_wave_height(...)` | Single Gerstner wave height sample (`sin(dot·freq + time·speed)`) |
| `dsp_wave_height_batch(...)` | Batch Gerstner query (many positions, one layer; SIMD when compiled `-msimd128`) |
| `dsp_additive_synth_sample(...)` | Additive synthesizer partial sum |
| `dsp_additive_block(...)` | Phase-continuous 256-partial block synthesis |
| `dsp_audio_rms(data, count)` | RMS of a float32 buffer (SIMD reduction when available) |
| `dsp_fft_r2c(...)` | Packed real-to-complex FFT, N = 2^log2N ≤ 4096, Hermitian N-bin output |
| `dsp_convolver_*` | Stateful impulse-response convolution |
| `dsp_generate_room_ir(...)` | Deterministic cab/hold impulse responses |
| `dsp_ring_*` | C11 atomic SPSC command/analysis queues |
| `dsp_audio_engine_*` | Fixed-voice real-time synth/effect engine |
| `malloc` / `free` | Heap allocators for batch buffer passing from JS |

The TypeScript binding (`src/systems/wasmDSP.ts`) probes WASM SIMD with
`WebAssembly.validate`, then loads `harborglow_dsp_simd.wasm` or the scalar
`harborglow_dsp.wasm` via raw `WebAssembly.instantiate`. It falls back to
pure JS (including a matching FFT) when WASM is unavailable.

Export names are parsed from the public headers by
`scripts/wasm-exports.mjs`. `check:wasm` fails if the headers, Makefile
export list, `wasmDSP.ts` required array, and committed binaries disagree.

## Building

### Requirements

- **Emscripten SDK 6.0.6** (CI pin; ≥ 3.1 works for local iteration) —
  [Installation guide](https://emscripten.org/docs/getting_started/downloads.html)

```bash
# 1. Install / activate Emscripten (match CI)
git clone https://github.com/emscripten-core/emsdk.git ~/emsdk
cd ~/emsdk && ./emsdk install 6.0.6 && ./emsdk activate 6.0.6
source ~/emsdk/emsdk_env.sh

# 2. Build from this directory
cd /path/to/harborglow/cpp
./build.sh          # optimised release (fails if em++ is missing)
./build.sh debug    # DWARF + ASSERTIONS (no ASan on standalone WASM)
make debug-native   # host ASan/UBSan tests
make compile-commands  # gitignored cpp/compile_commands.json for clangd
make tidy           # optional clang-tidy (does not fail CI)
./build.sh clean    # remove artifacts
./build.sh --allow-missing-emsdk   # skip compile when em++ is absent
```

`ALLOW_MISSING_EMSDK=1` is the same skip. Use it only when iterating on
TypeScript and trusting committed artifacts. `npm run build` from the repo
root is strict by default (requires `em++`). CI job `gate-build` sets the
env skip because `gate-wasm` already rebuilds with emsdk and diffs
`public/wasm`.

```bash
npm run build:wasm   # from repo root
make test            # native assertion harness (host c++, no emsdk)
make bench           # native micro-benchmarks
node ../scripts/bench-wasm-dsp.mjs
```

### Output

| File | Purpose |
|---|---|
| `../public/wasm/harborglow_dsp.wasm` | Growable-memory scalar reactor |
| `../public/wasm/harborglow_dsp_simd.wasm` | Same reactor with `-msimd128` |
| `../public/wasm/harborglow_audio_shared.wasm` | Fixed shared memory; scalar AudioWorklet engine |
| `../public/wasm/harborglow_audio_shared_simd.wasm` | Fixed shared memory; SIMD + relaxed-SIMD AudioWorklet engine |
| `../public/wasm/manifest.json` | Source MD5, binary SHA-256, sizes, and toolchain identity |

The `.wasm` files are **committed** so the game runs without a local
Emscripten install. CI rebuilds from source (emsdk 6.0.6) and fails on
drift.

### Build flags (Makefile)

- `STANDALONE_WASM=1` + `--no-entry` — reactor library with no `main()`;
  loadable via raw `WebAssembly.instantiate` with
  `env.emscripten_notify_memory_growth` (logged in DEV from `wasmDSP.ts`).
- `INITIAL_MEMORY=4194304` (4 MiB) — covers the Emscripten reactor, 2048-point
  FFT scratch (3×8 KiB), a 16×16 wave batch, and a multi-second room IR
  without a per-scene heap copy. `ALLOW_MEMORY_GROWTH=1` remains on for
  larger convolvers. Measured heap after instantiate is 4 MiB (64 pages).
- Core SIMD artifact: `-O3 -flto -msimd128`. Shared audio builds keep a
  fixed 32 MiB imported memory plus a scalar / `-msimd128 -mrelaxed-simd`
  pair.
- **`-mrelaxed-simd` is load-bearing.** It is used only on
  `harborglow_audio_shared_simd.wasm`. `scripts/check-wasm.mjs` compiles every
  committed artifact with `new WebAssembly.Module(bytes)`. Node 20’s V8 does
  not enable relaxed SIMD, so that check fails with an opaque
  `WebAssembly.CompileError`. Use Node 22+ (or a V8 with relaxed SIMD) for
  `npm run check:wasm`. Do not drop the flag without an AudioWorklet SIMD
  regression test.
- Warnings: native `make test` uses `-Wall -Wextra -Wshadow -Wconversion -Werror`.
  em++ uses the same warnings non-fatally. The ring buffer is compiled with
  `emcc -std=c11` (not fed to `em++` as a `.c` file). Remaining em++ notes:
  `PTHREAD_POOL_SIZE` and `MAXIMUM_MEMORY` are unused-command-line-arguments
  on `STANDALONE_WASM` (no JS glue / no `ALLOW_MEMORY_GROWTH`); they stay as
  documented intent, not dropped in this PR.
- **Not used at runtime:** MODULARIZE / `harborglow_dsp.js` glue.
- Shared audio: `-pthread -s PTHREAD_POOL_SIZE=0` plus `-matomics -mbulk-memory`
  for imported SharedArrayBuffer. Pool size 0 means no pthread workers; dropping
  `-pthread` is a follow-up after AudioWorklet regression tests.
- **clangd:** `make compile-commands` writes gitignored `compile_commands.json`
  (native `-std=c++17`/`-std=c11` plus em++-shaped wasm32 entries). Editors
  without that file use committed `compile_flags.txt` (`--target=wasm32`,
  `-msimd128`, `-matomics`, `-mbulk-memory`, empty `DSP_EXPORT` /
  `EMSCRIPTEN_KEEPALIVE` macros).
- **Debug:** `make debug` / `make debug-wasm` is DWARF + `ASSERTIONS` only.
  ASan + `SAFE_HEAP` need JS glue and a growing heap; they are not valid on
  `STANDALONE_WASM` + `--no-entry`. Host sanitizers: `make debug-native`.

## Benchmarks

Recorded 2026-08-16 on the implementation host (x86_64 Linux, Node 20,
`em++` 6.0.6). Times are µs/call, 200 iterations after one warmup.

| Kernel | Native `c++ -O3` | WASM scalar | WASM SIMD |
|---|---:|---:|---:|
| `dsp_wave_height_batch` n=256 | 8.3 | 36.8 | 9.9 |
| `dsp_audio_rms` n=1024 | 1.0 | 1.7 | 1.2 |
| `dsp_fft_r2c` N=2048 | 46.6 | 64.0 | 50.3 |

Re-run with `make bench` and `node scripts/bench-wasm-dsp.mjs`. SIMD wave
batch still uses scalar `sin` per lane (parity with `Math.sin`); the
speedup is from vectorized phase arithmetic. RMS is a `f32x4` reduction.

## Architecture

```
C++ (harborglow_dsp.cpp)
        │  Emscripten STANDALONE_WASM
        ▼
public/wasm/harborglow_dsp.wasm          (scalar)
public/wasm/harborglow_dsp_simd.wasm     (SIMD, preferred)
        │  WebAssembly.validate probe + instantiate
        ▼
src/systems/wasmDSP.ts          await wasmDSP.init() at app boot
        │  waveHeight / waveHeightBatch / audioRms / fftR2C …
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

1. Declare in the appropriate header (`harborglow_dsp.h`,
   `harborglow_audio_engine.h`, or `dsp_ring_buffer.h`) with `extern "C"`.
2. Implement with `DSP_EXPORT` / `AUDIO_EXPORT`.
3. Add the TypeScript binding in `src/systems/wasmDSP.ts` if it is part of
   the JS reactor API (keep the `required` array in `bindInstance` in sync —
   `scripts/wasm-exports.mjs --check` enforces this).
4. Re-run `npm run build:wasm`, `npm run check:wasm`, `make -C cpp test`,
   and commit the updated `.wasm` files plus `manifest.json`.
