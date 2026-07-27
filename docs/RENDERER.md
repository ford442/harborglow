# Renderer Toggle — WebGPU + WebGL2 Fallback

HarborGlow supports two rendering backends. All game state (ships, crane kinematics, upgrades, physics via Rapier, camera, music sync, weather, time-of-day, etc.) lives in the Zustand store and is **completely shared**. Only the Three.js renderer implementation changes.

This enables:
- Visual debugging of 3D scenes, crane, ships, glowing light rigs, particles, and music-reactive effects when WebGPU output is hard for humans/agents/Playwright to inspect.
- A stable GLSL/WebGL2 reference implementation while porting or iterating on TSL/WGSL shaders and post-processing.
- Reliable CI / automated visual regression + pixel sampling (WebGL2 is far easier to drive headlessly with software rasterizers).

## Quick Start

| URL param (or Leva)          | Backend                          | Primary Use Case |
|------------------------------|----------------------------------|------------------|
| `?renderer=webgpu` (default) | WebGPURenderer (or internal WebGL2 fallback) | Production / highest fidelity path |
| `?renderer=webgl`            | WebGLRenderer                    | Debug, inspection, shader porting, agent collaboration, Playwright |

Examples (append to dev server URL):
```
http://localhost:5173/?renderer=webgl
http://localhost:5173/?renderer=webgl&wireframe=1&physicsDebug=1
http://localhost:5173/?renderer=webgpu
```

The choice is also persisted to `localStorage` under the key `harborglow.renderer.preference` and synced into the URL on change.

For live surface/flare/rig tuning see [LOOK_DEV.md](./LOOK_DEV.md) (**Visual Polish** Leva folder).

## Leva Debug UI

In-game, open the Leva panel (bottom-right; click the title bar if collapsed). Look for the **"Renderer Backend"** folder:

- Dropdown switches between "WebGPU (primary)" and "WebGL2 (fallback/debug)".
- Changing it immediately remounts the R3F Canvas with the new renderer (keyed remount + async `gl` factory).
- The folder is collapsed by default.

## Debug Helpers (available in both renderers)

- **Wireframe geometry overlay**: Press `G` or add `&wireframe=1` to the URL. Forces `material.wireframe = true` on all meshes (ships, crane, rigs, dock, etc.). Original values are restored when toggled off.
- **Physics debug draw (Rapier colliders)**: Press `F` or add `&physicsDebug=1`. Renders collider wireframes + helpful visual markers via `@react-three/rapier`'s `<Debug />`.
- **Renderer status banner**: A yellow top banner appears automatically when:
  - WebGPU is not available in the browser, or
  - You are explicitly using the WebGL2 debug path.
  It shows the active backend name (e.g. "WebGLRenderer", "WebGPURenderer (WebGL2 fallback)").
- Additional Leva controls (in "Harbor Controls") remain fully functional for lights, weather, time, storm, audio BPM, etc. under either renderer.

Keyboard works even when Leva is focused (basic input guards are present).

## Architecture (R3F + Three.js)

```
App.tsx
  └─ <Canvas
       key={`renderer-${preference}`}   // remounts fiber root on switch
       gl={async (props) => createGameRenderer(props, { preference, ... })}
     >
       <Physics>
         <MainScene ... />               // 100% identical scene graph & systems
         <RendererDiagnosticsMonitor />  // writes to module-level rendererState
         <WireframeDebug enabled={...}/>
         {physicsDebug && <Debug />}
       </Physics>
     </Canvas>
  └─ Leva (always mounted; contains "Renderer Backend" folder)
```

Core files (all under `src/rendering/`):

- `types.ts` — `RendererPreference`, `ActiveRendererBackend`, `RendererDiagnostics`
- `rendererConfig.ts` — `parseRendererPreference`, `persistRendererPreference`, URL + localStorage + `exposeRenderer` (for canvas.dataset + window)
- `rendererState.ts` — module singleton + subscription (crosses Canvas boundary safely)
- `createRenderer.ts` — async factory + `resolveContextOptions` / `DEFAULT_CONTEXT_OPTIONS`:
  - `webgl` → `new THREE.WebGLRenderer(...)`
  - `webgpu` → `import('three/examples/jsm/renderers/webgpu/WebGPURenderer.js')`; `new WebGPURenderer(...)`; `await renderer.init()`
  - both → `configureRendererDefaults(renderer, ...)` before returning
- `rendererDefaults.ts` — the single shared color / tone-mapping / shadow setup, plus `readRendererCapabilities` and the quality-preset → shadow-tier mapping
- `WireframeDebug.tsx` — scene traversal + material snapshot/restore
- `RendererDiagnosticsMonitor.tsx` — lives inside Canvas, calls `useThree().gl`, updates diagnostics + exposure
- `index.ts` — clean re-exports

`WebGPUWarning.tsx` (in `components/`) was upgraded to also act as a live renderer status banner by subscribing to the diagnostics store.

## Context Options & Color Management

Both backends are created from one fully-resolved option set (`resolveContextOptions`,
`src/rendering/createRenderer.ts`), and both are then passed through
**`configureRendererDefaults`** (`src/rendering/rendererDefaults.ts`). That function is the
only place color space, tone mapping, shadows and clear colour are set — the two
backends do not ship the same defaults, and that mismatch was the main source of
parity drift.

Applied to every renderer:

| Setting | Value | Notes |
|---|---|---|
| `THREE.ColorManagement.enabled` | `true` | linear working space |
| `outputColorSpace` | `SRGBColorSpace` | |
| `toneMapping` / `toneMappingExposure` | `ACESFilmicToneMapping` / `1.0` | overridable per call (look-dev) |
| `shadowMap.enabled` / `.type` | quality-preset driven | `low → Basic`, `medium → PCF`, `high`/`cinema` → `PCFSoft` |
| `setClearColor` | `0x0a0f14`, alpha `1` (or `0` when `alpha: true`) | night-harbor fog base |

Every write is guarded, so a backend missing a field (WebGPURenderer's `shadowMap` is a
backwards-compat shim) is skipped rather than throwing.

`<Canvas shadows={...}>` in `App.tsx` is fed from the *same* mapping
(`shadowMapTypeForQuality`), because R3F re-applies shadow settings after the `gl`
factory returns.

### Context option matrix (three r160)

`GameRendererOptions` accepts the full set below. Support differs per backend —
the WebGPU path in r160 forwards only a subset to its backend, and its internal
WebGL2 fallback calls `getContext('webgl2')` with **no attributes at all**.

| Option | Default | `WebGLRenderer` (`?renderer=webgl`) | `WebGPURenderer` (WebGPU device) | `WebGPURenderer` (WebGL2 fallback) |
|---|---|---|---|---|
| `antialias` | `true` | ✅ | ✅ (→ `sampleCount: 4`) | ❌ no-op |
| `powerPreference` | `'high-performance'` | ✅ | ✅ (`requestAdapter`) | ❌ no-op |
| `alpha` | `false` | ✅ | ❌ no-op | ❌ no-op (context default `alpha: true`) |
| `premultipliedAlpha` | `true` | ✅ | ❌ no-op | ❌ no-op |
| `preserveDrawingBuffer` | `false` | ✅ | ❌ no-op | ❌ no-op |
| `stencil` | `false` | ✅ | ❌ no-op | ❌ no-op |
| `depth` | `true` | ✅ | ❌ no-op (depth always allocated) | ❌ no-op |
| `logarithmicDepthBuffer` | `false` | ✅ | ❌ no-op | ❌ no-op |
| `failIfMajorPerformanceCaveat` | `false` | ✅ | ❌ no-op | ❌ no-op |

Requested values are recorded verbatim in the diagnostics store regardless of whether a
backend honours them, so tooling can see intent vs. reality (`capabilities.preserveDrawingBuffer`
reports what the *live* context actually did, when readable).

Two defaults are deliberate and should not be flipped casually:
- **`depth: true`** — god-rays, DOF and SSAO sample the depth buffer.
- **`logarithmicDepthBuffer: false`** — log depth breaks depth-texture reads in the post stack.

### Screenshot mode (`preserveDrawingBuffer`)

`canvas.toDataURL()` / Playwright canvas screenshots return a blank buffer unless the
drawing buffer is preserved. `parseScreenshotMode()` turns it on when **any** of these hold:

- `?screenshot=1` (or `?screenshot=true`)
- `?preserveDrawingBuffer=1`
- the UA looks like Playwright / HeadlessChrome, or `navigator.webdriver === true`

Combine with the debug backend for deterministic frames: `?renderer=webgl&screenshot=1`.
The e2e helper (`e2e/helpers.ts`) already boots with this. Note the flag is a **WebGL-path
only** guarantee — under a real WebGPU device it is a no-op, which is another reason
visual tests pin `?renderer=webgl`.

## Post-Processing Contract

`src/scenes/PostProcessing.tsx` deliberately uses the **vanilla JSM `EffectComposer`**
stack (`RenderPass` / `UnrealBloomPass` / `ShaderPass`) rather than the installed
`@react-three/postprocessing`:

- the god-rays pass is a hand-written GLSL `ShaderPass` (`src/shaders/GodRaysShader.ts`)
  needing direct control over the depth buffer and the light's NDC projection, which the
  `postprocessing` effect-merging pipeline does not expose cleanly;
- r160's `pmndrs/postprocessing` peer range and the WebGPU renderer do not line up, so a
  migration would have to happen together with the three.js bump (below).

Rules for anything added to the stack:

1. Sample counts, bloom strength and god-ray density are wired **only** through the
   existing quality presets (`low | medium | high | cinema`) — no ad-hoc constants.
2. Keep a GLSL path that the WebGL2 backend exercises; guard TSL/WGSL-only code behind
   `activeBackend === 'webgpu'`.
3. `shaders/god-rays-compute.wgsl` remains a **v2 reference only** — its bind-group
   contract does not match r160's EffectComposer. It stays behind a feature flag until
   the three.js upgrade lands.

## three.js upgrade notes

Current: `three@0.160` with `@types/three@0.158` (a deliberate mismatch — the types lag).
Consequences that this module works around today:

- `three/webgpu` is **not** in r160's package exports map, so the import path is
  `three/examples/jsm/renderers/webgpu/WebGPURenderer.js`.
- `@types/three@0.158` types that constructor as `{ canvas, antialias, sampleCount }` only,
  even though `WebGPUBackend` forwards `powerPreference` / `requiredLimits` to
  `requestAdapter()`. `createRenderer.ts` documents the real contract in
  `WebGPURendererParameters` and casts the constructor once, so no `any` / `@ts-ignore`
  leaks into the hot path.

Before bumping past r160, re-verify in this order: `@react-three/fiber` 8.x peer range,
`@react-three/rapier` 1.x, `@react-three/postprocessing`, then switch the import to
`three/webgpu` and drop the constructor shim. Track it as its own PR — it is not a
drive-by change.

## Visual Parity Expectations

- **Ships, crane, attachment points, light rigs, particles, AudioReactiveLightShow, spectator drone, water, weather, time-of-day lighting, moon, wildlife, etc.** — should look extremely close. Differences will mainly be:
  - Subtle variations in post-processing / tone mapping / shadow maps between native WebGPU and the WebGL2 path inside WebGPURenderer or pure WebGLRenderer.
  - TSL node materials (if/when activated in `shaders/lightShowNodes.ts`) will only be fully active on a real WebGPU device.
  - Some very new WebGPU-only extensions or high-precision storage textures are not expected in the fallback.
- The **gameplay loop, upgrade installation, music/lyrics sync, physics (Rapier), economy, missions** are 100% identical.

### Parity checklist

Run the same scene under `?renderer=webgl` and `?renderer=webgpu` and compare:

| # | Check | What to look for |
|---|---|---|
| 1 | Overall exposure / gamma | No global brightness or wash-out shift — both are sRGB out + ACES |
| 2 | Bloom | Same threshold bite on light rigs; halo radius within a pixel or two |
| 3 | God-rays (once merged) | Shafts anchored to the same sun NDC position; density scales with the quality preset on both |
| 4 | Shadows | Same shadow-map tier for the active quality preset; no missing/hard-edged casters |
| 5 | Emissive light rigs | Installed rigs pulse to the same beat with the same peak colour |
| 6 | Water + fog | Horizon fog blend and clear colour match |
| 7 | Depth-dependent effects | DOF / SSAO active at the same distances (depth buffer is live on both) |
| 8 | Backend banner | Reports the expected backend — a silent WebGL2 fallback invalidates the comparison |

Record the active backend from `window.harborglowRenderer` in any parity screenshot filename;
`WebGPURenderer (WebGL2 fallback)` is not the WebGPU path.

When porting a graphics feature:
1. Implement / tune first under `?renderer=webgl` (easy to step through GLSL, inspect in Spector.js / WebGL Inspector, take deterministic screenshots).
2. Verify parity under `?renderer=webgpu`.
3. Only then enable advanced TSL / compute paths guarded by capability checks.

## CI / Agent / Playwright Usage

- Force the debug renderer for visual tests or traces: `?renderer=webgl`
- Force readable canvas pixels: `?screenshot=1` (see *Screenshot mode* above)
- Read current backend from:
  - `window.currentRenderer`
  - `window.harborglowRenderer` — `{ preference, activeBackend, contextOptions, capabilities }`
    where `capabilities` is `{ maxTextureSize, maxAnisotropy, preserveDrawingBuffer, adapterInfo }`
  - `<canvas>.dataset.renderer`, `.dataset.activeBackend`, `.dataset.preserveDrawingBuffer`
- Combine with `&wireframe=1` or `&physicsDebug=1` for geometry/physics verification frames.
- The Leva panel can be collapsed/hidden in CI (it does not affect rendering).

## Porting Notes (WebGL2 → WebGPU)

| Concern                  | WebGL2 (reference)                  | WebGPU (target)                              |
|--------------------------|-------------------------------------|----------------------------------------------|
| Materials                | MeshStandardMaterial + custom ShaderMaterial (GLSL) | Same + TSL nodes (from `three/tsl` or `three/webgpu`) |
| Post-processing          | @react-three/postprocessing (EffectComposer + passes) | Works on both; some passes have WGSL paths   |
| Shadows                  | PCF / VSM via WebGLRenderer         | WebGPURenderer shadow maps (may need config) |
| Compute / FFT waves      | JS / CPU fallback or texture ping-pong | WGSL compute (future in WaveSystem / water)  |
| Custom light rigs / glow | MeshBasic + emissive + layers       | Same; can add TSL god-ray / bloom nodes      |
| Performance measurement  | drawCalls, triangles via gl info    | Same + timestamp queries when available      |

When adding a new shader effect, keep a GLSL version that the WebGL2 path exercises. Guard TSL-only code behind `if (activeBackend === 'webgpu')`.

## Related Files & Cross-References

- `src/App.tsx` — Canvas wiring, Leva bridge, keyboard, debug component placement
- `src/scenes/MainScene.tsx` — the shared scene (no renderer-specific branches required for basic parity)
- `src/components/WebGPUWarning.tsx`
- `src/shaders/lightShowNodes.ts` — currently mostly standard materials; TSL stubs exist
- `CLAUDE.md`, `AGENTS.md`, `README.md` — high-level mentions
- Leva controls inside MainScene and other components continue to work under either backend.

---

Last updated: 2026-07 (context/pipeline hygiene pass: shared `configureRendererDefaults`,
documented option matrix, capability diagnostics, screenshot mode).
Originally implemented 2026-06 (following following the established pattern from Watershed, power_gen, mod-player, Tetris_WebGPU, and pachinball).
