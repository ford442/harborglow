# Swappable ControlBooth System - Complete Summary

## What Was Built

### 1. Harbor Themes System (`store/harborThemes.ts`)

**7 Different Harbor Themes:**
- 🇳🇴 **Norway** - Bergen Fjord Terminal (cold, foggy, rain droplets)
- 🇸🇬 **Singapore** - Marina Bay Smart Port (neon, high-tech, holographic)
- 🇦🇪 **Dubai** - Jebel Ali Diamond Terminal (luxury, gold, desert)
- 🇳🇱 **Rotterdam** - Maasvlakte Eco Hub (industrial, green energy)
- 🇯🇵 **Yokohama** - Minato Mirai Sky Port (Japanese fusion, cherry blossom)
- 🇺🇸 **Long Beach** - Pacific Pier Terminal (California sunset vibes)
- 🇧🇷 **Santos** - Porto de Santos Tropical Hub (rainforest, carnival)

**Each Theme Includes:**
- Wall/floor/accent colors
- Window tint/opacity/roughness
- Rain droplets & condensation (conditional)
- Ambient & directional lighting
- Point lights inside booth
- Emissive panel colors
- Fog color & density
- Environment map preset
- Audio-reactive colors (bass/mid/treble)
- HUD/holographic colors
- Particle effects (dust motes, steam)

### 2. Store Updates (`store/useGameStore.ts`)

**Added:**
```ts
type HarborType = 'norway' | 'singapore' | 'dubai' | 'rotterdam' | 'yokohama' | 'longbeach' | 'santos'

interface GameState {
  currentHarbor: HarborType
  setCurrentHarbor: (harbor: HarborType) => void
}

// Default:
currentHarbor: 'rotterdam'
```

### 3. Swappable ControlBooth (`scenes/ControlBoothSwappable.tsx`)

**Features:**
- Reads `currentHarbor` from store
- Applies theme materials procedurally
- Conditional rain droplets shader (Norway, Rotterdam, Santos)
- Conditional condensation shader (Singapore, Yokohama, Santos)
- Theme-colored lighting (ambient + directional + point lights)
- Dynamic fog based on harbor
- Environment map switching
- Music-reactive buttons matching theme colors
- Panel emissive glow matching accent color

### 4. Integration Example (`scenes/ControlBoothIntegration.tsx`)

**Complete working example showing:**
- How to use ControlBoothSwappable
- Leva controls for harbor switching
- Harbor-specific water/dock colors
- Conditional effects (steam, dust)
- UI showing current harbor info

## Quick Start

```tsx
// App.tsx
import ControlBoothSwappable from './scenes/ControlBoothSwappable'
import { useGameStore } from './store/useGameStore'
import { harborList } from './store/harborThemes'

function App() {
  // Leva controls
  useControls({
    '🌊 Current Harbor': {
      value: useGameStore.getState().currentHarbor,
      options: harborList.reduce((acc, h) => ({ 
        ...acc, 
        [h.name]: h.id 
      }), {}),
      onChange: (value) => useGameStore.getState().setCurrentHarbor(value)
    }
  })

  return (
    <Canvas camera={{ position: [0, 2.2, 3.2], fov: 65 }}>
      <ControlBoothSwappable quality="high">
        <Water />
        <Dock />
        <Crane />
        <Ships />
      </ControlBoothSwappable>
    </Canvas>
  )
}
```

## File Structure

```
src/
├── store/
│   ├── useGameStore.ts          ← Updated with currentHarbor
│   └── harborThemes.ts          ← NEW: 7 harbor themes
├── scenes/
│   ├── ControlBoothSwappable.tsx ← NEW: Swappable booth
│   ├── ControlBoothIntegration.tsx ← NEW: Example usage
│   ├── MonitorSystem.tsx         ← Updated with theme prop
│   └── ...existing scenes
└── ...
```

## Visual Differences by Harbor

| Harbor | Wall Color | Window | Lighting | Effects |
|--------|-----------|---------|----------|---------|
| **Norway** | Blue-grey metal | Foggy, rain droplets | Cold blue | Rain on glass, steam |
| **Singapore** | Black obsidian | Clear, humid | Neon pink/cyan | Condensation, data particles |
| **Dubai** | Cream marble | Clear, warm | Gold/orange | Desert dust |
| **Rotterdam** | Weathered steel | Grey, rainy | Green eco | Rain on glass |
| **Yokohama** | Dark slate | Pink mist | Cherry blossom | Steam, petals |
| **Long Beach** | Weathered wood | Golden sunset | Warm orange | None |
| **Santos** | Forest green | Tropical haze | Carnival colors | Rain, jungle spores |

## Shaders Included

### 1. Rain Droplets Shader
```glsl
- Animated rain streaks on glass
- Configurable intensity
- Only on: norway, rotterdam, santos, yokohama
```

### 2. Condensation Shader
```glsl
- Foggy condensation pattern
- Tropical humidity effect
- Only on: singapore, yokohama, santos
```

## Programmatic Control

```tsx
// Switch harbors in code
const setCurrentHarbor = useGameStore(s => s.setCurrentHarbor)

// Example: Day/night cycle with harbor
useEffect(() => {
  const hour = new Date().getHours()
  if (hour > 20 || hour < 6) {
    setCurrentHarbor('singapore') // Night lights look great
  } else if (hour > 6 && hour < 12) {
    setCurrentHarbor('longbeach') // Morning sun
  } else {
    setCurrentHarbor('rotterdam') // Grey afternoon
  }
}, [])

// Random harbor on load
useEffect(() => {
  const harbors: HarborType[] = ['norway', 'singapore', 'dubai', 'rotterdam', 'yokohama', 'longbeach', 'santos']
  const random = harbors[Math.floor(Math.random() * harbors.length)]
  setCurrentHarbor(random)
}, [])
```

## Future: GLTF Models

See `ASSET_PRELOADING_GUIDE.md` for:
- `useGLTF.preload()` setup
- Loading booth models per harbor
- Texture swapping
- Memory management
- Progressive loading

## Performance

| Metric | Value |
|--------|-------|
| Shader materials | 2 (rain + condensation, conditional) |
| Texture memory | 0 (procedural) |
| Draw calls | ~15 (booth geometry) |
| Switch time | Instant (no loading) |

## Customization

Add new harbor in `harborThemes.ts`:

```ts
myharbor: {
  name: 'My Custom Port',
  description: 'Description here',
  wallColor: '#ff0000',
  floorColor: '#00ff00',
  accentColor: '#0000ff',
  metalness: 0.7,
  roughness: 0.5,
  windowTint: '#ffffff',
  windowOpacity: 0.2,
  windowRoughness: 0.1,
  hasRainDroplets: false,
  hasCondensation: true,
  ambientLight: { color: '#ffffff', intensity: 0.5 },
  directionalLight: { color: '#ffffff', intensity: 1.0 },
  boothLights: [
    { position: [0, 3.5, 1], color: '#ff0000', intensity: 0.5, distance: 8 }
  ],
  panelEmissive: '#ff0000',
  panelIntensity: 0.3,
  buttonColors: { active: '#00ff00', inactive: '#333333' },
  fogColor: '#888888',
  fogDensity: 0.02,
  envMap: 'sunset',
  bassColor: '#ff0000',
  midColor: '#00ff00',
  trebleColor: '#0000ff',
  hudColor: '#ffffff',
  holographicOpacity: 0.3,
  hasDustMotes: true,
  hasSteam: false
}
```

Then add to store type and list:

```ts
// useGameStore.ts
type HarborType = ... | 'myharbor'

// harborThemes.ts
export const harborList = [
  ...
  { id: 'myharbor', name: 'My Custom Port' }
]
```
