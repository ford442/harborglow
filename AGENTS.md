# HarborGlow - Agent Documentation

## Project Overview

HarborGlow is a 3D browser-based crane-operator simulation built with React, Three.js, and TypeScript. Players spawn ships into a living harbor, operate a physics-based gantry crane to install light upgrades at attachment points, and trigger synchronized procedural music with lyrics when a vessel is fully upgraded. The project has evolved from a simple three-ship prototype into a feature-rich harbor simulation with eight vessel types, training modules, economy and reputation systems, dynamic weather and wildlife, sea events, multiview camera dashboards, tiered control booth themes, and a day/night cycle.

### Core Gameplay Loop
1. Spawn a ship from the harbor menu.
2. Use the crane to position the spreader near attachment points.
3. Install light rigs on each attachment point.
4. When all upgrades are installed, a band-reveal cinematic plays, music starts, and the spectator drone orbits the ship.

### Living Fleet
Ships automatically depart after 45–90 seconds, sail away (hidden), and return to dock after ~10 seconds. The fleet cycles continuously in sandbox mode.

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | ^18.2.0 |
| Language | TypeScript | ^5.2.2 |
| Build Tool | Vite | ^5.0.8 |
| 3D Rendering | @react-three/fiber | ^8.15.11 |
| 3D Helpers | @react-three/drei | ^9.122.0 |
| 3D Physics | @react-three/rapier | ^1.3.1 |
| 3D Post-Processing | @react-three/postprocessing | ^2.15.1 |
| 3D Core | three | ^0.160.0 |
| 3D Stdlib | three-stdlib | ^2.36.1 |
| Audio | tone | ^14.7.77 |
| State Management | zustand | ^4.4.7 |
| Debug UI | leva | ^0.9.35 |
| Styling | Tailwind CSS | ^3.4.19 |
| CSS Processing | PostCSS + Autoprefixer | ^8.5.6 / ^10.4.27 |
| Linting | ESLint + @typescript-eslint | ^8.55.0 / ^6.14.0 |
| Bundle Analysis | rollup-plugin-visualizer | ^5.12.0 |
| Minification | terser | ^5.46.1 |

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (host: 0.0.0.0, port: 5173)
npm run dev

# Type-check and build for production (outputs to dist/)
npm run build

# Build and open bundle visualizer
npm run build:analyze

# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Smoke test: check git status, grep TODO/FIXME, then run build
npm run heartbeat

# Preview production build locally
npm run preview
```

### Build Output Details
- Production build is output to `dist/`.
- Vite handles TypeScript compilation and bundling.
- Static assets from `public/` are copied to `dist/`.
- `base: './'` in `vite.config.ts` enables relative-path deployment.
- Manual chunk splitting creates:
  - `vendor-3d` — three, R3F, drei, rapier, postprocessing (~3.2 MB raw / ~1.1 MB gzip)
  - `vendor-audio` — tone (~288 KB raw / ~69 KB gzip)
  - `MainScene` — lazy-loaded scene chunk (~188 KB raw / ~49 KB gzip)
- React, React-DOM, Leva, and Zustand are intentionally kept in the main bundle to avoid `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` errors.
- Terser drops `console.log` and `debugger` in production (`passes: 2`).
- Sourcemaps are generated only in development mode.

### Recent Bundle Metrics (April 2026)
| Chunk | Raw | gzip |
|-------|-----|------|
| vendor-3d | 3,227 kB | 1,096 kB |
| index (React + Leva + Zustand + app) | 472 kB | 136 kB |
| vendor-audio | 288 kB | 69 kB |
| MainScene (lazy) | 188 kB | 49 kB |
| PostProcessing chunks (7 files) | 17 kB | 5 kB |
| index.css | 34 kB | 8 kB |
| **Total** | **~4.2 MB** | **~1.36 MB** |

## Project Structure

```
src/
├── components/              # React UI components
│   ├── MainMenu/            # Menu modals, buttons, styles, types
│   │   ├── CreditsModal.tsx
│   │   ├── HowToPlayModal.tsx
│   │   ├── MenuButton.tsx
│   │   ├── Modal.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── index.ts
│   │   ├── modalStyles.ts
│   │   └── styles.ts
│   │   └── types.ts
│   ├── controls/            # JoystickControl, useCranePhysics
│   ├── dashboard/           # Monitor feeds and telemetry
│   │   ├── Arctic360Cam.tsx
│   │   ├── DownwardSpreaderCam.tsx
│   │   ├── HeatedWindow.tsx
│   │   ├── MonitorFeed.tsx
│   │   ├── SystemStatusMonitor.tsx
│   │   ├── TelemetryGraph.tsx
│   │   ├── ThermalCam.tsx
│   │   ├── TwistlockCam.tsx
│   │   ├── WeatherMonitor.tsx
│   │   └── WinchCam.tsx
│   ├── hud/                 # TopBar, TimeDisplay, ShipStatusPanel, CameraMultiviewControls
│   │   ├── CameraMultiviewControls.tsx
│   │   ├── CraneControlIndicators.tsx
│   │   ├── HotkeyHints.tsx
│   │   ├── ShipStatusPanel.tsx
│   │   ├── TimeDisplay.tsx
│   │   ├── TopBar.tsx
│   │   ├── index.ts
│   │   └── styles.ts
│   ├── upgrade/             # Upgrade configuration
│   │   └── upgradeConfigs.ts
│   ├── AttachmentSystemManager.tsx
│   ├── CraneControls.tsx
│   ├── CraneDashboard.tsx
│   ├── CreditFeedback.tsx
│   ├── DesignSystem.ts      # Shared glassmorphism / cyber styles
│   ├── DynamicEventNotifier.tsx
│   ├── ErrorBoundary.tsx
│   ├── HUD.tsx              # Main HUD container
│   ├── InstallationFeedback.tsx
│   ├── InteractiveFeedback.tsx
│   ├── LoadingScreen.tsx
│   ├── LyricsDisplay.tsx
│   ├── LyricsOverlay.tsx
│   ├── MainMenu.tsx
│   ├── OperatorCabin.tsx
│   ├── ParticleBurst3D.tsx
│   ├── ReputationPanel.tsx
│   ├── ShipSpawner.tsx
│   ├── ShipVersionDisplay.tsx
│   ├── TrainingHUD.tsx
│   ├── TrainingMode.tsx
│   ├── UpgradeMenu.tsx
│   ├── VisualFeedback.tsx
│   └── WebGPUWarning.tsx
├── scenes/                  # R3F 3D scene components
│   ├── AttachmentPoint.tsx
│   ├── AudioReactiveLightShow.tsx
│   ├── ControlBooth.tsx
│   ├── ControlBoothExample.tsx
│   ├── ControlBoothIntegration.tsx
│   ├── ControlBoothOptimized.tsx
│   ├── ControlBoothSwappable.tsx
│   ├── ControlBoothWithMonitorSystem.tsx
│   ├── Crane.tsx
│   ├── CraneCable.tsx
│   ├── DistantShipQueue.tsx
│   ├── Dock.tsx
│   ├── EnhancedWeather.tsx
│   ├── ExperimentalTech.tsx
│   ├── FFTOcean.tsx
│   ├── GlobalIllumination.tsx
│   ├── HolographicUI.tsx
│   ├── InteractiveWater.tsx
│   ├── LightShow.tsx
│   ├── MainScene.tsx        # Scene composition, lazy-loaded
│   ├── MonitorMinimalExample.tsx
│   ├── MonitorSystem.tsx
│   ├── MultiviewSystem.tsx
│   ├── OnDockRail.tsx
│   ├── PBRWater.tsx
│   ├── ParticleSystem.tsx
│   ├── PostProcessing.tsx
│   ├── ProceduralShip.tsx   # Blueprint-driven procedural ships
│   ├── SeaBirds.tsx
│   ├── SeaEvents.tsx
│   ├── Ship.tsx             # Ship rendering (procedural + fallback)
│   ├── ShipMaterials.tsx
│   ├── UnderwaterCamera.tsx
│   ├── UpgradeCelebration.tsx
│   ├── VolumetricLighting.tsx
│   ├── Water.tsx
│   └── Wildlife.tsx
├── store/                   # State management
│   ├── useGameStore.ts      # Monolithic Zustand store (~891 lines)
│   └── harborThemes.ts      # Theme definitions
├── systems/                 # Game logic singletons
│   ├── ambientSoundSystem.ts
│   ├── attachmentSystem.ts  # Crane-to-ship attachment logic
│   ├── audioVisualSync.ts
│   ├── cameraSystem.ts
│   ├── craneSoundSystem.ts
│   ├── dynamicEventSystem.ts
│   ├── economySystem.ts     # Harbor Credits / shop logic
│   ├── eventSystem/         # Event helpers and configs
│   │   ├── HarborEventSystem.ts
│   │   ├── eventConfigs.ts
│   │   ├── index.ts
│   │   ├── speciesData.ts
│   │   └── types.ts
│   ├── lightingSystem.ts    # Beat-synced lighting
│   ├── moonSystem.ts
│   ├── musicSystem.ts       # Tone.js music + lyrics sync
│   ├── performanceSystem.tsx
│   ├── physicsSystem.ts
│   ├── reputationSystem.ts
│   ├── seaEventsSystem.ts
│   ├── sequencerSystem.ts
│   ├── shipSpawner.ts       # Ship factory with attachment points
│   ├── soundEffects.ts
│   ├── swaySystem.ts        # Ship sway physics
│   ├── techSystem.ts
│   ├── timeSystem.ts
│   ├── trafficSystem.ts
│   ├── trainingSystem.ts    # Training module definitions
│   ├── weatherSystem.ts     # Weather state machine
│   └── wildlifeSystem.ts
├── shaders/                 # Custom shaders
│   └── lightShowNodes.ts    # God-ray shader + TSL fallback
├── types/                   # Type definitions
│   ├── CameraPreset.ts      # Dashboard camera presets
│   └── ShipBlueprint.ts     # Blueprint registry loader (ships.json)
├── utils/                   # Utilities
│   └── storage_manager.ts   # localStorage persistence wrapper
├── hooks/                   # Custom React hooks
│   └── useScreenShake.ts
├── blueprints/              # Procedural definitions
│   └── ships.json           # Ship geometry blueprints
├── App.tsx                  # Root app component
├── App.css
├── main.tsx                 # Entry point
└── index.css                # Global styles + crane dashboard CSS

public/
├── models/                  # GLB model files (currently empty)
│   └── .gitkeep
└── vite.svg

docs/
├── research/
│   ├── DAY_NIGHT_CYCLE.md
│   ├── EXPERIMENTAL_PORT_TECH.md
│   ├── MOON_PHASES.md
│   └── REAL_DOCK_CAMERA_SYSTEMS.md
└── systems/
    ├── ECONOMY_SYSTEM.md
    └── WEATHER_AND_SWAY.md

research/                    # External research notes for agent swarm
├── SWARM_STATUS.md
├── SYNTHESIS.md
├── marine_biology.md
├── maritime_operations.md
├── meteorology.md
├── naval_architecture.md
├── port_geography.md
└── specialized_vessels.md

Root files:
├── deploy.py                # Python SFTP deployment script
├── fix_components.cjs       # Cleanup: component fixes
├── fix_deps.cjs             # Cleanup: dependency array fixes
├── fix_hologram.cjs         # Cleanup: hologram fixes
├── fix_let_const.cjs        # Cleanup: let-to-const conversion
├── fix_lightshow.cjs        # Cleanup: light show fixes
├── fix_lint.cjs             # Cleanup: lint autofix
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
└── .gitignore
```

## Code Organization Patterns

### State Management (Zustand)
- All game state lives in `useGameStore.ts` (~891 lines).
- Store includes: ships, upgrades, crane kinematics, camera modes, weather, wildlife, harbor events, training progress, reputation, economy, booth tier, time of day, sea events, and attachment system config.
- Actions are defined inline inside the store.
- Auto-persistence to `localStorage` via `storage_manager.ts` with a 500ms debounced `scheduleSave`.
- A `.subscribe()` hook triggers saves on every state change.
- Save data includes a version string for basic compatibility checks.
- Derived-state selectors (`selectCurrentShip`, `selectShipUpgrades`, `selectUpgradeProgress`, `selectIsShipFullyUpgraded`) are exported as plain functions.

### 3D Component Patterns
- All 3D components use `@react-three/fiber` JSX syntax.
- Physics bodies use `@react-three/rapier` `RigidBody` components.
- `useFrame` drives per-frame animations (ship bobbing, crane trolley, drone orbit, sway).
- `useMemo` caches expensive objects (geometries, materials, fog).
- `MainScene.tsx` is lazy-loaded with a `Suspense` fallback inside `App.tsx`.
- Ships are procedurally generated from `ships.json` blueprints; a colored box impostor is used as a LOD fallback at distance.

### System Singletons
- `MusicSystem`, `LightingSystem`, `WeatherSystem`, `SwaySystem`, `TrainingSystem`, etc. are ES6 classes instantiated as module-level singletons.
- Some systems expose React hooks (e.g., `useTrainingSystem`, `useAttachmentSystem`) that subscribe to internal listeners.

### Audio Architecture
- `MusicSystem` in `musicSystem.ts` is a singleton using Tone.js.
- Each of the 8 ship types has its own synth/effect chain and `Tone.Transport` sequence.
- Lyrics are arrays of `{ time, text }` synced against `transport.position`.
- BPM is globally adjustable; climax mode temporarily boosts BPM and volume.
- Additional audio layers: `ambientSoundSystem.ts`, `craneSoundSystem.ts`, `audioVisualSync.ts`.

### Ship Upgrades & Attachment Points
- Ships have `attachmentPoints` derived from blueprint `parts`.
- `attachmentSystem.ts` calculates distance from crane spreader to each point.
- States cycle through: `available | hovered | snapping | installing | installed`.
- When within `installDistance` and `twistlockEngaged`, the upgrade is installed into the Zustand store.
- Completion triggers a band-reveal cinematic, music start, and spectator drone camera.

### Design System
- `src/components/DesignSystem.ts` exports shared glassmorphism constants (`GLASSMORPHISM`), typography (`TYPOGRAPHY`), animations (`ANIMATIONS`), ship color palettes (`SHIP_COLORS`), and utility functions (`createGlassPanelStyles`, `createButtonStyles`, `createProgressRingStyles`, `injectDesignSystem`).
- Components heavily rely on inline `React.CSSProperties` objects with `Style` suffix naming (e.g., `containerStyle`).

## Development Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `ShipSpawner.tsx`).
- Utilities / systems: `camelCase.ts` (e.g., `musicSystem.ts`).
- Store hooks: `camelCase` with `use` prefix (e.g., `useGameStore.ts`).

### Component Structure
- One component per file, default export.
- Props interfaces defined at the top of the file.
- Inline styles used for dynamic values.
- CSS-in-JS objects named with `Style` suffix (e.g., `containerStyle`).

### Comments
- File headers use `// === TITLE ===` format.
- Section separators use `// -------------------------------------------------------------------------`.
- JSDoc comments for public functions.

### TypeScript Configuration
- `strict: true`
- `moduleResolution: bundler`
- `jsx: react-jsx`
- `noUnusedLocals: false` and `noUnusedParameters: false`
- `noFallthroughCasesInSwitch: true`
- `target: ES2020`
- `isolatedModules: true`

### ESLint Rules
- Extends: `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`
- `@typescript-eslint/no-explicit-any`: **off**
- `@typescript-eslint/no-unused-vars`: **off**
- `react-refresh/only-export-components`: **warn**
- Ignores: `dist`, `.eslintrc.json`

### Recent Cleanup
- Commit `3674266c` addressed React hook dependency arrays and converted mutable `let` declarations to immutable `const`s across several files (`fix_let_const.cjs`, `fix_deps.cjs`).
- As of April 2026, there are **zero** `TODO` or `FIXME` comments remaining in `src/`.

## Testing Strategy

**No automated test suite exists.** There are no test frameworks (Jest, Vitest, Playwright, Cypress) configured.

### Smoke Test
- `npm run heartbeat` acts as a basic smoke test by running `npm run build` and checking for uncommitted changes or remaining TODO/FIXME comments.
- Recent heartbeat runs report a successful build (~4.13 MB raw / ~1.32 MB gzip, ~23–24 s, 1760 modules).

### Manual Testing Checklist
1. Spawn each ship type and verify unique appearance.
2. Install all upgrades on a ship and verify music starts.
3. Verify lyrics sync with music.
4. Check spectator drone activates after completion.
5. Test day/night cycle affects lighting.
6. Verify WebGPU warning appears on unsupported browsers.
7. Test training module flow (open hub, start module, complete, return).
8. Verify save/load persistence across page reloads.

## Deployment

The project includes a Python deployment script (`deploy.py`) that uses Paramiko for SFTP:

```bash
# Build first, then deploy
npm run build
python deploy.py
```

**Deployment Configuration** (in `deploy.py`):
- Host: `1ink.us`
- Username: `ford442`
- Remote directory: `test.1ink.us/harborglow`
- Local source: `dist/`

**Security Note**: The deploy script contains a hardcoded password on line 45. In production, use environment variables.

## Security Considerations

1. **Hardcoded credentials** in `deploy.py` — username and password are plaintext.
2. **No input validation** on ship spawn positions (currently random generation only).
3. **No rate limiting** on upgrade installation.
4. **No CSP headers** configured in the build output.
5. **Save game state** stored in `localStorage` without encryption or integrity checks beyond a version string check.
6. **Known code hygiene issues** (from heartbeat):
   - 4 circular-dependency warnings: `harborEventSystem` re-export through `eventSystem/index.ts` affects `OnDockRail`, `DistantShipQueue`, `techSystem`, and `MainScene`.
   - `deploy.py` recursive `upload_directory` uses the outer `sftp` variable instead of the `sftp_client` parameter.

## Key Data Types

```typescript
// Ship types and their characteristics (8 total)
type ShipType = 'cruise' | 'container' | 'tanker' | 'bulk' | 'lng' | 'roro' | 'research' | 'droneship'

// Ship definition with attachment points
interface Ship {
  id: string
  type: ShipType
  modelName: string          // GLB filename without extension
  position: [number, number, number]
  velocity?: [number, number, number]
  length: number
  attachmentPoints: AttachmentPoint[]
  name?: string
  sailTime?: number          // Timestamp when ship departs
  isDocked?: boolean         // Whether ship is currently docked
  version?: string           // Ship instance version (e.g., "1.0", "1.5", "2.0")
  blueprintVersion?: string  // The blueprint version this ship was created from
}

// Camera modes
type CameraMode = 'orbit' | 'crane-cockpit' | 'crane-shoulder' | 'crane-top' |
                  'ship-low' | 'ship-aerial' | 'ship-water' | 'ship-rig' |
                  'spectator' | 'transition' | 'crane' | 'booth'

// Dashboard / multiview
type CabinViewMode = 'multiview' | 'immersive'
type MultiviewMode = 'single' | 'quad'
type DashboardViewportId = 'crane' | 'hook' | 'drone' | 'underwater'
type CameraPresetId = 'orbit-overview' | 'gantry-top-down' | 'cable-tip-follow' |
                      'dock-level' | 'drone-chase' | 'ship-interior'

// Game & weather
type GameMode = 'sandbox' | 'training'
type WeatherState = 'clear' | 'rain' | 'fog' | 'storm'
type QualityPreset = 'low' | 'medium' | 'high'

// Events & wildlife
type SeaEventType = 'milky_seas' | 'whale_migration' | 'shark_patrol' | 'meteor_shower' |
                    'bioluminescent_bloom' | 'none'

type HarborEventType =
  | 'whale_migration' | 'dolphin_pod' | 'porpoise_sighting' | 'shark_patrol'
  | 'sea_lion_haulout' | 'plankton_bloom' | 'ship_fire' | 'fireboat_response'
  | 'navy_fleet_week' | 'navy_resupply' | 'atmospheric_river'
  | 'cruise_arrival' | 'cruise_departure' | 'suspicious_vessel' | 'clear'

type WildlifeType = 'humpback_whale' | 'great_white_shark' | 'bottlenose_dolphin' | 'bioluminescent_plankton'

type HarborType = 'norway' | 'singapore' | 'dubai' | 'rotterdam' | 'yokohama' | 'longbeach' | 'santos'

// Training
type TrainingModuleId =
  | 'basic-hooks' | 'precision' | 'wind-sway' | 'night-ops'
  | 'multi-crane' | 'emergency' | 'light-show'

type TrainingRank = 'S' | 'A' | 'B' | 'C' | 'F'
type TrainingState = 'locked' | 'available' | 'in-progress' | 'completed'
```

## Upgrade Counts by Ship Type

| Ship Type | Upgrade Points |
|-----------|----------------|
| cruise | 8 |
| container | 10 |
| tanker | 8 |
| bulk | 9 |
| lng | 10 |
| roro | 8 |
| research | 7 |
| droneship | 6 |

## TODOs and Future Work

### Missing Assets
- **GLB models** are not present in `/public/models/`. The code falls back to procedural primitives. Planned models:
  - `cruise_liner.glb`
  - `container_vessel.glb`
  - `oil_tanker.glb`

### Partially Implemented Systems
- **Training System**: Modules 1–4 have full definitions and tutorials; modules 5–7 (`multi-crane`, `emergency`, `light-show`) are marked **(planned)** with empty tutorials.
- **Economy System**: Documented in `docs/systems/ECONOMY_SYSTEM.md` (Harbor Credits, shop, specialists), but the full shop UI and purchase flow are not yet wired into the main HUD.
- **TSL Shaders**: `lightShowNodes.ts` has a placeholder fallback to `MeshStandardMaterial`; true WebGPU TSL nodes are commented out.

### Future Ideas (from README / docs)
- Multiplayer crane battles
- Ship naming by players
- Export light show as video
- VR mode for crane operation
- Mobile touch controls
- Voice synthesis for lyrics
- Daily contracts / market fluctuations

## Browser Requirements

- **Minimum**: WebGL-enabled browser
- **Recommended**: WebGPU support (Chrome 113+, Edge 113+)
- **Audio**: Requires user interaction to start (browser autoplay policy)

---

*Last updated: April 2026 — based on direct codebase analysis.*
