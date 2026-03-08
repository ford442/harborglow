# HarborGlow - Agent Documentation

## Project Overview

HarborGlow is a 3D browser-based game built with React, Three.js, and TypeScript. Players spawn different ship types (cruise liner, container vessel, oil tanker), use a crane to install light upgrades, and enjoy synchronized music with lyrics when ships are fully upgraded.

### Key Features
- Three unique ship types with distinct visual styles and music genres
- Procedural music generation using Tone.js
- Dynamic lighting system that pulses to the beat
- Spectator drone camera mode after ship completion
- Day/night cycle with atmospheric fog
- Physics-based crane simulation

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| 3D Rendering | React Three Fiber (@react-three/fiber) |
| Physics | React Three Rapier (@react-three/rapier) |
| Audio | Tone.js |
| State Management | Zustand |
| Debug UI | Leva |
| Styling | Tailwind CSS + PostCSS |
| Linting | ESLint with TypeScript support |

## Project Structure

```
src/
├── components/           # React UI components
│   ├── HUD.tsx          # Main HUD container (composes other UI)
│   ├── ShipSpawner.tsx  # Ship spawn buttons UI
│   ├── UpgradeMenu.tsx  # Upgrade installation UI with progress
│   ├── LyricsDisplay.tsx # Synchronized lyrics overlay
│   ├── LyricsOverlay.tsx # Alternative lyrics component
│   ├── CraneControls.tsx # Crane control panel
│   └── WebGPUWarning.tsx # WebGPU support warning banner
├── scenes/              # 3D scene components
│   ├── MainScene.tsx    # Scene composition, lighting, spectator drone
│   ├── Ship.tsx         # Ship rendering with upgrade lights
│   ├── Crane.tsx        # Animated dock crane
│   ├── Dock.tsx         # Night dock with volumetric lights
│   └── Water.tsx        # Animated shader water surface
├── store/               # State management
│   └── useGameStore.ts  # Zustand game state (ships, upgrades, music)
├── systems/             # Game logic systems
│   ├── musicSystem.ts   # Tone.js music + lyrics synchronization
│   ├── shipSpawner.ts   # Ship factory with attachment points
│   ├── lightingSystem.ts # Beat-synced lighting hook
│   └── physicsSystem.ts # Physics configuration constants
├── shaders/             # Custom shaders
│   └── lightShowNodes.ts # TSL shaders and god-ray effects
├── App.tsx              # Root app component
├── main.tsx             # Entry point
└── index.css            # Global styles

public/
├── models/              # GLB model files (currently empty, uses fallbacks)
│   └── .gitkeep
└── vite.svg             # Vite logo

deploy.py                # Python SFTP deployment script
```

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite dev server)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

### Build Output
- Production build is output to `dist/` directory
- Vite handles TypeScript compilation and bundling
- Static assets from `public/` are copied to `dist/`

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

**Security Note**: The deploy script contains hardcoded credentials. In production, use environment variables.

## Code Organization Patterns

### State Management (Zustand)
- All game state is centralized in `useGameStore.ts`
- Store includes: ships, upgrades, music state, camera mode, time of day
- Selector functions provided for derived state (e.g., `selectUpgradeProgress`)
- Actions are defined within the store (addShip, installUpgrade, etc.)

### 3D Component Patterns
- All 3D components use `@react-three/fiber` JSX syntax
- Physics bodies use `@react-three/rapier` RigidBody components
- `useFrame` hook used for per-frame animations
- `useMemo` for expensive calculations (shaders, geometries)

### Music System Architecture
- `MusicSystem` class in `musicSystem.ts` is a singleton
- Each ship type has unique synth/effect chains
- Transport timeline drives lyric synchronization
- Audio initializes on first user interaction (browser requirement)

### Ship Rendering
- Ships attempt to load GLB models from `/models/`
- Falls back to primitive geometry if model fails to load
- Upgrade lights conditionally rendered based on `installedUpgrades` state
- Light intensity scales with global `lightIntensity` setting

## Configuration Files

### TypeScript (`tsconfig.json`)
- Target: ES2020
- Module: ESNext with bundler resolution
- Strict mode enabled
- JSX: react-jsx (transform)

### Vite (`vite.config.ts`)
- Standard React plugin configuration
- No custom plugins or aliases

### Tailwind (`tailwind.config.js`)
- Content paths: `./index.html`, `./src/**/*.{ts,tsx}`
- Custom colors: `cyber` palette (50, 900, 950)
- Custom font: JetBrains Mono for monospace

### PostCSS (`postcss.config.js`)
- Plugins: tailwindcss, autoprefixer

## Development Conventions

### File Naming
- Components: PascalCase (e.g., `ShipSpawner.tsx`)
- Utilities/systems: camelCase (e.g., `musicSystem.ts`)
- Store hooks: camelCase with 'use' prefix (e.g., `useGameStore.ts`)

### Component Structure
- One component per file (default export)
- Props interfaces defined at top of file
- Inline styles used for dynamic values
- CSS-in-JS objects named with `Style` suffix (e.g., `containerStyle`)

### Comments
- File headers use `// === TITLE ===` format
- Section separators use `// -------------------------------------------------------------------------`
- JSDoc comments for public functions

### Type Safety
- All store state is typed
- Ship types use discriminated union: `'cruise' | 'container' | 'tanker'`
- Attachment points and upgrades have defined interfaces

## Key Data Types

```typescript
// Ship types and their characteristics
type ShipType = 'cruise' | 'container' | 'tanker'

// Ship definition with attachment points
interface Ship {
  id: string
  type: ShipType
  modelName: string  // GLB filename without extension
  position: [number, number, number]
  length: number
  attachmentPoints: AttachmentPoint[]
  name?: string
}

// Upgrade tracking
interface Upgrade {
  shipId: string
  partName: string
  installed: boolean
  installedAt?: number
}
```

## Testing Strategy

**Note**: The project currently has no automated test suite. Manual testing checklist:

1. Spawn each ship type and verify unique appearance
2. Install all upgrades on a ship and verify music starts
3. Verify lyrics sync with music
4. Check spectator drone activates after completion
5. Test day/night cycle affects lighting
6. Verify WebGPU warning appears on unsupported browsers

## Browser Requirements

- **Minimum**: WebGL-enabled browser
- **Recommended**: WebGPU support (Chrome 113+, Edge 113+)
- **Audio**: Requires user interaction to start (browser policy)

## TODOs and Future Work

From README.md and code comments:

### Models
- Add GLB model files to `/public/models/`:
  - `cruise_liner.glb`
  - `container_vessel.glb`
  - `oil_tanker.glb`
- Tune ship scales after model testing (marked with TODO in Ship.tsx)

### Features
- Multiplayer crane battles
- Ship naming by players
- Export light show as video
- VR mode for crane operation
- Mobile touch controls

### Audio
- Import custom audio files
- Procedural music generation expansion
- Voice synthesis for lyrics

## Security Considerations

1. **deploy.py contains hardcoded credentials** - Should use environment variables
2. **No input validation** on ship spawn positions (currently random)
3. **No rate limiting** on upgrade installation
4. **No CSP headers** configured in build output

## Dependencies of Note

| Package | Purpose |
|---------|---------|
| `@react-three/drei` | Helper components (OrbitControls, Environment, useGLTF) |
| `leva` | Debug GUI panels |
| `tone` | Audio synthesis and sequencing |
| `zustand` | Minimal state management |
| `three` | Core 3D library |

## Common Development Tasks

### Adding a New Ship Type
1. Add to `ShipType` union in `useGameStore.ts`
2. Add name lists and config in `shipSpawner.ts`
3. Add music config in `musicSystem.ts`
4. Add rendering logic in `Ship.tsx`
5. Add upgrade config in `UpgradeMenu.tsx`

### Modifying Lighting Behavior
- Global intensity: Update `lightIntensity` in store
- Ship-specific lights: Modify the respective ship component in `Ship.tsx`
- Beat pulsing: Adjust logic in `useFrame` within `Ship.tsx`

### Adding New Music Tracks
- Define synth chains in `musicSystem.ts` initialization methods
- Add lyrics array with timing
- Create band info entry

---

*Last updated: Based on codebase analysis, March 2026*
