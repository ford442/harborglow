# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HarborGlow is a satisfying crane-operator + boat-light-upgrade game built with React, Three.js, and Tone.js. Players spawn different ship types, use a dock crane to install glowing light rigs, and trigger synchronized music + lyrics when ships are fully upgraded. The game features three core vessel types (Mega Cruise Liner, Container Vessel, Oil Tanker) plus expanded ship types (Bulk Carrier, LNG, RoRo, Research, Droneship), each with unique upgrade paths, music, and light shows.

## Tech Stack

- **Frontend**: React 18.2 + TypeScript 5.2
- **3D Graphics**: Three.js 0.160 + React Three Fiber 8.15 + WebGPU rendering
- **Physics**: Rapier 1.3 (@react-three/rapier)
- **State Management**: Zustand 4.4
- **Audio**: Tone.js 14.7 (music synthesis, sound effects)
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
npm lint
npm run lint

# Fix linting issues
npm run lint:fix

# Heartbeat check (git status + TODO/FIXME scan + build)
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
   - Handles Tone.js audio initialization on user gesture
   - Lazy-loads MainScene for code splitting

2. **Game State** (`src/store/useGameStore.ts`)
   - Single Zustand store for all game state
   - Manages ships, camera, UI modes, upgrades, weather, time/day cycles
   - Handles save/load via `src/utils/storage_manager.ts`
   - Tracks booth tiers (affects harbor theme), reputation, training progress
   - Stores attachment system config and multiview/dashboard presets

3. **3D Scene** (`src/scenes/MainScene.tsx`)
   - Composes all 3D elements: Dock, Water, Ships, Crane, Tugboat
   - Integrates multiple game systems via hooks
   - Manages camera transitions and spectator drone sequences
   - Renders ambient environment (weather, lighting, UI)

4. **Systems** (`src/systems/`)
   - Modular gameplay systems with no direct mutual dependencies
   - **Music/Audio**: `musicSystem.ts`, `craneSoundSystem.ts`, `ambientSoundSystem.ts`, `soundEffects.ts`
   - **Visual**: `lightingSystem.ts`, `weatherSystem.ts`, `moonSystem.ts`, `swaySystem.ts`
   - **Gameplay**: `attachmentSystem.ts`, `shipSpawner.ts`, `economySystem.ts`, `reputationSystem.ts`
   - **Events**: `eventSystem/`, `dynamicEventSystem.ts`, `wildlifeSystem.ts`, `seaEventsSystem.ts`
   - **Time & Environment**: `timeSystem.ts`, `StormSystem.ts`, `WaveSystem.ts`
   - **Camera/UI**: `cameraSystem.ts`, `audioVisualSync.ts`, `trainingSystem.ts`

5. **UI Components** (`src/components/`)
   - **HUD** (`HUD.tsx`, `hud/` subdirectory): Main overlay with ship status, camera controls, time display
   - **Menus**: MainMenu with sub-modals (Settings, HowToPlay, Credits)
   - **Game UI**: ShipSpawner, UpgradeMenu, LyricsDisplay, TrainingMode
   - **Feedback**: InstallationFeedback, VisualFeedback, DynamicEventNotifier, ReputationPanel
   - **Dashboard**: Crane dashboard with monitors, telemetry, multiple camera feeds
   - **Specialized**: OperatorCabin (immersive first-person cab), ErrorBoundary, LoadingScreen

6. **3D Components** (`src/scenes/`)
   - **Core**: Ship (with LOD impostors), Crane, Dock, Water, FoamSystem
   - **Visual Effects**: ParticleSystem, VolumetricLighting, PostProcessing, AudioReactiveLightShow
   - **Advanced**: MultiviewSystem, ControlBooth (multiple camera presets), WildlifeRenderer, SeaEvents
   - **Utilities**: AttachmentPoint, CraneCable, ProceduralShip

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

#### Music & Synchronization
- `musicSystem.ts` defines 8 unique Tone.js tracks (one per ship type)
- Each track has synths, effects, and synchronized lyrics stored as `LyricEntry[]` (time + text)
- `audioVisualSync.ts` syncs light pulses, camera movement to Tone.js Transport position
- Band names revealed during upgrade cinematic

#### Camera & Perspective
- Multiple camera modes: orbit, crane-cockpit (first-person in cab), crane-shoulder/top, ship views, spectator drone
- Multiview dashboard: 4-panel view with crane top-down, cable-tip follow, drone chase, underwater dock cameras
- Immersive Cab Mode toggles between default multiview and first-person inside control booth
- `useCinematicCamera` handles smooth transitions between modes

#### Time & Weather
- `timeSystem.ts`: 24-hour cycle with defined phases (dawn, day, dusk, night)
- `moonSystem.ts`: 29-day lunar cycle affecting ambient light and "energy" for tasks
- `weatherSystem.ts`: Probabilistic weather (clear, rain, fog, storm) with visual/audio effects
- `StormSystem.ts`: Advanced storm visualization with lightning, rain particles
- `WaveSystem.ts`: FFT-based ocean simulation with procedural wave heights

#### Economy & Progression
- `economySystem.ts`: Credit rewards for ship upgrades, challenges, events
- `trainingSystem.ts`: Tutorial progression with modules teaching core mechanics
- `reputationSystem.ts`: Standing affects economic multipliers, event triggers
- `trafficSystem.ts`: NPC cargo ships in harbor background (visual ambiance)
- `wildlifeSystem.ts`: Whales, dolphins, sharks with behavior patterns
- `harborEventSystem.ts`: Story events (whale migrations, ship fires, navy visits)

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

- **Chunking**: 3D libraries (three, fiber, drei, rapier, postprocessing) bundled separately; audio (tone) in vendor-audio chunk
- **LOD System**: `useLOD()` in `performanceSystem.tsx` reduces detail at distance
- **Lazy Loading**: MainScene code-split via dynamic import with webpack chunk name
- **Physics**: Rapier marked as lazy-load in Vite optimizeDeps (heavy binary)
- **Bundle Analysis**: `npm run build:analyze` to visualize chunk composition

## Key File Locations

### Configuration
- `tsconfig.json`: TypeScript compiler (ES2020 target, strict mode)
- `.eslintrc.json`: ESLint rules (relaxed: no-explicit-any, no-unused-vars off)
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
   - Create system in `src/systems/` if it's cross-component logic
   - Create component in `src/components/` if it's UI
   - If 3D, add to `src/scenes/`
   - Update Zustand store if new state needed
   - Import and integrate in relevant parent components

2. **Modify Ship Types**:
   - Update blueprint in `src/types/ShipBlueprint.ts` or `src/blueprints/`
   - Adjust attachment points (position, rotation relative to ship)
   - Update `musicSystem.ts` if new track needed
   - Register new ship type in `ShipType` enum in store

3. **Add Camera Mode**:
   - Define in `CameraMode` type in store
   - Implement camera logic in `cameraSystem.ts`
   - Add button/hotkey in `HUD.tsx`

4. **Debugging**:
   - Leva panel (bottom-right, press collapse to expand): real-time control over audio BPM, light intensity, weather, time
   - DevTools in MainScene: toggle between camera modes, debug attachment points
   - Console logs in systems will output during development

## Testing & Linting

- **No unit tests configured**: Manual testing via `npm run dev`
- **Linting**: `npm run lint` (ESLint with TypeScript/React plugins; relaxed rules)
- **Type Checking**: Part of build (`npm run build` runs `tsc` first)

## Browser & Compatibility

- **Target**: Chrome 113+, Edge 113+ (WebGPU support required)
- **Fallback**: Warning displayed if WebGPU not available (see `WebGPUWarning.tsx`)
- **Responsive**: Adaptive pixel ratio (dpr=[1, 2]) for mobile/retina

## Git & Commit Conventions

- No `.github/workflows/` (no CI/CD configured)
- Commits should reflect feature/fix scope
- Save data persists via `localStorage` (storage_manager.ts)

## Known Limitations & TODOs

- Ship models are procedural primitives (TODO: Replace with GLB models)
- No multiplayer (planned feature)
- No mobile touch controls (planned)
- Training system incomplete (Phase 9 work)
- Experimental tech system still evolving

## Useful References

- React Three Fiber Docs: https://docs.pmnd.rs/react-three-fiber
- Tone.js Docs: https://tonejs.github.io/
- Three.js Docs: https://threejs.org/docs/
- Rapier Physics Docs: https://rapier.rs/
- Zustand Docs: https://github.com/pmndrs/zustand

