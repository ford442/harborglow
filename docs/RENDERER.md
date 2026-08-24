# Renderer — WebGPU required

HarborGlow boots on **WebGPU only**. A failed adapter/device/canvas probe shows a blocking overlay and **does not** construct a `WebGLRenderer` or accept Three’s internal WebGL2 fallback. WebGL/R3F restore is a **later wave** — not a live toggle.

Game state (ships, crane, upgrades, Rapier, camera, music, weather, time-of-day) still lives in Zustand and is independent of the GPU probe.

## Boot probe

Before `<Canvas>` mounts, [`src/rendering/webgpuProbe.ts`](../src/rendering/webgpuProbe.ts) runs:

1. `navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })`
2. `adapter.requestDevice()` — **one device** for the whole session
3. `canvas.getContext('webgpu')` + `configure(...)`
4. Optional trivial compute dispatch (recorded; does not hard-fail)

That device is passed into `WebGPURenderer({ device })` so Three does **not** call `requestDevice()` again (Chrome/Edge flake). gpu-chores (#193) adopt `backend.device` and never call `requestAdapter` / `requestDevice`.

Failed probe → [`WebGPUFatalOverlay`](../src/components/WebGPUFatalOverlay.tsx). No harbor canvas.

### `window.webgpuProbe`

Always published (success and failure):

```ts
{
  ok: boolean
  browser: { brand: string; version?: string; ua: string }  // Chrome vs Edge
  adapterInfo: { vendor?, architecture?, device?, description? } | null
  limits: Record<string, number> | null
  compute: 'not-run' | 'passed' | 'failed' | 'unsupported'
  reason: string | null  // no-gpu | adapter-null | requestDevice-rejected | configure-failed | webgl2-fallback
  ignoredForceGl: boolean  // ?renderer=webgl / stored webgl preference — disabled this phase
}
```

Also: `getWebgpuProbe()` in module scope (includes the live `device` on success; not copied onto `window`).

## Force-GL flags (disabled this phase)

| Old switch | This phase |
|---|---|
| `?renderer=webgl` | Ignored (`ignoredForceGl: true`). Still WebGPU or hard-fail. |
| Leva **Renderer Backend** | Removed |
| `localStorage` `harborglow.renderer.preference=webgl` | Ignored; not written |

`parseRendererPreference()` always returns `'webgpu'`.

## Debug helpers (WebGPU session)

- **G** / `&wireframe=1` — scene-wide wireframe
- **F** / `&physicsDebug=1` — Rapier `<Debug />`
- `?screenshot=1` — `preserveDrawingBuffer` (WebGL-path guarantee; no-op on a real WebGPU swapchain)
- `window.harborglowRenderer`, `<canvas>.dataset.renderer`

## Architecture (R3F + Three.js)

```
App.tsx (menu / loading)
  └─ GameShell
       ├─ runWebgpuBootProbe()          // before Canvas
       ├─ WebGPUFatalOverlay            // probe fail — no Canvas
       └─ <Canvas gl={createGameRenderer}>   // probed device only
            Physics / MainScene / diagnostics
```

Core files under `src/rendering/`:

- `webgpuProbe.ts` — adapter + device + configure + `window.webgpuProbe`
- `createRenderer.ts` — WebGPURenderer with probed `device`; throws on `webgl2-fallback`
- `rendererConfig.ts` — preference always `webgpu`; screenshot / expose helpers
- `rendererState.ts` — diagnostics store
- `gpuChores/` — histogram / blur helpers; adopt-only device

## Context Options & Color Management

Every live renderer still goes through `configureRendererDefaults` (`src/rendering/rendererDefaults.ts`):

| Setting | Value |
|---|---|
| `THREE.ColorManagement.enabled` | `true` |
| `outputColorSpace` | `SRGBColorSpace` |
| `toneMapping` / `toneMappingExposure` | `ACESFilmicToneMapping` / `1.0` |
| `shadowMap.enabled` / `.type` | quality-preset driven |
| `setClearColor` | `0x0a0f14` |

### WebGPU Options Matrix (r183 asked-vs-honoured)
Three's `WebGPURenderer` does not currently support or exposes a different API for some WebGL context options:

| Option | Status |
|--------|--------|
| `device` | Honoured (passed from probe) |
| `canvas` | Honoured |
| `antialias` | Honoured |
| `preserveDrawingBuffer` | Ignored (use manual readback or Playwright screenshot) |
| `logarithmicDepthBuffer` | Ignored |
| `stencil` | Ignored |
| `premultipliedAlpha` | Ignored |

`depth: true` (god-rays / DOF / SSAO). `logarithmicDepthBuffer: false`.

### Screenshot mode (`preserveDrawingBuffer`)

Enabled by `?screenshot=1`, `?preserveDrawingBuffer=1`, or a Playwright/headless UA. This is a WebGL drawing-buffer guarantee; under WebGPU it is a no-op. Harbor pixel snapshots are **deferred** until WebGL restore or a WebGPU CI runner.

## Post-Processing Contract

`src/scenes/PostProcessing.tsx` uses Three r183 TSL `RenderPipeline` + `pass` / `bloom` / optional `ssr` (not JSM `EffectComposer`). God-rays are a TSL radial-blur node sampling the scene-pass depth texture. Quality `low` skips the pipeline and uses the default R3F present. `supportsSSR` is true only when the WebGPU compute capability is present **and** the TSL SSR pass is constructed (high/cinema).

## GPU chores vs domain compute

Generic image helpers live in [`src/rendering/gpuChores/`](../src/rendering/gpuChores/)
(foundation **#193**). They are **not** ocean FFT or god-rays.

Rules:

1. **One device.** Probe owns `requestDevice()`. Helpers adopt `WebGPURenderer.backend.device`. After a **failed** probe they must not call `requestDevice()`.
2. **No dual-hot GL+WebGPU.** There is no GL scene this phase.
3. **`?no_gpu_compute=1`** kills **helpers only**. FFT / god-rays keep their own gates.
4. Backend order: WebGPU (boot probe ok + compute probe `passed`) → WASM → JS.
5. Histogram readback is **256 bins** only.

Breadcrumbs: `window.harborglowRenderer.gpuChores`, `window.webgpuProbe`.

## three.js upgrade notes

Pinned: `three@0.183.1` / `@types/three@0.183.1`. Imports: `three/webgpu`, `three/tsl`.

`WebGPURenderer` still installs an internal `getFallback` → WebGL2. HarborGlow **rejects** that path after `init()` (`backend.isWebGPUBackend` required) and never returns it to R3F.

Hybrid GLSL/TSL materials remain the longer-term plan in [ADR 0001](./adr/0001-webgpu-tsl-vs-glsl-first.md); the **runtime** WebGL/R3F fallback is deferred (foundation **#194**).

### Bundle budget (`vendor-3d`)

| Metric | Budget |
|--------|--------|
| Soft ceiling (gzip) | **~1.1 MB** |
| Review gate | past **~1.25 MB** gzip needs a measured win |

## CI / Playwright

Headless Chromium + SwiftShader typically has **no WebGPU**. This phase:

- Menu tests still run
- After New Game, assert **fatal overlay** + `window.webgpuProbe.ok === false` (`e2e/webgpu-probe.spec.ts`)
- Harbor overview / wireframe pixel snapshots are **skipped** until WebGL restore or a WebGPU CI runner
- Do not pin `?renderer=webgl` to “still look like a harbor”

## Related Files

- `src/rendering/webgpuProbe.ts`, `createRenderer.ts`, `gpuChores/`
- `src/components/WebGPUFatalOverlay.tsx`
- `src/GameShell.tsx`
- `e2e/webgpu-probe.spec.ts`

---

Last updated: 2026-08 (WebGPU-required boot probe #194; gpu-chores one-device #193).
WebGL/R3F fallback deferred.
