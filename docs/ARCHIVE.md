# Archived / removed reference code

## ControlBooth forks (`src/_legacy/`)

Removed during repo hygiene (Jun 2026). Five experimental ControlBooth variants were archived in PR #30 (commit `204f1644`) when `src/scenes/ControlBooth.tsx` became the canonical implementation.

| Former file | Notes |
|-------------|-------|
| `ControlBoothExample.tsx` | Demo wiring |
| `ControlBoothIntegration.tsx` | Integration prototype |
| `ControlBoothOptimized.tsx` | Performance experiment |
| `ControlBoothSwappable.tsx` | Swappable theme variant |
| `ControlBoothWithMonitorSystem.tsx` | Monitor-system variant |

To recover any of these files, check out commit `204f1644^` or browse git history for `src/_legacy/`. Active booth code lives in `src/scenes/ControlBooth.tsx` and `src/scenes/controlBooth/`.

## Orphan water / scene stacks (`scripts/archive/scenes/`)

Archived Aug 2026 (issue #162). `MainScene` mounts only `Water.tsx` for ocean rendering.
Parallel water stacks (`FFTOcean`, `PBRWater`, `InteractiveWater`), the unused
`ExperimentalTech` renderer, and `MonitorMinimalExample` were moved out of
`src/scenes/` to stop agents from enhancing dead code paths.

See `scripts/archive/scenes/README.md` for the per-file decision table and recovery notes.

### Removed orphan scene entry points (Aug 2026)

Deleted in the vendor-3d chunk-split work — unreferenced by `MainScene` or any live module:

| Former file | Notes |
|-------------|-------|
| `LightShow.tsx` | Superseded by `AudioReactiveLightShow.tsx` |
| `UpgradeCelebration.tsx` | Superseded by `cinematicSystem` |
| `ParticleSystem.tsx` | Live bursts use `components/ParticleBurst3D.tsx` |
| `MonitorSystem.tsx` | Booth monitors use `controlBooth/ControlBoothMonitors.tsx` |

Recover from git history before the deletion commit if needed.
