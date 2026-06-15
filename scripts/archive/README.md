# Archived one-shot codemod scripts

These six scripts (`fix_components.cjs`, `fix_deps.cjs`, `fix_hologram.cjs`,
`fix_let_const.cjs`, `fix_lightshow.cjs`, `fix_lint.cjs`) were one-shot codemods
run against the codebase during early refactoring (PR #8 and earlier, 2026-04-19).

They are **not** part of the build, not referenced by `package.json` scripts, and
not invoked by any CI workflow. They are preserved here as a historical record of
the automated transforms that shaped the initial codebase.
# Archived one-shot codemods

These Node scripts were used during the Apr 2026 refactor (commit `3674266c`, PR #26 area) to apply bulk fixes. The changes they made are already merged; do not re-run unless you are reverting and re-applying that refactor.

| Script | Purpose |
|--------|---------|
| `fix_components.cjs` | Replaced mock TODO comments in `AttachmentSystemManager.tsx`. |
| `fix_deps.cjs` | Patched React hook dependency arrays in LoadingScreen, ShipStatusPanel, ProceduralShip, Ship, UnderwaterCamera. |
| `fix_hologram.cjs` | Fixed Rules-of-Hooks violations in HolographicUI; added switch-case blocks in SeaBirds, cameraSystem, soundEffects. |
| `fix_let_const.cjs` | Converted mutable `let` to `const` in UpgradeCelebration, ambientSoundSystem, craneSoundSystem, dynamicEventSystem, timeSystem. |
| `fix_lightshow.cjs` | Patched useEffect dependency arrays in LightShow.tsx. |
| `fix_lint.cjs` | Removed `--max-warnings=0` from the lint script in package.json (one-time unblock). |
