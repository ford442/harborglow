# Asset Preloading & Booth Model Swapping Guide

## Overview

This guide covers how to preload assets and swap full 3D booth models per harbor using `useGLTF` and asset management.

## Current System (Procedural)

Currently, the booth is procedural - materials change but geometry stays the same:

```tsx
// ControlBoothSwappable.tsx
const theme = getHarborTheme(currentHarbor)
// Changes: materials, lights, fog, envMap
// Same: geometry (boxes, planes)
```

## Future System (GLTF Models)

### 1. Asset Structure

```
public/
├── booths/
│   ├── norway_booth.glb       # Arctic cabin style
│   ├── singapore_booth.glb    # High-tech sci-fi
│   ├── dubai_booth.glb        # Luxury gold/marble
│   ├── rotterdam_booth.glb    # Industrial warehouse
│   ├── yokohama_booth.glb     # Japanese fusion
│   ├── longbeach_booth.glb    # California surf shack
│   └── santos_booth.glb       # Tropical rainforest
```

### 2. Preloading Hook

```tsx
// hooks/usePreloadBooths.ts
import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import type { HarborType } from '../store/harborThemes'

const boothUrls: Record<HarborType, string> = {
  norway: '/booths/norway_booth.glb',
  singapore: '/booths/singapore_booth.glb',
  dubai: '/booths/dubai_booth.glb',
  rotterdam: '/booths/rotterdam_booth.glb',
  yokohama: '/booths/yokohama_booth.glb',
  longbeach: '/booths/longbeach_booth.glb',
  santos: '/booths/santos_booth.glb',
}

export function usePreloadBooths() {
  useEffect(() => {
    // Preload all booth models in background
    Object.values(boothUrls).forEach(url => {
      useGLTF.preload(url)
    })
  }, [])
}

export function useBoothModel(harbor: HarborType) {
  const url = boothUrls[harbor]
  const { scene } = useGLTF(url)
  
  // Clone scene for independent manipulation
  const boothScene = useMemo(() => scene.clone(), [scene])
  
  return boothScene
}
```

### 3. ControlBooth with GLTF Models

```tsx
// scenes/ControlBoothGLTF.tsx
import { useBoothModel, usePreloadBooths } from '../hooks/usePreloadBooths'
import { useGameStore } from '../store/useGameStore'
import { getHarborTheme } from '../store/harborThemes'

export default function ControlBoothGLTF({ children }: { children: React.ReactNode }) {
  // Preload all booths on mount
  usePreloadBooths()
  
  const currentHarbor = useGameStore(state => state.currentHarbor)
  const theme = getHarborTheme(currentHarbor)
  
  // Load current booth model
  const boothModel = useBoothModel(currentHarbor)
  
  // Apply theme materials to loaded model
  useEffect(() => {
    boothModel.traverse((child) => {
      if (child.isMesh) {
        // Apply theme colors based on mesh name
        switch (child.name) {
          case 'walls':
            child.material.color.set(theme.wallColor)
            child.material.metalness = theme.metalness
            child.material.roughness = theme.roughness
            break
          case 'window_glass':
            child.material.color.set(theme.windowTint)
            child.material.opacity = theme.windowOpacity
            break
          case 'control_panel':
            child.material.emissive.set(theme.accentColor)
            child.material.emissiveIntensity = theme.panelIntensity
            break
        }
      }
    })
  }, [boothModel, theme])
  
  return (
    <>
      {/* Loaded booth model */}
      <primitive object={boothModel} />
      
      {/* Monitor system attached to booth */}
      <MonitorSystem quality="high" theme={theme}>
        {children}
      </MonitorSystem>
      
      {/* Main scene visible through window */}
      <group position={[0, 0, -15]}>
        {children}
      </group>
    </>
  )
}
```

### 4. GLTF Model Requirements

Each booth GLB should have named meshes:

```
booth_model.glb
├── walls (Mesh) - Main room structure
├── floor (Mesh) - Floor surface  
├── ceiling (Mesh) - Ceiling with lights
├── window_frame (Mesh) - Window surround
├── window_glass (Mesh) - Transparent glass
├── control_desk (Mesh) - Main console
├── monitor_hook (Mesh) - Screen for hook cam
├── monitor_drone (Mesh) - Screen for drone
├── monitor_underwater (Mesh) - Screen for underwater
└── props (Group) - Any decorative props
```

### 5. Progressive Loading Strategy

```tsx
// hooks/useProgressiveBoothLoad.ts
import { useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

export function useProgressiveBoothLoad(harbor: HarborType) {
  const [isReady, setIsReady] = useState(false)
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    setIsReady(false)
    setProgress(0)
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setIsReady(true)
          return 100
        }
        return p + 10
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [harbor])
  
  return { isReady, progress }
}

// Usage with loading screen
function ControlBoothWithLoader({ children }) {
  const currentHarbor = useGameStore(state => state.currentHarbor)
  const { isReady, progress } = useProgressiveBoothLoad(currentHarbor)
  
  if (!isReady) {
    return <LoadingScreen progress={progress} harbor={currentHarbor} />
  }
  
  return <ControlBoothGLTF>{children}</ControlBoothGLTF>
}
```

### 6. Memory Management

```tsx
// Clear unused booth models from cache
import { useGLTF } from '@react-three/drei'

export function clearBoothCache(exceptHarbor?: HarborType) {
  const allHarbors: HarborType[] = [
    'norway', 'singapore', 'dubai', 'rotterdam', 
    'yokohama', 'longbeach', 'santos'
  ]
  
  allHarbors.forEach(harbor => {
    if (harbor !== exceptHarbor) {
      const url = boothUrls[harbor]
      useGLTF.clear([url])
    }
  })
}

// Use in component
useEffect(() => {
  return () => {
    // Clear cache when switching (keep only current)
    clearBoothCache(currentHarbor)
  }
}, [currentHarbor])
```

### 7. Hybrid Approach (Recommended)

For now, use procedural geometry with texture swapping:

```tsx
// scenes/ControlBoothHybrid.tsx
import { useTexture } from '@react-three/drei'

const wallTextures: Record<HarborType, string> = {
  norway: '/textures/walls/norway_metal.jpg',
  singapore: '/textures/walls/singapore_tech.jpg',
  dubai: '/textures/walls/dubai_marble.jpg',
  // ...
}

export default function ControlBoothHybrid({ children }) {
  const currentHarbor = useGameStore(state => state.currentHarbor)
  const theme = getHarborTheme(currentHarbor)
  
  // Load wall texture for current harbor
  const wallTexture = useTexture(wallTextures[currentHarbor])
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
  
  return (
    <group>
      {/* Walls with texture */}
      <Box args={[0.3, 4, 8]} position={[-3.85, 2, 0]}>
        <meshStandardMaterial 
          map={wallTexture}
          color={theme.wallColor}
          metalness={theme.metalness}
          roughness={theme.roughness}
        />
      </Box>
      
      {/* ... rest of booth ... */}
    </group>
  )
}
```

### 8. Leva Integration for Testing

```tsx
// Leva controls for booth switching
import { harborList, getHarborTheme } from '../store/harborThemes'

function BoothControls() {
  const currentHarbor = useGameStore(state => state.currentHarbor)
  const setCurrentHarbor = useGameStore(state => state.setCurrentHarbor)
  const theme = getHarborTheme(currentHarbor)
  
  useControls({
    'Current Harbor': {
      value: currentHarbor,
      options: harborList.reduce((acc, h) => ({ 
        ...acc, 
        [h.name]: h.id 
      }), {}),
      onChange: setCurrentHarbor
    },
    'Booth Info': {
      value: `${theme.name}\n${theme.description}`,
      editable: false
    }
  })
  
  return null
}
```

### 9. Asset Checklist for Full Models

Per harbor, you'll need:

- [ ] `booth_{harbor}.glb` - Main booth geometry
- [ ] `wall_{harbor}.jpg/png` - Wall texture (optional)
- [ ] `floor_{harbor}.jpg/png` - Floor texture (optional)
- [ ] `props_{harbor}.glb` - Decorative props (optional)

Total: ~7-14MB per harbor (compressed GLB)

### 10. Performance Budget

| Asset Type | Target Size | Total |
|------------|-------------|-------|
| Booth GLB | 2-4 MB | 14-28 MB |
| Textures | 512-1024px | ~7 MB |
| Environment | 1K-2K | ~5 MB |
| **Total** | | **~40 MB** |

### Migration Path

1. **Phase 1** (Current): Procedural geometry + theme materials ✅
2. **Phase 2**: Add texture support for walls/floors
3. **Phase 3**: Load simple prop GLBs (chairs, plants, etc.)
4. **Phase 4**: Full booth GLB per harbor

```tsx
// App.tsx - Choose implementation
import ControlBoothSwappable from './scenes/ControlBoothSwappable'  // Phase 1
// import ControlBoothHybrid from './scenes/ControlBoothHybrid'     // Phase 2-3
// import ControlBoothGLTF from './scenes/ControlBoothGLTF'         // Phase 4

<Canvas>
  <ControlBoothSwappable quality="high">
    <SceneContent />
  </ControlBoothSwappable>
</Canvas>
```
