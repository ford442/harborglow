# MonitorSystem - Quick Integration Guide

## Overview

`MonitorSystem` is a modular component that renders your existing MultiviewSystem cameras onto physical monitors inside the ControlBooth using `RenderTexture`.

```
┌────────────────────────────────────────────────────────────────┐
│                    MONITOR PLACEMENT                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐                                                 │
│  │ HOOK CAM │     WINDOW (Main View)                          │
│  │  16:9    │                                                 │
│  │          │                                                 │
│  ├──────────┤                                                 │
│  │  DRONE   │                                                 │
│  │  16:9    │                                                 │
│  │          │                                                 │
│  └──────────┘                                                 │
│                                                                │
│              ┌──────────────────┐                             │
│              │   UNDERWATER     │                             │
│              │      16:9        │                             │
│              │    (2.4m wide)   │                             │
│              └──────────────────┘                             │
│                                                                │
│                 ┌──────────┐                                  │
│                 │CRANE CAB │  ← Optional 4th monitor           │
│                 │  16:9    │     on right wall                 │
│                 └──────────┘                                  │
└────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Drop-in Replacement

Replace your current ControlBooth with the integrated version:

```tsx
// App.tsx
import ControlBoothWithMonitorSystem from './scenes/ControlBoothWithMonitorSystem'

<Canvas camera={{ position: [0, 2.2, 3.2], fov: 65 }}>
  <ControlBoothWithMonitorSystem
    harborTheme="industrial"
    quality="high"
    interactive={true}
  >
    <Water />
    <Dock />
    <Crane />
    <Ships />
  </ControlBoothWithMonitorSystem>
</Canvas>
```

### 2. Use MonitorSystem Standalone

Add monitors to your existing booth:

```tsx
// Inside your ControlBooth component
import MonitorSystem from './scenes/MonitorSystem'

<group>
  {/* Your existing booth geometry */}
  <Box ... /> {/* walls */}
  <Plane ... /> {/* window */}
  
  {/* Add the monitor system */}
  <MonitorSystem quality="high" interactive={true}>
    {children} {/* Scene content */}
  </MonitorSystem>
</group>
```

## Key Snippets

### Snippet 1: Single Monitor with RenderTexture

```tsx
import { RenderTexture, PerspectiveCamera } from '@react-three/drei'

<mesh position={[-3.6, 3, -0.5]} rotation={[0, Math.PI/2, 0]}>
  {/* Screen plane - aspect ratio 16:9 */}
  <planeGeometry args={[1.6, 0.9]} />
  
  <meshPhysicalMaterial
    metalness={0.1}
    roughness={0.2}
    clearcoat={1}
  >
    <RenderTexture
      attach="map"
      width={2048}
      height={1152}  // 2048 / (16/9) = 1152
      frames={1}     // Update every frame
    >
      {/* Camera inside the texture */}
      <PerspectiveCamera
        makeDefault={false}
        position={[0, 10, 0]}
        fov={75}
        near={0.1}
        far={2000}
        aspect={16/9}
      />
      
      {/* Scene content */}
      <Water />
      <Dock />
      <Crane />
      
    </RenderTexture>
  </meshPhysicalMaterial>
</mesh>
```

### Snippet 2: Camera Animation Hook

```tsx
const hookCamRef = useRef<THREE.PerspectiveCamera>(null)
const { audioData } = useAudioVisualSync()

useFrame(() => {
  if (hookCamRef.current) {
    // Position at crane hook
    hookCamRef.current.position.set(
      spreaderPos.x,
      spreaderPos.y - 5,
      spreaderPos.z
    )
    hookCamRef.current.lookAt(
      spreaderPos.x,
      spreaderPos.y - 10,
      spreaderPos.z
    )
    
    // Beat-reactive FOV
    hookCamRef.current.fov = 75 + audioData.bass * 5
    hookCamRef.current.updateProjectionMatrix()
  }
})

// In JSX:
<PerspectiveCamera ref={hookCamRef} makeDefault={false} ... />
```

### Snippet 3: Underwater Camera Setup

```tsx
const underwaterCamRef = useRef<THREE.PerspectiveCamera>(null)

useFrame((state) => {
  if (underwaterCamRef.current && currentShip) {
    const time = state.clock.elapsedTime
    const shipPos = new THREE.Vector3(...currentShip.position)
    
    underwaterCamRef.current.position.set(
      shipPos.x + Math.sin(time * 0.1) * 12,  // Gentle sway
      -5,                                      // Below water
      shipPos.z + 15 + Math.cos(time * 0.08) * 8
    )
    
    // Look up at ship from below
    underwaterCamRef.current.lookAt(
      shipPos.x,
      0,  // Water level
      shipPos.z
    )
  }
})
```

### Snippet 4: Aspect Ratio Helper

```tsx
// Ensure texture dimensions match monitor aspect ratio
function getTextureDimensions(monitorWidth: number, aspectRatio: number, maxSize: number) {
  const width = maxSize
  const height = Math.round(maxSize / aspectRatio)
  return [width, height]
}

// Usage:
const [texW, texH] = getTextureDimensions(1.6, 16/9, 2048)
// Returns: [2048, 1152]

<RenderTexture width={texW} height={texH} ... />
```

### Snippet 5: Fallback / Loading State

```tsx
const [isReady, setIsReady] = useState(false)
const fallbackTexture = useMonitorFallback() // From MonitorSystem.tsx

useFrame(() => {
  if (!isReady && cameraRef.current) {
    setIsReady(true)
  }
})

<mesh>
  <planeGeometry ... />
  <meshPhysicalMaterial
    map={isReady ? undefined : fallbackTexture}
    ...
  >
    {isReady && (
      <RenderTexture attach="map" ...>
        ...
      </RenderTexture>
    )}
  </meshPhysicalMaterial>
</mesh>
```

### Snippet 6: Click to Enlarge (Zustand Integration)

```tsx
// store.ts - Add to your game store
interface GameState {
  enlargedMonitor: string | null
  setEnlargedMonitor: (id: string | null) => void
}

// In Monitor component:
const enlargedMonitor = useGameStore(s => s.enlargedMonitor)
const setEnlargedMonitor = useGameStore(s => s.setEnlargedMonitor)

<mesh 
  onClick={() => setEnlargedMonitor(id)}
  onPointerOver={() => setHovered(true)}
  onPointerOut={() => setHovered(false)}
  scale={enlargedMonitor === id ? 1.1 : hovered ? 1.02 : 1}
>
  ...
</mesh>

// Or with Leva:
useControls({
  'Monitor View': {
    value: 'window',
    options: ['window', 'hook', 'drone', 'underwater', 'crane'],
    onChange: (view) => setEnlargedMonitor(view === 'window' ? null : view)
  }
})
```

### Snippet 7: Monitor HUD Overlay

```tsx
// Inside RenderTexture, overlay UI on the camera view
function MonitorHUD({ label, color }: { label: string; color: string }) {
  return (
    <>
      {/* Corner brackets */}
      <mesh position={[-3.2, 2.2, -5]}>
        <planeGeometry args={[0.3, 0.03]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Recording dot */}
      <mesh position={[3, 2.5, -5]}>
        <circleGeometry args={[0.06]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      
      {/* Crosshair */}
      <group position={[0, 0, -5]}>
        <mesh><planeGeometry args={[0.3, 0.015]} /></mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.015]} />
        </mesh>
      </group>
    </>
  )
}

// Use inside RenderTexture:
<RenderTexture ...>
  <PerspectiveCamera ... />
  {sceneContent}
  <MonitorHUD label="HOOK CAM" color="#ff6600" />
</RenderTexture>
```

## Camera Position Reference

| Camera | Position | LookAt | Notes |
|--------|----------|--------|-------|
| **CraneCab** | `[sin(rot)*18, 24, cos(rot)*8]` | Ship center +5y | Match crane rotation |
| **Hook** | `[spreader.x, spreader.y-5, spreader.z]` | Down from hook | Add shake on bass |
| **Drone** | Orbit path point | Next path point | Smooth CatmullRom curve |
| **Underwater** | `[ship.x + sway, -5, ship.z + sway]` | Ship waterline | Sway with sin/cos |

## Performance Tuning

```tsx
// Quality presets
const qualitySettings = {
  low:    { textureSize: 512,  fboCount: 1 },
  medium: { textureSize: 1024, fboCount: 1 },
  high:   { textureSize: 2048, fboCount: 1 },
  ultra:  { textureSize: 4096, fboCount: 2 } // FBO pooling
}

// Use lower quality for monitors far from player
<MonitorSystem quality="medium" />  // Side monitors
<MonitorSystem quality="high" />    // Rear large monitor

// Or dynamically based on FPS:
const [quality, setQuality] = useState('high')
useFrame(() => {
  if (gl.info.render.frame % 60 === 0) {
    const fps = 1000 / gl.info.render.delta
    if (fps < 30) setQuality('medium')
    else if (fps > 55) setQuality('high')
  }
})
```

## Migration from MultiviewSystem

### Before (MultiviewSystem):
```tsx
// MultiviewSystem.tsx
<MultiviewSystem enabled={multiviewMode === 'quad'} />
// Renders 4 views as HTML overlays
```

### After (MonitorSystem):
```tsx
// In ControlBooth
<MonitorSystem quality="high" interactive>
  {children}
</MonitorSystem>
// Renders 4 views as 3D monitor screens

// Remove multiview UI from Leva:
// Delete: 'Multiview Layout': { options: ['single', 'quad'] }
```

## Files

| File | Purpose |
|------|---------|
| `MonitorSystem.tsx` | Main component with 4 cameras and monitors |
| `ControlBoothWithMonitorSystem.tsx` | Drop-in booth with integrated monitors |
| `MONITOR_SYSTEM_GUIDE.md` | This documentation |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Monitors black | Check `makeDefault={false}` on cameras |
| Aspect stretched | Calculate height = width / aspectRatio |
| Low FPS | Reduce textureSize to 1024 or 512 |
| Cameras not moving | Ensure camera refs are passed correctly |
| Click not working | Add `interactive={true}` prop |
| Z-fighting | Move monitor 0.001 units off wall |
