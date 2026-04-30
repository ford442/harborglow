# HarborGlow Copilot Instructions

## Build, lint, and test commands

```bash
npm install
npm run dev          # Vite dev server on 0.0.0.0:5173
npm run lint         # ESLint over src/**/*.ts(x)
npm run lint:fix
npm run build        # tsc && vite build
npm run build:analyze
npm run heartbeat    # git status + TODO/FIXME grep + production build
npm run preview
```

There is currently **no automated test suite** in this repository: no test runner is configured in `package.json`, and there are no `*.test.*` or `*.spec.*` files. There is therefore no single-test command today; `npm run heartbeat` is the closest smoke-test command.

For Copilot cloud-agent browser automation, this repo also includes `.github/workflows/copilot-setup-steps.yml` plus `.github/playwright-mcp.json` so repository admins can enable Playwright MCP with a matching environment bootstrap.

## High-level architecture

- `src/App.tsx` owns the top-level screen flow (`menu` -> `loading` -> `game` / `training`), starts Tone on first user gesture, lazy-loads `MainScene`, and mounts it inside `@react-three/fiber` `Canvas` + `@react-three/rapier` `Physics`. `HUD` and `TrainingHUD` stay outside the canvas as DOM overlays.
- `src/scenes/MainScene.tsx` is the runtime orchestrator. It reads and writes the Zustand store, wires camera/audio hooks, advances the singleton systems every frame (`timeSystem`, `trafficSystem`, `lightingSystem`, `weatherSystem`, `swaySystem`, `wildlifeSystem`, `seaEventsSystem`, `harborEventSystem`, `dynamicEventSystem`, `experimentalTechSystem`, `waveSystem`), composes the 3D harbor scene, manages spectator-camera behavior, and handles the living fleet departure/return loop.
- `src/store/useGameStore.ts` is the monolithic source of truth. It holds ships, upgrades, crane kinematics, camera/view state, weather, wildlife, training progress, tugboat mode, economy, missions, and more. Persistence is custom rather than Zustand middleware: `getSerializableState()` builds the saved slice, `scheduleSave()` debounces writes, `storage_manager.ts` handles localStorage, and a store-wide `subscribe()` saves on every state change.
- Ships are blueprint-driven. `src/types/ShipBlueprint.ts` loads `src/blueprints/ships.json`; `src/systems/shipSpawner.ts` converts blueprint attachment point IDs into runtime `Ship` objects; `src/scenes/ProceduralShip.tsx` renders blueprint geometry; `src/scenes/Ship.tsx` adds LOD, bobbing, wave-following, and attachment-point visuals.
- Upgrade installation has **two entry points** that converge on the same store state. The crane path is `src/systems/attachmentSystem.ts` plus `src/components/AttachmentSystemManager.tsx`, which finds snap/bind candidates from spreader position + twistlock state and then calls `installUpgrade()`. The menu path is `src/components/UpgradeMenu.tsx`, which can still trigger installs directly. Completion behavior (band reveal, music start, spectator camera, light show) is coupled to upgrade completion, so changes in this area must keep both install paths consistent.
- Audio/visual show logic is singleton-based. `src/systems/musicSystem.ts` owns per-ship band metadata, lyrics, synth/effect chains, and Tone transports; related systems such as `lightingSystem` and `audioVisualSync` react to the same gameplay milestones.
- The operator cabin is mostly a DOM overlay, not a second in-world 3D scene system. `src/components/OperatorCabin.tsx` renders the multiview monitors with canvas-based simulated feeds, while actual camera/game state still lives in the store and scene systems.

## Key conventions

- Keep cross-file registries in sync when adding or changing a ship type. The minimum sync points are `useGameStore.ts` (`ShipType` and upgrade totals/selectors), `blueprints/ships.json`, `types/ShipBlueprint.ts`, `systems/shipSpawner.ts` (names, lengths, info), `systems/musicSystem.ts` (band names, lyrics, synth init), and any UI config keyed by ship type.
- Persistence changes require updates in more than one place: if new state should survive reloads, update both `src/utils/storage_manager.ts` and the serializable slice in `src/store/useGameStore.ts`.
- Prefer the existing singleton systems plus exported hooks over introducing another state container. This repo centralizes runtime behavior in module-level system instances and the monolithic Zustand store.
- Derived store reads are commonly exported as plain selector functions such as `selectCurrentShip`, `selectShipUpgrades`, `selectUpgradeProgress`, and `selectIsShipFullyUpgraded`, not as separate custom hooks.
- UI styling is heavily inline. Reuse `src/components/DesignSystem.ts` where possible, and follow the existing `*Style` naming for `React.CSSProperties` objects instead of introducing a different styling pattern for small additions.
- Most components follow one default export per file, with props/types near the top and large banner/section comments matching the existing `// =============================================================================` and `// -------------------------------------------------------------------------` style.
- TypeScript is `strict`, but the repo intentionally allows `any` and unused vars in ESLint. Match the surrounding codebase style instead of “fixing” that policy opportunistically.
- `public/models/` is effectively empty today; the active ship rendering path is procedural/blueprint-based, and `Ship.tsx` falls back to an impostor LOD for distant vessels. New ship work should preserve that path unless model loading is being intentionally expanded across the app.
