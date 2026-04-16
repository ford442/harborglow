# HarborGlow - Agent Documentation

## Project Overview

HarborGlow is a 3D browser-based crane-operator game built with React, Three.js, and TypeScript. Players spawn ships, operate a physics-based crane to install light upgrades, and trigger synchronized procedural music with lyrics when vessels are fully upgraded.

The project has evolved from a simple 3-ship prototype into a feature-rich harbor simulation with training modules, economy and reputation systems, dynamic weather and wildlife, sea events, multiview camera dashboards, and tiered control booth themes.

### Core Gameplay Loop
1. Spawn a ship from the harbor menu
2. Use the crane to position the spreader near attachment points
3. Install light rigs on each attachment point
4. When all upgrades are installed, a band-reveal cinematic plays, music starts, and the spectator drone orbits the ship

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
| Audio | tone | ^14.7.77 |
| State Management | zustand | ^4.4.7 |
| Debug UI | leva | ^0.9.35 |
| Styling | Tailwind CSS | ^3.4.19 |
| CSS Processing | PostCSS + Autoprefixer | ^8.5.6 / ^10.4.27 |
| Linting | ESLint + @typescript-eslint | ^8.55.0 |
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
- Production build is output to `dist/`
- Vite handles TypeScript compilation and bundling
- Static assets from `public/` are copied to `dist/`
- `base: './'` in `vite.config.ts` enables relative-path deployment
- Manual chunk splitting creates `vendor-3d` (three, R3F, drei, rapier, postprocessing) and `vendor-audio` (tone)
- React, React-DOM, Leva, and Zustand are intentionally kept in the main bundle to avoid `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` errors
- Terser drops `console.log` and `debugger` in production

## Project Structure

```
src/
├── components/           # React UI components
│   ├── MainMenu/         # Menu modals, buttons, styles
│   ├── controls/         # JoystickControl, useCranePhysics
│   ├── dashboard/        # Monitor feeds (Arctic360Cam, TwistlockCam, WinchCam, etc.)
│   ├── hud/              # TopBar, TimeDisplay, ShipStatusPanel, CameraMultiviewControls
│   ├── upgrade/          # Upgrade configs
│   ├── HUD.tsx           # Main HUD container
│   ├── ShipSpawner.tsx   # Ship spawn buttons
│   ├── UpgradeMenu.tsx   # Upgrade installation UI
│   ├── LyricsDisplay.tsx # Synchronized lyrics overlay
│   ├── CraneControls.tsx # Crane control panel
│   ├── TrainingMode.tsx  # Training hub
│   ├── TrainingHUD.tsx   # In-training UI
│   ├── LoadingScreen.tsx # Loading progress screen
│   ├── ErrorBoundary.tsx # Error boundary for 3D scene
│   └── DesignSystem.ts   # Shared glassmorphism / cyber styles
├── scenes/               # R3F 3D scene components
│   ├── MainScene.tsx     # Scene composition, lazy-loaded
│   ├── Ship.tsx          # Ship rendering (procedural + fallback)
│   ├── ProceduralShip.tsx# Blueprint-driven procedural ships
│   ├── Crane.tsx         # Animated dock crane
│   ├── Dock.tsx          # Night dock with volumetric lights
│   ├── Water.tsx         # Water surface
│   ├── EnhancedWeather.tsx
│   ├── Wildlife.tsx / SeaBirds.tsx
│   ├── SeaEvents.tsx
│   ├── ControlBooth.tsx / ControlBoothSwappable.tsx
│   ├── PostProcessing.tsx
│   ├── VolumetricLighting.tsx
│   ├── HolographicUI.tsx
│   └── LightShow.tsx
├── store/                # State management
│   ├── useGameStore.ts   # Monolithic Zustand store (~860 lines)
│   └── harborThemes.ts   # Theme definitions
├── systems/              # Game logic singletons
│   ├── musicSystem.ts    # Tone.js music + lyrics sync
│   ├── lightingSystem.ts # Beat-synced lighting
│   ├── shipSpawner.ts    # Ship factory with attachment points
│   ├── attachmentSystem.ts# Crane-to-ship attachment logic
│   ├── weatherSystem.ts  # Weather state machine
│   ├── swaySystem.ts     # Ship sway physics
│   ├── trainingSystem.ts # Training module definitions
│   ├── economySystem.ts  # Harbor Credits / shop logic
│   ├── reputationSystem.ts
│   ├── dynamicEventSystem.ts
│   ├── trafficSystem.ts
│   ├── timeSystem.ts / moonSystem.ts
│   ├── ambientSoundSystem.ts / craneSoundSystem.ts
│   └── eventSystem/      # Event helpers
├── shaders/              # Custom shaders
│   └── lightShowNodes.ts # God-ray shader + TSL fallback
├── types/                # Type definitions
│   └── ShipBlueprint.ts  # Blueprint registry loader (ships.json)
├── utils/                # Utilities
│   └── storage_manager.ts# localStorage persistence wrapper
├── hooks/                # Custom React hooks
│   └── useScreenShake.ts
├── blueprints/           # Procedural definitions
│   └── ships.json        # Ship geometry blueprints
├── App.tsx               # Root app component
├── main.tsx              # Entry point
└── index.css / App.css   # Global styles

public/
├── models/               # GLB model files (currently empty)
│   └── .gitkeep
└── vite.svg

docs/
├── research/             # DAY_NIGHT_CYCLE.md, MOON_PHASES.md, etc.
└── systems/              # ECONOMY_SYSTEM.md, WEATHER_AND_SWAY.md

Root files:
├── deploy.py             # Python SFTP deployment script
├── fix_components.cjs    # Recent cleanup scripts
├── fix_deps.cjs
├── fix_hologram.cjs
├── fix_let_const.cjs
└── package.json / vite.config.ts / tsconfig.json / tailwind.config.js / postcss.config.js
```

## Code Organization Patterns

### State Management (Zustand)
- All game state lives in `useGameStore.ts`
- Store includes: ships, upgrades, crane kinematics, camera modes, weather, wildlife, harbor events, training progress, reputation, economy, booth tier, time of day
- Actions are defined inline inside the store
- Auto-persistence to `localStorage` via `storage_manager.ts` with a 500ms debounced `scheduleSave`
- A `.subscribe()` hook triggers saves on every state change
- Save data includes a version string for basic compatibility checks

### 3D Component Patterns
- All 3D components use `@react-three/fiber` JSX syntax
- Physics bodies use `@react-three/rapier` `RigidBody` components
- `useFrame` drives per-frame animations (ship bobbing, crane trolley, drone orbit, sway)
- `useMemo` caches expensive objects (geometries, materials, fog)
- `MainScene.tsx` is lazy-loaded with a `Suspense` fallback inside `App.tsx`
- Ships are procedurally generated from `ships.json` blueprints; a colored box impostor is used as a LOD fallback at distance

### System Singletons
- `MusicSystem`, `LightingSystem`, `WeatherSystem`, `SwaySystem`, `TrainingSystem`, etc. are ES6 classes instantiated as module-level singletons
- Some systems expose React hooks (e.g., `useTrainingSystem`, `useAttachmentSystem`) that subscribe to internal listeners

### Audio Architecture
- `MusicSystem` in `musicSystem.ts` is a singleton using Tone.js
- Each of the 8 ship types has its own synth/effect chain and `Tone.Transport` sequence
- Lyrics are arrays of `{ time, text }` synced against `transport.position`
- BPM is globally adjustable; climax mode temporarily boosts BPM and volume
- Additional audio layers: `ambientSoundSystem.ts`, `craneSoundSystem.ts`, `audioVisualSync.ts`

### Ship Upgrades & Attachment Points
- Ships have `attachmentPoints` derived from blueprint `parts`
- `attachmentSystem.ts` calculates distance from crane spreader to each point
- States cycle through: `available | hovered | snapping | installing | installed`
- When within `installDistance` and `twistlockEngaged`, the upgrade is installed into the Zustand store
- Completion triggers a band-reveal cinematic, music start, and spectator drone camera

## Development Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `ShipSpawner.tsx`)
- Utilities / systems: `camelCase.ts` (e.g., `musicSystem.ts`)
- Store hooks: `camelCase` with `use` prefix (e.g., `useGameStore.ts`)

### Component Structure
- One component per file, default export
- Props interfaces defined at the top of the file
- Inline styles used for dynamic values
- CSS-in-JS objects named with `Style` suffix (e.g., `containerStyle`)
- Heavy use of glassmorphism via shared `DesignSystem.ts`

### Comments
- File headers use `// === TITLE ===` format
- Section separators use `// -------------------------------------------------------------------------`
- JSDoc comments for public functions

### TypeScript Configuration
- `strict: true`
- `moduleResolution: bundler`
- `jsx: react-jsx`
- `noUnusedLocals: false` and `noUnusedParameters: false`

### ESLint Rules
- Extends: `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`
- `@typescript-eslint/no-explicit-any`: **off**
- `@typescript-eslint/no-unused-vars`: **off**
- `react-refresh/only-export-components`: **warn**

### Recent Cleanup
- Commit `3674266c` addressed React hook dependency arrays and converted mutable `let` declarations to immutable `const`s across several files (`fix_let_const.cjs`, `fix_deps.cjs`)

## Testing Strategy

**No automated test suite exists.** There are no test frameworks (Jest, Vitest, Playwright, Cypress) configured.

### Smoke Test
- `npm run heartbeat` acts as a basic smoke test by running `npm run build` and checking for uncommitted changes or remaining TODO/FIXME comments

### Manual Testing Checklist
1. Spawn each ship type and verify unique appearance
2. Install all upgrades on a ship and verify music starts
3. Verify lyrics sync with music
4. Check spectator drone activates after completion
5. Test day/night cycle affects lighting
6. Verify WebGPU warning appears on unsupported browsers
7. Test training module flow (open hub, start module, complete, return)
8. Verify save/load persistence across page reloads

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

**Security Note**: The deploy script contains a hardcoded password. In production, use environment variables.

## Security Considerations

1. **Hardcoded credentials** in `deploy.py` — username and password are plaintext
2. **No input validation** on ship spawn positions (currently random generation only)
3. **No rate limiting** on upgrade installation
4. **No CSP headers** configured in the build output
5. **Save game state** stored in `localStorage` without encryption or integrity checks beyond a version string check

## Key Data Types

```typescript
// Ship types and their characteristics
type ShipType = 'cruise' | 'container' | 'tanker' | 'bulk' | 'lng' | 'roro' | 'research' | 'droneship'

// Ship definition with attachment points
interface Ship {
  id: string
  type: ShipType
  modelName: string  // GLB filename without extension
  position: [number, number, number]
  length: number
  attachmentPoints: AttachmentPoint[]
  name?: string
  sailTime?: number
  isDocked?: boolean
  version?: string
  blueprintVersion?: string
}

// Camera modes
 type CameraMode = 'orbit' | 'crane-cockpit' | 'crane-shoulder' | 'crane-top' |
                   'ship-low' | 'ship-aerial' | 'ship-water' | 'ship-rig' |
                   'spectator' | 'transition' | 'crane' | 'booth'

type GameMode = 'sandbox' | 'training'
type WeatherState = 'clear' | 'rain' | 'fog' | 'storm'
```

## TODOs and Future Work

### Missing Assets
- **GLB models** are not present in `/public/models/`. The code falls back to procedural primitives. Planned models:
  - `cruise_liner.glb`
  - `container_vessel.glb`
  - `oil_tanker.glb`

### Partially Implemented Systems
- **Training System**: Modules 1–4 have full definitions and tutorials; modules 5–7 (`multi-crane`, `emergency`, `light-show`) are marked **(planned)** with empty tutorials
- **Economy System**: Documented in `docs/systems/ECONOMY_SYSTEM.md` (Harbor Credits, shop, specialists), but the full shop UI and purchase flow are not yet wired into the main HUD
- **TSL Shaders**: `lightShowNodes.ts` has a placeholder fallback to `MeshStandardMaterial`; true WebGPU TSL nodes are commented out

### Future Ideas (from README / docs)
- Multiplayer crane battles
- Ship naming by players
- Export light show as video
- VR mode for crane operation
- Mobile touch controls
- Voice synthesis for lyrics
- Daily contracts / market fluctuations

### Code-level TODOs
- After the recent cleanup (`fix_components.cjs`), there are **zero** `TODO` or `FIXME` comments remaining in `src/`.

## Browser Requirements

- **Minimum**: WebGL-enabled browser
- **Recommended**: WebGPU support (Chrome 113+, Edge 113+)
- **Audio**: Requires user interaction to start (browser autoplay policy)

---

*Last updated: Based on codebase analysis, April 2026*
