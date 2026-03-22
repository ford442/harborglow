/**
 * ControlBooth Usage Example
 * 
 * This file demonstrates how to integrate the ControlBooth into your app.
 */

import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { Leva } from 'leva'
import { useGameStore } from '../store/useGameStore'
import ControlBooth from './ControlBooth'

// Import your existing scene components
import Water from './Water'
import Dock from './Dock'
import Crane from './Crane'
import Ship from './Ship'
import GlobalIllumination from './GlobalIllumination'
import AudioReactiveLightShow from './AudioReactiveLightShow'
import PostProcessing from './PostProcessing'

// =============================================================================
// EXAMPLE 1: Using ControlBooth directly in App.tsx
// =============================================================================

export function AppWithControlBooth() {
  const isNight = useGameStore(state => state.isNight)
  const ships = useGameStore(state => state.ships)
  const boothTier = useGameStore(state => state.boothTier)
  
  // Map booth tier to theme
  const harborTheme = boothTier === 3 ? 'arctic' : boothTier === 2 ? 'tropical' : 'industrial'
  
  return (
    <>
      <Canvas
        shadows
        camera={{ 
          position: [0, 2.2, 3.2], // Initial position inside booth
          fov: 65 
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            {/* ControlBooth wraps the scene content */}
            <ControlBooth 
              harborTheme={harborTheme}
              quality="high"
              debug={false}
            >
              {/* All your scene content goes here */}
              <SceneContent isNight={isNight} ships={ships} />
            </ControlBooth>
          </Physics>
        </Suspense>
      </Canvas>
      
      <Leva collapsed titleBar={{ title: 'Harbor Controls' }} />
    </>
  )
}

// =============================================================================
// EXAMPLE 2: Using ControlBooth with MainScene
// =============================================================================

interface MainSceneWithBoothProps {
  /** Enable the immersive booth view */  
  useBooth?: boolean
  /** Harbor theme */  
  harborTheme?: 'industrial' | 'arctic' | 'tropical'
  /** Monitor quality preset */
  quality?: 'low' | 'medium' | 'high'
}

export function MainSceneWithBooth({ 
  useBooth = true, 
  harborTheme = 'industrial',
  quality = 'high'
}: MainSceneWithBoothProps) {
  const isNight = useGameStore(state => state.isNight)
  const ships = useGameStore(state => state.ships)
  
  // Scene content that will be rendered both in booth window and monitors
  const sceneContent = (
    <>
      <Lighting isNight={isNight} />
      <Water isNight={isNight} />
      <Dock isNight={isNight} />
      <Crane />
      <GlobalIllumination enabled quality="high" />
      <AudioReactiveLightShow enabled />
      <PostProcessing enabled audioData={{ bass: 0.5, mid: 0.3, treble: 0.4 }} />
      
      {ships.map(ship => (
        <Ship key={ship.id} ship={ship} />
      ))}
    </>
  )
  
  if (useBooth) {
    return (
      <ControlBooth 
        harborTheme={harborTheme}
        quality={quality}
      >
        {sceneContent}
      </ControlBooth>
    )
  }
  
  // Fallback to traditional view
  return sceneContent
}

// =============================================================================
// SCENE CONTENT COMPONENT
// =============================================================================

function SceneContent({ isNight, ships }: { isNight: boolean; ships: any[] }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isNight ? 0.1 : 0.6} color={isNight ? '#1a1a2e' : '#ffffff'} />
      <directionalLight
        position={[50, 50, 20]}
        intensity={isNight ? 0.3 : 1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Scene objects */}
      <Water isNight={isNight} />
      <Dock isNight={isNight} />
      <Crane />
      
      {/* Effects */}
      <GlobalIllumination enabled quality="high" />
      <AudioReactiveLightShow enabled />
      
      {/* Ships */}
      {ships.map(ship => (
        <Ship key={ship.id} ship={ship} />
      ))}
    </>
  )
}

function Lighting({ isNight }: { isNight: boolean }) {
  return (
    <>
      <ambientLight intensity={isNight ? 0.1 : 0.6} color={isNight ? '#1a1a2e' : '#ffffff'} />
      <directionalLight
        position={[50, 50, 20]}
        intensity={isNight ? 0.3 : 1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
    </>
  )
}

// =============================================================================
// EXAMPLE 3: Camera Mode Toggle
// =============================================================================

/*
In your camera system or Leva controls:

useControls({
  'Camera Mode': {
    value: 'booth',
    options: ['orbit', 'crane-cockpit', 'booth', 'spectator'],
    onChange: (mode) => {
      if (mode === 'booth') {
        // Camera will be auto-positioned inside booth by ControlBooth component
        setCameraMode('booth')
      } else {
        setCameraMode(mode)
      }
    }
  }
})
*/

// =============================================================================
// EXAMPLE 4: Theming
// =============================================================================

/*
Change booth appearance based on harbor:

// In your store or App.tsx
const boothTheme = {
  'singapore': 'tropical',
  'rotterdam': 'industrial', 
  'longyearbyen': 'arctic',
  'dubai': 'industrial'
}[currentHarbor] || 'industrial'

<ControlBooth harborTheme={boothTheme}>
  {sceneContent}
</ControlBooth>
*/

export default AppWithControlBooth
