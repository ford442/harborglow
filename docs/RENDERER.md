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
- `createRenderer.ts` — async factory:
  - `webgl` → `new THREE.WebGLRenderer(...)`
  - `webgpu` → `import('three/webgpu').then(...)`; `new WebGPURenderer(...)`; `await renderer.init()`
- `WireframeDebug.tsx` — scene traversal + material snapshot/restore
- `RendererDiagnosticsMonitor.tsx` — lives inside Canvas, calls `useThree().gl`, updates diagnostics + exposure
- `index.ts` — clean re-exports

`WebGPUWarning.tsx` (in `components/`) was upgraded to also act as a live renderer status banner by subscribing to the diagnostics store.

## Visual Parity Expectations

- **Ships, crane, attachment points, light rigs, particles, AudioReactiveLightShow, spectator drone, water, weather, time-of-day lighting, moon, wildlife, etc.** — should look extremely close. Differences will mainly be:
  - Subtle variations in post-processing / tone mapping / shadow maps between native WebGPU and the WebGL2 path inside WebGPURenderer or pure WebGLRenderer.
  - TSL node materials (if/when activated in `shaders/lightShowNodes.ts`) will only be fully active on a real WebGPU device.
  - Some very new WebGPU-only extensions or high-precision storage textures are not expected in the fallback.
- The **gameplay loop, upgrade installation, music/lyrics sync, physics (Rapier), economy, missions** are 100% identical.

When porting a graphics feature:
1. Implement / tune first under `?renderer=webgl` (easy to step through GLSL, inspect in Spector.js / WebGL Inspector, take deterministic screenshots).
2. Verify parity under `?renderer=webgpu`.
3. Only then enable advanced TSL / compute paths guarded by capability checks.

## CI / Agent / Playwright Usage

- Force the debug renderer for visual tests or traces: `?renderer=webgl`
- Read current backend from:
  - `window.currentRenderer`
  - `window.harborglowRenderer`
  - `<canvas>.dataset.renderer` and `.dataset.activeBackend`
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

Last updated: 2026-06 (implemented following the established pattern from Watershed, power_gen, mod-player, Tetris_WebGPU, and pachinball).
