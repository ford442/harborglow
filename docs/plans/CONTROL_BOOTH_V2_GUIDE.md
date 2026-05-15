# ControlBooth v2 - Realistic Industrial Crane Cab

## Overview

A high-fidelity, performant 3D control booth that places the player inside an industrial crane operator cabin with live multi-monitor feeds showing different camera angles of the harbor.

```
┌────────────────────────────────────────────────────────────────────┐
│                     CONTROL BOOTH LAYOUT                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐                                                 │
│  │   ┌──────┐   │     ╔════════════════════════════════════╗     │
│  │   │ HOOK │   │     ║                                    ║     │
│  │   │ CAM  │   │     ║      PANORAMIC WINDOW              ║     │
│  │   └──────┘   │     ║      (Main Scene View)             ║     │
│  │   ┌──────┐   │     ║                                    ║     │
│  │   │DRONE │   │     ║    ┌─────────────────────────┐     ║     │
│  │   │      │   │     ║    │                         │     ║     │
│  │   └──────┘   │     ║    │   Dock, Water, Ships    │     ║     │
│  │              │     ║    │   Visible through       │     ║     │
│  │ LEFT WALL    │     ║    │   fogged glass window   │     ║     │
│  │  (2 curved   │     ║    │                         │     ║     │
│  │   monitors)  │     ║    └─────────────────────────┘     ║     │
│  │              │     ╚════════════════════════════════════╝     │
│  └──────────────┘                                                 │
│                              [CONTROL DESK]                       │
│                              ┌───────────────┐                    │
│                              │ ◯ ◯   ┌───┐   │                    │
│                              │ ◯ ◯   │ ◯ │   │  ← Joysticks       │
│                              │   ┌─────────┐ │                    │
│                              │   │ DISPLAY │ │  ← Central screen  │
│                              │   └─────────┘ │                    │
│                              └───────────────┘                    │
│                                        PLAYER 👤                    │
│  ┌──────────────────────────────────────┐                         │
│  │      ┌────────────────────┐          │                         │
│  │      │   UNDERWATER CAM   │          │                         │
│  │      │   (Large curved    │          │                         │
│  │      │    rear monitor)   │          │                         │
│  │      └────────────────────┘          │                         │
│  │             REAR WALL                 │                         │
│  └──────────────────────────────────────┘                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Realistic Industrial Materials

| Component | Material | Properties |
|-----------|----------|------------|
| Walls | `MeshStandardMaterial` | metalness: 0.7, roughness: 0.6 |
| Floor | `MeshStandardMaterial` | Dark industrial metal with strips |
| Window | `MeshPhysicalMaterial` | Fogged glass with transmission: 0.7 |
| Desk | `MeshStandardMaterial` | Dark metal frame |
| Monitor Bezels | `MeshStandardMaterial` | Matte black, metalness: 0.8 |
| Monitor Glass | `MeshPhysicalMaterial` | Clear coat with reflections |

### 2. Curved Monitors

All monitors use procedurally curved geometry for realism:

```tsx
// Curved plane geometry
const curvedGeometry = useMemo(() => {
  const geometry = new THREE.PlaneGeometry(width, height, segments, 1)
  const positions = geometry.attributes.position.array as Float32Array
  
  // Curve vertices along X axis
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const angle = x / curveRadius
    positions[i] = Math.sin(angle) * curveRadius
    positions[i + 2] = Math.cos(angle) * curveRadius - curveRadius
  }
  
  geometry.computeVertexNormals()
  return geometry
}, [width, height, curveRadius, segments])
```

### 3. Monitor Configuration

| Monitor | Position | Size | Curve Radius | Camera |
|---------|----------|------|--------------|--------|
| Hook Cam | Left wall upper | 1.8m × 1.1m | 4m | Follows crane hook |
| Drone | Left wall lower | 1.8m × 1.1m | 4m | Orbits ship |
| Underwater | Rear wall center | 2.4m × 1.5m | 6m | Below waterline |

### 4. Player Camera Setup

The player's viewpoint is fixed inside the booth:

```tsx
// Inside ControlBooth useEffect
camera.position.set(0, 2.2, 3.2)  // Eye level, slightly back
camera.lookAt(0, 2.5, -20)        // Looking out window
camera.fov = 65                    // Natural field of view
```

### 5. Music-Reactive Elements

- **Buttons**: Light up based on bass/mid/treble levels
- **Central display**: Emissive intensity pulses with bass
- **Monitor glow**: Ambient lights react to audio
- **Joysticks**: Subtle idle animation with bass vibration

## Usage

### Basic Integration

```tsx
import { Canvas } from '@react-three/fiber'
import ControlBooth from './scenes/ControlBooth'
import Water from './scenes/Water'
import Dock from './scenes/Dock'
import Crane from './scenes/Crane'

function App() {
  return (
    <Canvas
      camera={{ position: [0, 2.2, 3.2], fov: 65 }}
      shadows
      dpr={[1, 2]}
    >
      <ControlBooth harborTheme="industrial" quality="high">
        {/* Scene content visible through window AND monitors */}
        <Water />
        <Dock />
        <Crane />
        <Ships />
        <Effects />
      </ControlBooth>
    </Canvas>
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Scene content to render |
| `harborTheme` | string | 'industrial' | 'industrial' \| 'arctic' \| 'tropical' |
| `quality` | string | 'high' | 'low' \| 'medium' \| 'high' - Monitor resolution |
| `debug` | boolean | false | Show axes helpers and grid |

### Theme Variations

```tsx
// Industrial (default) - Dark metal, orange accents
<ControlBooth harborTheme="industrial">

// Arctic - Ice blue, cyan lighting
<ControlBooth harborTheme="arctic">

// Tropical - Sand colors, warm lighting  
<ControlBooth harborTheme="tropical">
```

## Architecture

### Render Flow

```
1. Main Camera (Player view inside booth)
   └─ Renders booth geometry + scene through window

2. RenderTexture (Each monitor)
   ├─ Hook Monitor Camera
   │  └─ Renders: Water, Dock, Crane, Ships
   ├─ Drone Monitor Camera
   │  └─ Renders: Water, Dock, Crane, Ships
   └─ Underwater Monitor Camera
      └─ Renders: Water, Dock, Crane, Ships
```

### Performance Optimization

| Quality | RenderTexture Size | Segments | Performance |
|---------|-------------------|----------|-------------|
| Low | 512×512 | 8 | ~60 FPS on integrated |
| Medium | 1024×1024 | 16 | ~60 FPS on GTX 1060 |
| High | 2048×2048 | 32 | ~60 FPS on RTX 3060 |

## Camera System

Each monitor has its own animated camera:

### Hook Cam
```tsx
// Follows crane hook with shake on bass hits
position: [spreader.x + shake.x, spreader.y - 5 + shake.y, spreader.z]
lookAt: [spreader.x, spreader.y - 10, spreader.z]
fov: 75 + audioData.bass * 5
```

### Drone Cam
```tsx
// Smooth orbit around current ship
const dronePos = dronePath.getPoint(progress)
const droneTarget = dronePath.getPoint((progress + 0.1) % 1)
position: dronePos
lookAt: droneTarget
```

### Underwater Cam
```tsx
// Gentle sway below waterline
position: [
  shipPos.x + Math.sin(time * 0.1) * 10,
  -8,
  shipPos.z + 20 + Math.cos(time * 0.08) * 5
]
lookAt: [shipPos.x, -2, shipPos.z]
```

## Customization

### Adding a Fourth Monitor

```tsx
// In ControlBooth.tsx, add to monitor section:
<Monitor
  position={[3.6, 2.5, 0]}  // Right wall
  rotation={[0, -Math.PI / 2 - 0.2, 0]}
  size={[1.8, 1.1]}
  curveRadius={4}
  label="RADAR"
  materials={materials}
  quality={quality}
>
  <PerspectiveCamera
    makeDefault={false}
    position={[50, 80, 50]}
    fov={40}
  />
  {children}
  <MonitorHUD label="RADAR" type="drone" />
</Monitor>
```

### Custom Shader Effects

The component includes CRT shader for retro monitor look:

```glsl
// Features:
- Scanlines (horizontal lines)
- Vignette (darkened edges)
- RGB shift (chromatic aberration)
- Flicker (power fluctuation)
- Color grading (warm industrial)
```

To adjust intensity:
```tsx
// In CRTShaderMaterial uniforms
uScanlineIntensity: 0.15,  // Increase for more visible scanlines
uFlickerIntensity: 0.02,   // Increase for more flicker
uVignetteIntensity: 0.3,   // Increase for darker edges
```

## Troubleshooting

### Black Monitors
- Verify `children` (scene content) is passed correctly
- Check camera position is valid
- Ensure `makeDefault={false}` on monitor cameras

### Low FPS
- Reduce `quality` prop to 'medium' or 'low'
- Simplify scene content
- Disable post-processing on scene

### Z-Fighting
- Adjust booth geometry offsets
- Enable `logarithmicDepthBuffer` in Canvas

### Window Glass Too Opaque
- Adjust `transmission` and `opacity` in `foggedGlass` material
- Reduce `roughness` for clearer glass

## Migration from v1

Old `ControlBooth.tsx` had simpler box geometry and flat monitors. To upgrade:

1. Replace file with new version
2. Update props if needed (no breaking changes)
3. Adjust `quality` based on target hardware
4. Enjoy curved monitors and realistic materials!

## Future Enhancements

- [ ] Interactive monitors (click to maximize)
- [ ] Physical button interaction
- [ ] Dynamic weather on window glass
- [ ] Volumetric lighting beams
- [ ] Animated holographic displays
- [ ] Swappable booth models (GLB/GLTF)
