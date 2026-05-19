/**
 * COMPLETE INTEGRATION EXAMPLE
 * Shows how to use ControlBoothSwappable with harbor switching
 */

import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect } from 'react'
import { Leva, useControls } from 'leva'
import { useGameStore } from '../store/useGameStore'
import { harborList, getHarborTheme, type HarborType } from '../store/harborThemes'
import ControlBoothSwappable from './ControlBoothSwappable'

// Your existing scene components
import Water from './Water'
import Dock from './Dock'
import Crane from './Crane'
import Ship from './Ship'

// =============================================================================
// MAIN APP WITH SWAPPABLE BOOTH
// =============================================================================

export default function AppWithSwappableBooth() {
  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 2.2, 3.2], fov: 65 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
      >
        <Suspense fallback={<LoadingScene />}>
          <Physics gravity={[0, -9.81, 0]}>
            <GameScene />
          </Physics>
        </Suspense>
      </Canvas>
      
      <Leva 
        collapsed 
        titleBar={{ title: 'Harbor Controls' }}
      />
      
      <HarborUI />
    </>
  )
}

// =============================================================================
// GAME SCENE - Inside Swappable Booth
// =============================================================================

function GameScene() {
  const isNight = useGameStore(state => state.isNight)
  const ships = useGameStore(state => state.ships)
  const currentHarbor = useGameStore(state => state.currentHarbor)
  
  // Leva controls for harbor switching
  useControls({
    '🌊 Current Harbor': {
      value: currentHarbor,
      options: harborList.reduce((acc, h) => ({ 
        ...acc, 
        [h.name]: h.id 
      }), {}),
      onChange: (value: HarborType) => {
        useGameStore.getState().setCurrentHarbor(value)
      }
    }
  })
  
  return (
    <ControlBoothSwappable quality="high" debug={false}>
      {/* Scene content - gets harbor-specific variations via store */}
      <HarborSceneContent 
        isNight={isNight} 
        ships={ships}
        harbor={currentHarbor}
      />
    </ControlBoothSwappable>
  )
}

// =============================================================================
// HARBOR-SPECIFIC SCENE CONTENT
// =============================================================================

function HarborSceneContent({ 
  isNight, 
  ships, 
  harbor 
}: { 
  isNight: boolean
  ships: any[]
  harbor: HarborType 
}) {
  const theme = getHarborTheme(harbor)
  
  return (
    <>
      {/* Lighting that matches booth theme */}
      <ambientLight 
        color={theme.ambientLight.color} 
        intensity={isNight ? theme.ambientLight.intensity * 0.5 : theme.ambientLight.intensity} 
      />
      
      <directionalLight
        position={[50, 50, 20]}
        color={theme.directionalLight.color}
        intensity={isNight ? theme.directionalLight.intensity * 0.4 : theme.directionalLight.intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Harbor-specific water */}
      <Water 
        isNight={isNight}
      />
      
      {/* Harbor-specific dock */}
      <Dock 
        isNight={isNight}
      />
      
      {/* Crane (universal) */}
      <Crane />
      
      {/* Effects matching harbor vibe */}
      {theme.hasSteam && <SteamEffect />}
      {theme.hasDustMotes && <DustMotesEffect color={theme.accentColor} />}
      
      {/* Ships */}
      {ships.map(ship => (
        <Ship key={ship.id} ship={ship} />
      ))}
    </>
  )
}

// =============================================================================
// HARBOR-SPECIFIC HELPERS
// =============================================================================

function getWaterColor(harbor: HarborType): string {
  switch (harbor) {
    case 'norway': return '#4a6a8a'      // Cold arctic water
    case 'singapore': return '#1a3a5a'   // Deep tropical
    case 'dubai': return '#2a8aaa'       // Clear turquoise
    case 'rotterdam': return '#5a6a7a'   // Grey North Sea
    case 'yokohama': return '#3a5a6a'    // Pacific blue
    case 'longbeach': return '#2a7a9a'   // California blue
    case 'santos': return '#2a6a5a'      // Green Amazon
    default: return '#4a6a8a'
  }
}

function getDockColor(harbor: HarborType): string {
  switch (harbor) {
    case 'norway': return '#5a6a7a'      // Weathered grey
    case 'singapore': return '#2a2a3a'   // High-tech dark
    case 'dubai': return '#e8d8c0'       // Sandstone
    case 'rotterdam': return '#6a7a8a'   // Industrial steel
    case 'yokohama': return '#4a4a5a'    // Dark slate
    case 'longbeach': return '#8a7a6a'   // Weathered wood
    case 'santos': return '#5a7a6a'      // Jungle green
    default: return '#5a6a7a'
  }
}

// =============================================================================
// EFFECTS COMPONENTS
// =============================================================================

function SteamEffect() {
  // Simplified steam particles
  return (
    <group position={[0, 1, -5]}>
      {/* Could use ParticleSystem or instanced mesh */}
    </group>
  )
}

function DustMotesEffect({ color }: { color: string }) {
  // Floating particles matching accent color
  return (
    <group>
      {/* Could use drei/Float or ParticleSystem */}
    </group>
  )
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

function HarborUI() {
  const currentHarbor = useGameStore(state => state.currentHarbor)
  const theme = getHarborTheme(currentHarbor)
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      padding: '16px 24px',
      background: 'rgba(0,0,0,0.7)',
      borderRadius: '12px',
      border: `2px solid ${theme.accentColor}`,
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      backdropFilter: 'blur(10px)',
      zIndex: 100
    }}>
      <div style={{ 
        fontSize: '11px', 
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: theme.accentColor,
        marginBottom: '4px'
      }}>
        Current Harbor
      </div>
      <div style={{ 
        fontSize: '18px', 
        fontWeight: 'bold',
        marginBottom: '8px'
      }}>
        {theme.name}
      </div>
      <div style={{ 
        fontSize: '13px', 
        color: '#aaa',
        maxWidth: '250px',
        lineHeight: '1.4'
      }}>
        {theme.description}
      </div>
      
      {/* Theme indicator dots */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        marginTop: '12px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: theme.accentColor,
          boxShadow: `0 0 8px ${theme.accentColor}`
        }} title="Accent Color" />
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: theme.wallColor
        }} title="Wall Color" />
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: theme.windowTint
        }} title="Window Tint" />
      </div>
    </div>
  )
}

function LoadingScene() {
  return (
    <mesh>
      <boxGeometry />
      <meshBasicMaterial color={0x2a2a35} wireframe />
    </mesh>
  )
}

// =============================================================================
// QUICK START INSTRUCTIONS
// =============================================================================

/*

1. UPDATE YOUR STORE (useGameStore.ts):
   - Add: currentHarbor: HarborType
   - Add: setCurrentHarbor: (harbor: HarborType) => void

2. COPY FILES:
   - Copy harborThemes.ts to store/
   - Copy ControlBoothSwappable.tsx to scenes/
   - Copy this file for reference

3. UPDATE App.tsx:
   
   import ControlBoothSwappable from './scenes/ControlBoothSwappable'
   
   <Canvas camera={{ position: [0, 2.2, 3.2], fov: 65 }}>
     <ControlBoothSwappable quality="high">
       <Water />
       <Dock />
       <Crane />
       <Ships />
     </ControlBoothSwappable>
   </Canvas>

4. ADD LEVA CONTROLS:
   
   import { harborList } from './store/harborThemes'
   
   useControls({
     'Current Harbor': {
       value: currentHarbor,
       options: harborList.reduce((acc, h) => ({ 
         ...acc, 
         [h.name]: h.id 
       }), {}),
       onChange: setCurrentHarbor
     }
   })

5. SWITCH HARBORS PROGRAMMATICALLY:
   
   const setCurrentHarbor = useGameStore(s => s.setCurrentHarbor)
   
   // Switch to Singapore
   setCurrentHarbor('singapore')
   
   // Switch to Norway
   setCurrentHarbor('norway')

6. CUSTOMIZE THEMES:
   Edit harborThemes.ts to adjust colors, lighting, effects per harbor.

*/
