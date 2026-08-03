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

### Still in `src/scenes/` but unreferenced (audit list)

These scene entry points are **not** imported by `MainScene` or any other live module as of Aug 2026. They remain in-tree for now; consider archiving in a follow-up:

| File | ~LOC | Status |
|------|------|--------|
| `LightShow.tsx` | ~120 | Superseded by `AudioReactiveLightShow.tsx` + `scenes/lightRigs/` |
| `UpgradeCelebration.tsx` | ~770 | Superseded by `cinematicSystem` + `AudioReactiveLightShow` |
| `ParticleSystem.tsx` | ~450 | Generic particle demo; live bursts use `components/ParticleBurst3D.tsx` |
| `MonitorSystem.tsx` | ~120 | Booth monitors use `controlBooth/ControlBoothMonitors.tsx` |
