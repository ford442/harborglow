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

To recover any of these files, check out commit `204f1644^` or browse git history for `src/_legacy/`. Active booth code lives in `src/scenes/ControlBooth.tsx`, `MonitorSystem.tsx`, and `MonitorMinimalExample.tsx`.
