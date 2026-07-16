# HarborGlow - Agent Documentation

## Project Overview

HarborGlow is a 3D browser-based crane-operator simulation built with React, Three.js, and TypeScript. Players spawn ships into a living harbor, operate a physics-based gantry crane to install light upgrades at attachment points, and trigger synchronized procedural music with lyrics when a vessel is fully upgraded. The project has evolved from a simple three-ship prototype into a feature-rich harbor simulation with eight vessel types, training modules, economy and reputation systems, dynamic weather and wildlife, sea events, multiview camera dashboards, tiered control booth themes, a day/night cycle, tugboat operations, and moon phases.

### Core Gameplay Loop
1. Spawn a ship from the harbor menu.
2. Use the crane to position the spreader near attachment points.
3. Install light rigs on each attachment point.
4. When all upgrades are installed, a band-reveal cinematic plays, music starts, and the spectator drone orbits the ship.

### Living Fleet
Ships automatically depart after 45–90 seconds, sail away (hidden), and return to dock after ~10 seconds. The fleet cycles continuously in sandbox mode.

### Tugboat Operations
The game includes an alternate operation mode where players control a tugboat to assist distressed ships, adding a secondary gameplay layer beyond crane operation.

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

## Renderer Backends (WebGPU + WebGL2 Fallback)

The app is **WebGPU-first** (via Three.js `WebGPURenderer` + R3F) but ships a **toggleable WebGL2 fallback renderer** (`WebGLRenderer`) for:

- Easier visual debugging of crane, ships, glowing rigs, particles, and music-reactive light shows (agents and Playwright have a hard time introspecting WebGPU framebuffers).
- Using WebGL2 as a stable reference implementation while porting/iterating graphics features (GLSL vs TSL/WGSL).
- Robust CI / automated testing and screenshot comparison.

**How to switch** (priority order):
1. URL param: `?renderer=webgl` or `?renderer=webgpu`
2. Leva debug UI (in-game): open the Leva panel → **"Renderer Backend"** folder → dropdown
3. `localStorage` key `harborglow.renderer.preference` (persisted automatically)

Canvas uses `key={`renderer-${pref}`}` + an `async gl` factory so switching remounts only the R3F context while Zustand game state, Rapier world, Tone transport, etc. remain live.

**Debug helpers** (both paths):
- `G` — wireframe overlay on all meshes (ships, crane, light rigs, dock...)
- `F` — Rapier `<Debug />` collider visualization
- Yellow top banner (updated `WebGPUWarning.tsx`) shows the active backend + reason
- `&wireframe=1&physicsDebug=1` for deep-linkable debug sessions
- `window.currentRenderer`, `window.harborglowRenderer`, `<canvas>.dataset.renderer` are set for tooling

Shared scene graph means **visual parity is expected for all core content** (ships from blueprints, attachment points, light rigs, AudioReactiveLightShow, PostProcessing, volumetric lights, etc.). Differences are mainly post-processing fidelity, shadow map details, and availability of TSL compute nodes.

See:
- `docs/RENDERER.md` — usage, architecture diagram, WebGL2→WebGPU porting table
- `src/rendering/` — `createRenderer.ts`, `rendererConfig.ts`, `rendererState.ts`, `WireframeDebug.tsx`, `RendererDiagnosticsMonitor.tsx`
- `src/App.tsx` — Canvas + Leva bridge + keyboard wiring
- `src/components/WebGPUWarning.tsx`

When adding graphics work, develop/tune first on `?renderer=webgl`, verify on `?renderer=webgpu`.

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
├── components/              # React UI components (~42 files)
│   ├── MainMenu/            # Menu modals, buttons, styles, types
│   │   ├── CreditsModal.tsx
│   │   ├── HowToPlayModal.tsx
│   │   ├── MenuButton.tsx
│   │   ├── Modal.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── index.ts
│   │   ├── modalStyles.ts
│   │   ├── styles.ts
│   │   └── types.ts
│   ├── controls/            # Crane input handling
│   │   ├── JoystickControl.tsx
│   │   └── useCranePhysics.ts
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
│   ├── hud/                 # Heads-up display elements
│   │   ├── CameraMultiviewControls.tsx
│   │   ├── CraneControlIndicators.tsx
│   │   ├── HotkeyHints.tsx
│   │   ├── MissionHUD.tsx
│   │   ├── ModeToggle.tsx
│   │   ├── RewardAnimation.tsx
│   │   ├── ShipStatusPanel.tsx
│   │   ├── TimeDisplay.tsx
│   │   ├── TopBar.tsx
│   │   ├── TugboatHUD.tsx
│   │   ├── WaveHeightDebug.tsx
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
│   (new) src/rendering/        # Dual-renderer support (createRenderer, config, WireframeDebug, diagnostics)
│       ├── createRenderer.ts
│       ├── rendererConfig.ts
│       ├── rendererState.ts
│       ├── WireframeDebug.tsx
│       ├── RendererDiagnosticsMonitor.tsx
│       └── index.ts
├── scenes/                  # R3F 3D scene components (~37 files)
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
│   ├── DistressedShip.tsx
│   ├── DistantShipQueue.tsx
│   ├── Dock.tsx
│   ├── EnhancedWeather.tsx
│   ├── ExperimentalTech.tsx
│   ├── FFTOcean.tsx
│   ├── FoamSystem.tsx
│   ├── GlobalIllumination.tsx
│   ├── HolographicUI.tsx
│   ├── InteractiveWater.tsx
│   ├── LightShow.tsx
│   ├── MainScene.tsx        # Scene composition, lazy-loaded (~1602 lines)
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
│   ├── Tugboat.tsx
│   ├── TugboatTargetShip.tsx
│   ├── UnderwaterCamera.tsx
│   ├── UpgradeCelebration.tsx
│   ├── VolumetricLighting.tsx
│   ├── Water.tsx
│   └── Wildlife.tsx
├── store/                   # State management
│   ├── useGameStore.ts      # Monolithic Zustand store (~1184 lines)
│   └── harborThemes.ts      # Theme definitions
├── systems/                 # Game logic singletons (~34 files)
│   ├── StormSystem.ts
│   ├── WaveSystem.ts
│   ├── ambientSoundSystem.ts
│   ├── attachmentSystem.ts  # Crane-to-ship attachment logic
│   ├── audioVisualSync.ts
│   ├── cameraSystem.ts
│   ├── cinematicSystem.ts
│   ├── craneSoundSystem.ts
│   ├── dynamicEventSystem.ts
│   ├── economySystem.ts     # Harbor Credits / shop logic
│   ├── eventSystem/         # Event helpers and configs
│   │   ├── HarborEventSystem.ts
│   │   ├── eventConfigs.ts
│   │   ├── index.ts
│   │   ├── speciesData.ts
│   │   └── types.ts
│   ├── introLyrics.ts
│   ├── introMusicSystem.ts
│   ├── lightingSystem.ts    # Beat-synced lighting
│   ├── moonSystem.ts
│   ├── musicSystem.ts       # Tone.js music + lyrics sync (~872 lines)
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
│   ├── trainingSystem.ts    # Training module definitions (~772 lines)
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
│   ├── useCameraTransition.ts
│   └── useScreenShake.ts
├── blueprints/              # Procedural definitions
│   └── ships.json           # Ship geometry blueprints (8 vessels)
├── App.tsx                  # Root app component
├── App.css
├── main.tsx                 # Entry point
└── index.css                # Global styles + crane dashboard CSS

public/
├── models/                  # GLB model files (currently empty)
│   └── .gitkeep
├── audio/                   # Audio assets
├── models/                  # 3D model assets
└── vite.svg

docs/
├── plans/                   # Implementation plans
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
├── .github/
│   ├── workflows/
│   │   └── copilot-setup-steps.yml  # Playwright MCP setup workflow
│   ├── copilot-instructions.md
│   └── playwright-mcp.json
├── deploy.py                # Python SFTP deployment script
├── scripts/archive/           # One-shot codemods from Apr 2026 refactor (see README)
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
- All game state lives in `useGameStore.ts` (~1184 lines).
- Store includes: ships, upgrades, crane kinematics, camera modes, weather, wildlife, harbor events, training progress, reputation, economy, booth tier, time of day, sea events, operation mode (crane/tugboat), tugboat state, wave params, wind state, and attachment system config.
- Actions are defined inline inside the store.
- Auto-persistence to `localStorage` via `storage_manager.ts` with a debounced save triggered by `.subscribe()`.
- Save data includes a version string (`harborglow-save-v3`) for basic compatibility checks.
- Derived-state selectors (`selectCurrentShip`, `selectShipUpgrades`, `selectUpgradeProgress`, `selectIsShipFullyUpgraded`) are exported as plain functions.

### 3D Component Patterns
- All 3D components use `@react-three/fiber` JSX syntax.
- Physics bodies use `@react-three/rapier` `RigidBody` components.
- `useFrame` drives per-frame animations (ship bobbing, crane trolley, drone orbit, sway).
- `useMemo` caches expensive objects (geometries, materials, fog).
- `MainScene.tsx` is lazy-loaded with a `Suspense` fallback inside `App.tsx`.
- Ships are procedurally generated from `ships.json` blueprints; a colored box impostor is used as a LOD fallback at distance.

### System Singletons
- `MusicSystem`, `LightingSystem`, `WeatherSystem`, `SwaySystem`, `TrainingSystem`, `EconomySystem`, `ReputationSystem`, `TrafficSystem`, `WildlifeSystem`, `SeaEventsSystem`, `HarborEventSystem`, `TimeSystem`, `MoonSystem`, etc. are ES6 classes or objects instantiated as module-level singletons.
- Some systems expose React hooks (e.g., `useCameraTransition`, `useAudioVisualSync`) that subscribe to internal listeners.

### Audio Architecture
- `MusicSystem` in `musicSystem.ts` is a singleton using Tone.js.
- Each of the 8 ship types has its own synth/effect chain and `Tone.Transport` sequence.
- Lyrics are arrays of `{ time, text }` synced against `transport.position`.
- BPM is globally adjustable; climax mode temporarily boosts BPM and volume.
- Additional audio layers: `ambientSoundSystem.ts`, `craneSoundSystem.ts`, `audioVisualSync.ts`, `introMusicSystem.ts`.
- Audio requires user interaction to start (browser autoplay policy). A click/keydown listener in `App.tsx` initializes `Tone.start()`.

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
- Commit `3674266c` addressed React hook dependency arrays and converted mutable `let` declarations to immutable `const`s across several files (codemods now in `scripts/archive/`).
- As of April 2026, there are **zero** `TODO` or `FIXME` comments remaining in `src/`.

## Testing Strategy

**Vitest** is configured (`npm test`) with smoke tests for core systems (e.g. `sequencerSystem`).

### Smoke Test
- `npm run heartbeat` runs `git status`, a TODO/FIXME grep, `npm run build`, and `npm test`.
- Recent heartbeat runs: build succeeds (~1760 modules), 95/95 Vitest tests pass, 0 TODO/FIXME in `src/`.

### Manual Testing Checklist
1. Spawn each ship type and verify unique appearance.
2. Install all upgrades on a ship and verify music starts.
3. Verify lyrics sync with music.
4. Check spectator drone activates after completion.
5. Test day/night cycle affects lighting.
6. Verify WebGPU/Renderer warning banner appears on unsupported browsers or when `?renderer=webgl` is used.
7. Test renderer toggle: `?renderer=webgl`, Leva "Renderer Backend" dropdown, `G` (wireframe), `F` (physics debug). Verify wireframe + colliders appear under both backends and game state is unaffected.
8. Test training module flow (open hub, start module, complete, return).
9. Verify save/load persistence across page reloads.
10. Test tugboat mode toggle and tugboat HUD.
11. Verify moon phase display in time system.

## Deployment

The project includes a Python deployment script (`deploy.py`) that zips `dist/` and uploads it
as a single bundle to a Contabo storage manager over HTTPS:

```bash
# Build first, then deploy
npm run build
export DEPLOY_TOKEN="your_long_token_from_vps_env"
python deploy.py
```

**Deployment Configuration** (in `deploy.py`):
- Target: `https://storage.noahcohn.com/api/deploy/harborglow/bundle`
- Local source: `dist/`
- Auth: `DEPLOY_TOKEN` env var (sent as `X-Deploy-Token` header); no token is hardcoded in the script.

**Security Note**: Never hardcode `DEPLOY_TOKEN` (or any credential) back into `deploy.py` — always read it
from the environment. The old Paramiko/SFTP-based `deploy_old.py` (with a hardcoded plaintext password) has
been removed.

## GitHub Actions

- `.github/workflows/copilot-setup-steps.yml`: Sets up Node.js 20, installs dependencies with `npm ci`, and installs Chromium for Playwright MCP integration. Triggered on workflow dispatch, push, or PR changes to the workflow or MCP config files.

## Security Considerations

1. **`deploy.py`** reads `DEPLOY_TOKEN` from the environment only — never hardcode a token/password into this
   file (this repo is public). `deploy_old.py` (Paramiko/SFTP, hardcoded plaintext password) has been removed.
2. **No input validation** on ship spawn positions (currently random generation only).
3. **No rate limiting** on upgrade installation.
4. **No CSP headers** configured in the build output.
5. **Save game state** stored in `localStorage` without encryption or integrity checks beyond a version string check.

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
type OperationMode = 'crane' | 'tugboat'
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

- **Minimum**: WebGL2-enabled browser (the WebGL2 fallback renderer works everywhere WebGL2 is available)
- **Recommended**: WebGPU support (Chrome 113+, Edge 113+) for the primary path
- **Renderer switching**: `?renderer=webgl` forces the stable debug/reference WebGLRenderer; `?renderer=webgpu` (default) uses WebGPURenderer (with automatic internal fallback when needed). See `docs/RENDERER.md`.
- **Audio**: Requires user interaction to start (browser autoplay policy)

---

*Last updated: May 2026 — based on direct codebase analysis of 145 source files.*

## Cursor Cloud specific instructions

Standard commands live in `package.json` (`dev`, `build`, `lint`, `test`, `preview`) and are described above; this section only records non-obvious caveats found while setting up the environment.

### Running the app / dev server
- Dev server: `npm run dev` (Vite, `host: 0.0.0.0`, port `5173`). For agent/automated testing always open `http://localhost:5173/?renderer=webgl` — the default WebGPU path is hard to introspect from headless browsers, and `?renderer=webgl` skips the WebGPU renderer entirely (see the "Renderer Backends" section).
- `vite.config.ts` sets `optimizeDeps.esbuildOptions.target: 'esnext'`. This is required: three.js WebGPU modules (crawled via the lazy `WebGPURenderer` import) use top-level await, and Vite's dev dependency optimizer otherwise uses its default target (`es2020, chrome87, …`), which rejects TLA and makes `npm run dev` crash on a cold dependency scan. `build.target` was already `esnext`, so production builds were unaffected. If you `rm -rf node_modules/.vite`, the next `npm run dev` re-runs the scan — this must be present for it to succeed.

### Known blocker: dev game scene fails to load (pre-existing code bug)
- The main menu loads and is fully interactive, but clicking **New Game / Training / Tugboat Captain** lazy-loads `MainScene`, which imports `src/scenes/mainScene/MainSceneHelpers.tsx`. In `npm run dev` this throws `[plugin:vite:react-babel] ... Identifier 'LevaControlsConfig' has already been declared. (434:10)`.
- Root cause is a corrupted auto-modularization of that file: it declares `LevaControlsConfig` twice (an `export type` near the top and an `interface` lower down), imports `useControls`/`harborEvents` twice, and stubs runtime values (`const ShipComponent = () => null`, `const CAMERA_MODES = {}`, no-op sound fns). A `// @ts-nocheck` header hides all of this from `tsc`, and the esbuild-based production build tolerates the duplicates — but the strict Babel dev transform (`@vitejs/plugin-react`) does not. Because ships render through the stubbed `ShipComponent`, even a production build would show no ships.
- This is an application-code bug, not an environment/dependency issue, and is out of scope for environment setup. Fixing full gameplay requires repairing `MainSceneHelpers.tsx` (dedupe `LevaControlsConfig`/imports and restore the real `ShipComponent`/`AtSeaShip` imports).

### Other notes
- `npm run lint` has one pre-existing error (`@typescript-eslint/ban-ts-comment` in `src/rendering/createRenderer.ts`) plus warnings; it exits non-zero independent of any setup work.
- The `build:wasm` step (`cpp/build.sh`) self-skips when Emscripten (`em++`) is absent, so `npm run build` succeeds without the Emscripten SDK.
