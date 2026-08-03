# Archived scene modules

Removed from `src/scenes/` during orphan-stack consolidation (issue #162, Aug 2026).
`MainScene.tsx` mounts **`Water.tsx`** as the sole water authority; these parallel
implementations were never wired into the live scene graph.

| File | ~LOC | Decision | Notes |
|------|------|----------|-------|
| `FFTOcean.tsx` | 331 | **Archive** | CPU Phillips-spectrum FFT ocean prototype. Future WebGPU compute path tracked in issue #165 — do not revive without explicit epic work. |
| `PBRWater.tsx` | 468 | **Archive** | Alternate PBR water shader stack superseded by `Water.tsx` (Gerstner + WaveSystem uniforms + quality tiers). |
| `InteractiveWater.tsx` | 595 | **Archive** | Interactive ripple/caustic experiment; no store integration. |
| `ExperimentalTech.tsx` | 644 | **Archive** | 3D visuals for `experimentalTechSystem`. The **system** still ticks via `mainSceneSystems.ts`; only the renderer was orphaned. Re-mount from here if booth-tier tech visuals ship. |
| `MonitorMinimalExample.tsx` | 236 | **Archive** | Demo wiring for `MonitorSystem`; canonical booth monitors live in `ControlBooth.tsx` + `controlBooth/`. |

To recover any file, browse git history or check out the commit before the consolidation PR.
