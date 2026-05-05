# HarborGlow Control Booth Architecture

## Overview

The new **Control Booth** mode transforms HarborGlow from a traditional third-person view into an immersive first-person crane operator experience. The player sits inside a 3D control room with a panoramic window looking out at the dock, surrounded by live monitor feeds showing different camera angles.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTROL BOOTH LAYOUT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐                                    ┌─────────┐   │
│   │ HOOK    │    ╔════════════════════════╗      │         │   │
│   │  CAM    │    ║                        ║      │  RIGHT  │   │
│   │(Monitor)│    ║    PANORAMIC WINDOW    ║      │  WALL   │   │
│   └─────────┘    ║   (Main Scene View)    ║      │         │   │
│   ┌─────────┐    ║                        ║      └─────────┘   │
│   │ DRONE   │    ╚════════════════════════╝                     │
│   │ (Monitor│                                                  │
│   └─────────┘                     [CONTROL DESK]               │
│   LEFT WALL                                                      │
│                                                                 │
│   ┌─────────────────┐              ┌─────────────────┐         │
│   │   UNDERWATER    │              │     RADAR       │         │
│   │    (Monitor)    │              │    (Monitor)    │         │
│   └─────────────────┘              └─────────────────┘         │
│                        REAR WALL                                 │
│                                                                 │
│                        [PLAYER POSITION]                         │
│                             👤                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Files Added/Modified

### New Files

| File | Purpose |
|------|---------|
| `src/scenes/ControlBooth.tsx` | Main booth component with 4 live monitors using `<RenderTexture>` |
| `src/scenes/ControlBoothOptimized.tsx` | Alternative using `<View>` for better performance |

### Modified Files

| File | Changes |
|------|---------|
| `src/scenes/MainScene.tsx` | Added `useBooth` and `harborTheme` props; conditional rendering |
| `src/App.tsx` | Default to booth mode; theme selection based on `boothTier` |
| `src/systems/cameraSystem.ts` | Added 'booth' to `CameraMode` type |

## Architecture

### 1. RenderTexture Approach (ControlBooth.tsx)

```tsx
<Plane args={[2, 1.5]}>
  <meshStandardMaterial>
    <RenderTexture attach="map" width={1024} height={768}>
      <PerspectiveCamera makeDefault={false} position={[...]} />
      {/* Same scene content as main view */}
      <Water />
      <Dock />
      <Crane />
      <Ships />
    </RenderTexture>
  </meshStandardMaterial>
</Plane>
```

**Pros:**
- True 3D - monitors exist in the scene
- Can use any material (emissive, reflective, etc.)
- Works with post-processing

**Cons:**
- Each monitor renders the full scene again
- 4 monitors = 5x scene render cost
- Can impact performance on lower-end GPUs

### 2. View Approach (ControlBoothOptimized.tsx)

Uses drei `<View>` with scissor testing for efficient multi-view rendering.

**Pros:**
- Much better performance
- Single scene render, multiple views
- Native Three.js scissor testing

**Cons:**
- More complex setup
- Requires HTML overlays for HUD elements
- Less flexible for curved screens

## Usage

### Toggle Between Modes

```tsx
// In App.tsx or any parent component

// Immersive booth mode (default)
<MainScene useBooth={true} harborTheme="industrial" />

// Traditional standalone mode
<MainScene useBooth={false} />
```

### Harbor Themes

The booth appearance changes based on the `harborTheme` prop:

| Theme | Wall Color | Accent | Best For |
|-------|------------|--------|----------|
| `industrial` | Dark gray | Orange/Green | Default dock |
| `arctic` | Ice blue | Cyan/White | Snowy harbors |
| `tropical` | Sand beige | Orange | Sunny ports |

Themes are stored in `useGameStore.boothTier`:
- Tier 1 → `industrial`
- Tier 2 → `tropical`  
- Tier 3 → `arctic`

### Monitor Camera Modes

Each monitor has its own animated camera:

| Monitor | Camera Position | Animation |
|---------|-----------------|-----------|
| **Hook Cam** | Crane hook/spreader | Follows hook with bass shake |
| **Drone** | Orbiting ship | Smooth orbit path around current ship |
| **Underwater** | Below waterline | Gentle sway following ship |
| **Radar** | High overview | Static birds-eye view |

All cameras are beat-reactive (FOV zooms on bass hits) and inherit music sync from the main scene.

## Camera System Integration

### Main Camera (Player View)

When `useBooth=true`, the main camera is positioned inside the booth:

```tsx
// ControlBooth.tsx useEffect
camera.position.set(0, 2.5, 4.5)  // Player eye level
camera.lookAt(0, 2, -10)          // Looking out window
```

### Leva Controls

The Camera Mode dropdown now includes a 'booth' option. When selected:
- Standalone multiview is disabled (monitors replace it)
- OrbitControls are disabled (player is fixed in booth)
- Camera is locked to booth interior

## Performance Considerations

### Recommended Settings by Hardware

| GPU Tier | Approach | Monitor Resolution | Effects |
|----------|----------|-------------------|---------|
| High (RTX 3060+) | RenderTexture | 1024x768 | All on |
| Medium (GTX 1060) | RenderTexture | 512x384 | Reduced PP |
| Low (Integrated) | View (optimized) | 512x384 | Minimal |

### Optimization Tips

1. **Use `frames={1}` on RenderTexture** - Already set, renders every frame
2. **Monitor `stencilBuffer` and `depthBuffer`** - Disabled where possible
3. **Consider LOD for monitor views** - Simpler meshes at distance
4. **Use `drei/View` fallback** - Swap if FPS drops below 45

## Future Enhancements

### Planned Features

1. **Interactive Monitors** - Click to focus/maximize a camera view
2. **Physical Controls** - 3D joysticks/buttons on the desk that interact with crane
3. **Dynamic Themes** - Swap booth model entirely per harbor
4. **Reflection Probes** - Real-time reflections in window glass
5. **Volumetric Lighting** - Dust particles visible in booth light beams

### Switching Harbor Booths

```tsx
// Future implementation
<ControlBooth 
  boothModel="/models/booths/arctic_cabin.glb"
  theme="arctic"
>
  {sceneContent}
</ControlBooth>
```

## Troubleshooting

### Black Monitors

If monitors appear black:
1. Check that `children` (scene content) is being passed correctly
2. Verify camera position is valid (not inside geometry)
3. Ensure `makeDefault={false}` on monitor cameras

### Low FPS

If experiencing frame drops:
1. Switch to `ControlBoothOptimized`
2. Reduce RenderTexture resolution (512x384)
3. Disable post-processing on monitors
4. Use Leva to disable some effects

### Z-Fighting in Booth

If booth walls flicker:
1. Adjust booth geometry offsets (currently 0.2 unit thickness)
2. Enable `logarithmicDepthBuffer` in Canvas gl props

## Code Example: Custom Monitor

```tsx
// Adding a fifth monitor (ship detail cam)
<MonitorScreen
  position={[3.9, 2.5, 0]}  // Right wall center
  rotation={[0, -Math.PI / 2, 0]}
  size={[2, 1.5]}
  theme={theme}
  label="SHIP DETAIL"
>
  <PerspectiveCamera
    ref={detailCamRef}
    makeDefault={false}
    position={[shipPos.x + 10, shipPos.y + 5, shipPos.z + 10]}
    fov={35}  // Telephoto
  />
  {children}
</MonitorScreen>
```

## Migration from Old Multiview

The old `MultiviewSystem` is still available in standalone mode:

```tsx
// Old way (still works)
<MainScene useBooth={false} />
// + Leva: set Multiview Layout to 'quad'

// New way (immersive)
<MainScene useBooth={true} harborTheme="industrial" />
// Monitors replace the quad layout automatically
```

Both systems share the same camera positioning logic from `cameraSystem.ts`.
