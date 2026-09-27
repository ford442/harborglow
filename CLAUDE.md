# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HarborGlow is a satisfying crane-operator + boat-light-upgrade game built with React, Three.js, and an in-tree WASM AudioWorklet audio engine. Players spawn different ship types, use a dock crane to install glowing light rigs, and trigger synchronized music + lyrics when ships are fully upgraded. The game features three core vessel types (Mega Cruise Liner, Container Vessel, Oil Tanker) plus expanded ship types (Bulk Carrier, LNG, RoRo, Research, Droneship), each with unique upgrade paths, music, and light shows.

## Tech Stack

- **Frontend**: React 19.2 + TypeScript 5.2
- **3D Graphics**: Three.js 0.183.1 + React Three Fiber 9.7 + WebGPU rendering
- **Physics**: Rapier 1.3 (@react-three/rapier)
- **State Management**: Zustand 4.4
- **Audio**: in-tree WASM AudioWorklet engine (`cpp/harborglow_audio_engine.cpp` → `src/systems/audio/`: `AudioRuntime`, beat `transport`, `voices`) — no audio npm dependency; see [docs/systems/AUDIO.md](docs/systems/AUDIO.md)
- **UI Controls**: Leva (in-game debug panel), Tailwind CSS 3.4
- **Build Tool**: Vite 5.0 with React plugin
- **Bundling**: Terser minification with manual chunk splitting

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start dev server (Vite hot reload)
npm run dev
# Runs on http://localhost:5173

# Production build
npm run build
# Outputs to dist/ with TypeScript compilation + Vite build

# Build with bundle analysis
npm run build:analyze
# Opens interactive visualization of bundle composition

# Lint TypeScript/TSX files
npm run lint

# Unused files/exports/deps (config: knip.jsonc; unused files fail CI)
npm run knip

# Tests
npm test                 # Vitest unit tests
npm run test:e2e         # Playwright specs in e2e/

# Local mirror of the CI merge gates (all except gate-wasm)
npm run verify
npm run verify:fast      # lockfile + typecheck + lint only

# Fix linting issues
npm run lint:fix

# Heartbeat check (git status + TODO/FIXME scan + build + tests)
npm run heartbeat

# Preview production build locally
npm run preview
```

## Architecture Overview

### High-Level Structure

HarborGlow follows a modular architecture with clear separation of concerns:

1. **Entry Point** (`src/main.tsx` → `src/App.tsx`)
   - Bootstraps React and Three.js Canvas
   - Manages screen states: menu → loading → game/training
   - Resumes `audioRuntime` (AudioContext + WASM worklet) on user gesture
   - Lazy-loads MainScene for code splitting

2. **Game State** (`src/store/useGameStore.ts`) — see [docs/STORE.md](docs/STORE.md)
   - Single Zustand store for all game state, composed from domain slices
     (`slices/shipsSlice`, `craneSlice`, `cameraSlice`, `environmentSlice`,
     `economySlice`, `opsSlice`, `sessionSlice`); `gameStoreTypes.ts` is the one
     canonical type module and `sliceTypes.ts` enforces slice ownership at compile time
   - Manages ships, camera, UI modes, upgrades, weather, time/day cycles
   - Handles save/load via `src/utils/storage_manager.ts`; **one** subscription in
     `useGameStore.ts` owns `scheduleSave` — actions only call `set(...)`
   - Tracks booth tiers (affects harbor theme), reputation, training progress
   - Stores attachment system config and multiview/dashboard presets

3. **3D Scene** (`src/scenes/MainScene.tsx`)
   - Composes all 3D elements: Dock, Water, Ships, Crane, Tugboat, DistressedShip
   - Integrates multiple game systems via hooks
   - Manages camera transitions and spectator drone sequences
   - Renders ambient environment (weather, lighting, UI)
   - Spawns missions and controls operation mode transitions

4. **Systems** (`src/systems/`)
   - Modular gameplay systems with no direct mutual dependencies
   - **Music/Audio**: `music/` (`MusicSystem.ts`, `musicSynthChains.ts`, `lyrics.ts`), `craneSoundSystem.ts`, `ambientSoundSystem.ts`, `soundEffects.ts`
   - **Visual**: `lightingSystem.ts`, `weatherSystem.ts`, `moonSystem.ts`, `swaySystem.ts`
   - **Gameplay**: `attachmentSystem.ts`, `shipSpawner.ts`, `economySystem.ts`, `reputationSystem.ts`, `trafficSystem.ts`
   - **Operations**: `StormSystem.ts` (timed storm escalation with intensity), Tugboat mode (first-person vessel control with Rapier physics)
   - **Events**: `eventSystem/` (`HarborEventSystem.ts`), `dynamicEventSystem.ts` (both ticked from `bootstrap/mainSceneSystems.ts`), `wildlifeSystem.ts`, `seaEventsSystem.ts`, mission system (storm rescue)
   - **Time & Environment**: `timeSystem.ts`, `WaveSystem.ts` (FFT-based ocean), `weatherSystem.ts`
   - **Camera/UI**: `cameraSystem.ts`, `audioVisualSync.ts`, `trainingSystem.ts`

5. **UI Components** (`src/components/`)
   - **HUD** (`HUD.tsx`, `hud/` subdirectory): Main overlay with ship status, camera controls, time display
   - **Menus**: `MainMenu.tsx` with sub-modals in `MainMenu/` (`SettingsModal`, `HowToPlayModal`, `CreditsModal`, `ChangelogModal`, `TugboatWelcomeModal`)
   - **Game UI**: ShipSpawner, UpgradeMenu, LyricsDisplay, TrainingMode, `hud/MissionHUD` (mission objectives & timer)
   - **Feedback**: InstallationFeedback, VisualFeedback, DynamicEventNotifier, ReputationPanel
   - **Dashboard**: `CraneDashboard` with monitors and telemetry; multi-camera feeds render on booth monitors in `ControlBooth`
   - **Specialized**: OperatorCabin (immersive first-person cab), ErrorBoundary, LoadingScreen, `TugboatConsole` + `hud/TugboatHUD`

6. **3D Components** (`src/scenes/`)
   - **Core**: Ship (with LOD impostors), Crane, Dock, Water, FoamSystem, Tugboat (vessel with buoyancy physics)
   - **Vessels**: Tugboat, TugboatTargetShip, DistressedShip (storm rescue mission)
   - **Visual Effects**: `components/ParticleBurst3D`, VolumetricLighting, PostProcessing, AudioReactiveLightShow
   - **Advanced**: ControlBooth (multiple camera presets + booth monitors), Wildlife, SeaEvents
   - **Utilities**: AttachmentPoint, CraneCable, ProceduralShip (the tugboat radar sweep lives inside `Tugboat.tsx`)

### Key Concepts

#### Ship System
- Ships spawned via `ShipSpawner` with unique names and blueprints
- Eight ship types with different silhouettes, attachment points, music, and light colors
- Each ship stores attachment points (relative to ship origin) for crane upgrade installation
- Ships support LOD (Level of Detail) rendering: high-fidelity nearby, impostor boxes at distance
- Ships can sail away (despawn) on schedule or remain docked

#### Attachment & Upgrade System
- `AttachmentSystem` manages snapping, installing, and light rig visual states
- Ships define attachment points (blueprint-driven in `src/types/ShipBlueprint.ts`)
- Crane can snap to attachment points when close enough
- Installation triggers music/lyrics playback when all upgrades complete
- Installed upgrades render as glowing light rigs synchronized to music beat
- Economically incentivized: upgrades grant credits toward harbor progression

#### Tugboat Mode (Operation Mode)
- Alternative to crane operation: first-person helm control of a vessel
- **Physics**: Rapier-based buoyancy simulation with realistic wave response (uses `WaveSystem`)
- **Input**: Mouse look (camera), WASD for throttle/steering, with smooth acceleration
- **Objectives**: Navigate to marked berths (floating target zones) and dock ships
- **Progression**: Tugboat objectives count toward booth tier advancement
- **Integration**: Shares store with crane mode (`operationMode: 'crane' | 'tugboat'`)

#### Mission System & Storm Rescue
- **Storm Rescue**: Time-limited mission where player must rescue a distressed ship during escalating storms
- **Storm Intensity**: `StormSystem.ts` simulates 0..1 intensity with wind forces, lightning, rain, visibility reduction
- **Failure Conditions**: Timeout, excessive ship damage, or entering unsafe zone
- **Reward**: Credits and reputation bonus on successful rescue
- **UI**: `components/hud/MissionHUD.tsx` displays objective, time remaining, damage level

#### Music & Synchronization
- `music/MusicSystem.ts` plays per-ship instruments + bus effects (`music/musicSynthChains.ts`) on the shared beat `transport`, clocked by sim time
- Lyrics are `LyricEntry[]` (`'bars:beats'` + text) keyed to transport beats, not wall clock
- `audioVisualSync.ts` syncs light pulses to engine analysis + transport beat phase; `sequencerSystem` schedules cinematic cues by beat
- Band names revealed during upgrade cinematic

#### Operation Modes
- **Crane Mode** (default): Operate dock crane to install light rigs on ships
  - Camera: Orbit, crane-cockpit (first-person in cab), crane-shoulder/top, ship views, spectator drone
  - Booth monitors in `ControlBooth` show extra camera feeds (the old 4-panel `MultiviewSystem` is archived in `scripts/archive/scenes/`)
- **Tugboat Mode**: First-person helm control of vessel with buoyancy physics
  - Camera: First-person from helm; mouse look + WASD throttle/steering
  - Radar sweep line in `Tugboat.tsx`; helm HUD in `components/hud/TugboatHUD.tsx`
  - Objectives: Navigate and dock at marked berths
- **Mission Mode**: Temporary mode overlay during storm rescue missions
  - Switches to tugboat control to rescue distressed ships
  - Storm intensity increases over time with escalating hazards
  - Success = return ship safely to berth before time runs out

#### Time & Weather
- `timeSystem.ts`: 24-hour cycle with defined phases (dawn, day, dusk, night)
- `moonSystem.ts`: 29-day lunar cycle affecting ambient light and "energy" for tasks
- `weatherSystem.ts`: Probabilistic weather (clear, rain, fog, storm) with visual/audio effects
- `StormSystem.ts`: Mission-driven storm system with:
  - Timed escalation (intensity 0 → 1 over mission duration)
  - Wind forces affecting tugboat steering and ship dynamics
  - Lightning strikes with thunder audio effects
  - Rain density and visibility reduction
- `WaveSystem.ts`: FFT-based ocean simulation with procedural wave heights, used by Rapier buoyancy

#### Economy & Progression
- `economySystem.ts`: Credit rewards for upgrades, missions, challenges
  - **Hooks**: Triggered on upgrade completion, mission success, special events
  - **Scaling**: Multipliers based on reputation and booth tier
  - **Booth Tiers**: 1 (industrial) → 2 (tropical) → 3 (arctic), unlocks new features
- `trainingSystem.ts`: Tutorial progression with modules teaching core mechanics (crane, tugboat, missions)
- `reputationSystem.ts`: Standing affects economic multipliers, event trigger rates
- `trafficSystem.ts`: NPC cargo ships in harbor background (visual ambiance)
- `wildlifeSystem.ts`: Whales, dolphins, sharks with behavior patterns
- `eventSystem/HarborEventSystem.ts`: Story events (whale migrations, ship fires, navy visits, distress calls)

#### Tech System (Phase 9+)
- `techSystem.ts`: Experimental upgrades unlocked via booth tier progression
- Booth tiers (1-3) map to harbor themes: industrial → tropical → arctic
- Unlock advanced features like holographic UI, enhanced weather, new ship types

### Data Flow Patterns

1. **User Input** → Crane/Ship interaction → `useGameStore` update → Zustand notify subscribers
2. **Store Update** → Systems hook into store (via `useFrame` + selectors) → Visual/Audio output
3. **Event Triggers** → Dynamic systems (events, wildlife, weather) call store methods to spawn entities
4. **Cleanup** → Components unsubscribe on unmount; Zustand handles state disposal

### Performance Considerations

- **Chunking**: 3D libraries (three, fiber, drei, rapier, postprocessing) bundled separately; audio is in-tree (WASM in `public/wasm/`, no vendor chunk)
- **LOD System**: `useLOD()` in `performanceSystem.tsx` reduces detail at distance
- **Lazy Loading**: MainScene code-split via dynamic import with webpack chunk name
- **Physics**: Rapier marked as lazy-load in Vite optimizeDeps (heavy binary)
- **Bundle Analysis**: `npm run build:analyze` to visualize chunk composition

## Key File Locations

### Configuration
- `tsconfig.json`: TypeScript compiler (ES2020 target, strict mode)
- `eslint.config.js`: ESLint 9 flat config (relaxed: no-explicit-any, no-unused-vars off; `@ts-ignore`/`@ts-nocheck` banned)
- `knip.jsonc`: unused files/exports/deps config (`scripts/archive/` and `workers/` ignored)
- `tailwind.config.js`: Tailwind + custom cyber colors
- `vite.config.ts`: Build optimization, manual chunks, terser options
- `postcss.config.js`: Tailwind + autoprefixer

### Type Definitions
- `src/types/ShipBlueprint.ts`: Ship blueprint schema (parts, attachment points)
- `src/types/CameraPreset.ts`: Camera mode enums and dashboard viewport types
- Game types in `src/store/useGameStore.ts`: ShipType, WeatherState, CameraMode, GameMode

### Ship Blueprints
- `src/blueprints/`: JSON or TS definitions for each ship type (geometry, parts, attachment points)

### Shaders
- `src/shaders/lightShowNodes.ts`: Node-based material definitions for light shows

## Common Patterns & Conventions

1. **Component Naming**: Capitalized React components (e.g., `ShipComponent`, `HUD`); systems as lowercase functions/classes
2. **Zustand Selectors**: Use `useGameStore(s => s.fieldName)` to subscribe to specific slices
3. **useFrame Hook**: Called every frame in 3D components; use for animation, state sync
4. **Type Exports**: Game types from `store/useGameStore.ts`; 3D from Three.js/Fiber types
5. **System Initialization**: Many systems (music, ambients, events) defer initialization until first use to avoid blocking
6. **Event Names**: PascalCase for event types (e.g., `whale_migration`, `ship_fire`)
7. **Coordinate System**: X = left/right, Y = up/down, Z = forward/back (standard Three.js)

## Development Workflow

1. **Add a Feature**:
   - Create system in `src/systems/` if it's cross-component logic (music, weather, physics)
   - Create component in `src/components/` if it's UI (HUD, menus, panels)
   - If 3D, add to `src/scenes/` (ships, effects, objects)
   - Update Zustand store in `useGameStore.ts` if new state needed
   - Import and integrate in relevant parent components
   - Use Leva controls for tuning (wrapped in `useControls`)

2. **Add a Mission Type**:
   - Define mission interface in `useGameStore.ts`
   - Create scene component (e.g., `DistressedShip.tsx`)
   - Spawn from `MainScene.tsx` with mission creation logic
   - Add mission state management (objective tracking, timers, failure conditions)
   - Update `components/hud/MissionHUD.tsx` to display mission-specific UI

3. **Modify Operation Modes**:
   - Define new `OperationMode` in store type
   - Implement mode-specific logic in `MainScene.tsx` (conditional rendering)
   - Add UI/camera transitions in `cameraSystem.ts` if needed
   - Create scene component for new operation (e.g., `Tugboat.tsx`)

4. **Modify Ship Types**:
   - Update blueprint in `src/types/ShipBlueprint.ts` or `src/blueprints/`
   - Adjust attachment points (position, rotation relative to ship)
   - Add the track in `src/systems/music/` (`musicTracks.ts`, `lyrics.ts`) if a new song is needed
   - Register new ship type in `ShipType` enum in store

5. **Debugging**:
   - Leva panel (bottom-right, press collapse to expand): real-time control over audio BPM, light intensity, weather, time, storm intensity
   - `console.log` in systems: tagged with emoji for easy scanning (⛈️ storm, 🎵 music, 📊 economy)
   - Use `npm run build:analyze` to visualize bundle composition
   - Monitor performance with browser DevTools (check FPS, memory)

## Testing & Linting

- **Unit tests**: Vitest (`npm test`), files are `*.test.ts(x)`, mostly under `__tests__/` next to the code
- **E2E**: Playwright specs in `e2e/` (`npm run test:e2e`)
- **Linting**: `npm run lint` (ESLint with TypeScript/React plugins; relaxed rules) + `npm run knip` (unused files fail CI)
- **Type Checking**: `npm run typecheck` / `npm run typecheck:tests`; also part of `npm run build`
- **Before pushing**: `npm run verify` mirrors the CI merge gates; see [AGENTS.md → CI merge gates](AGENTS.md#ci-merge-gates)
- **Simulation code**: follow [docs/systems/DETERMINISM.md](docs/systems/DETERMINISM.md) (sim time, seeded RNG, no wall clock in sim paths)

## Browser & Compatibility

- **Target**: Chrome 113+, Edge 113+ (WebGPU support required)
- **Fallback**: Probe fail → blocking overlay (`WebGPUFatalOverlay.tsx`); no WebGL scene this phase.
- **Responsive**: Adaptive pixel ratio (dpr=[1, 2]) for mobile/retina

## Git & Commit Conventions

- CI: `.github/workflows/ci.yml` runs parallel `gate-*` jobs aggregated by `merge-gate` (the one required check); see [AGENTS.md](AGENTS.md#ci-merge-gates)
- Commits should reflect feature/fix scope
- Save data persists via `localStorage` (storage_manager.ts)

## Known Limitations & TODOs

- Ship models: GLBs in `public/models/` registered in `src/ships/shipModelRegistry.ts`, with procedural fallback (`ProceduralShip.tsx`); icebreaker has no GLB yet
- Tugboat physics: buoyancy tuning ongoing, may need refinement for different wave heights
- Mission system: storm rescue is first mission type; additional mission types can be added
- Training system: core modules in place, expansion planned
- Tech system: booth tier progression connected, additional tier 2/3 features planned
- No multiplayer (planned feature)
- No mobile touch controls (planned)

## Quick Reference: Common Tasks

### Testing a New Feature
```bash
npm run dev                    # Start dev server with hot reload
# In browser: adjust Leva controls in real-time to test parameters
npm run build:analyze          # Check bundle impact before shipping
```

### Debugging Physics (Tugboat Mode)
- Leva → "Tugboat Physics" → adjust mass, damping, buoyancy, restoringTorque
- Check `StormSystem` state in Leva → "Storm" for wind/wave values
- Use console logs tagged with emoji (⚓ tugboat, 🌊 wave, ⛈️ storm)

### Adding a New Event Type
1. Add event type to `HarborEventType` in store
2. Implement logic in `HarborEventSystem.ts` or `eventSystem/` subdirectory
3. Trigger via store method (e.g., `spawnEvent()`)
4. Add UI notification in `components/DynamicEventNotifier.tsx`

### Tweaking Storm Intensity Curve
- Edit `StormSystem.ts` → `update()` method
- Adjust intensity interpolation, wind speed scaling, rain density progression
- Test with Leva panel → "Storm" controls

## Useful References

- React Three Fiber Docs: https://docs.pmnd.rs/react-three-fiber
- Three.js Docs: https://threejs.org/docs/
- Rapier Physics Docs: https://rapier.rs/
- Zustand Docs: https://github.com/pmndrs/zustand
- Leva UI: https://github.com/pmndrs/leva

