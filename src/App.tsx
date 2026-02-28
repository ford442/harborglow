import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Leva } from 'leva'
import MainScene from './scenes/MainScene'
import HUD from './components/HUD'
import UpgradeMenu from './components/UpgradeMenu'
import CraneControls from './components/CraneControls'
import LyricsOverlay from './components/LyricsOverlay'
import WebGPUWarning from './components/WebGPUWarning'
import { useGameStore } from './store/useGameStore'

/**
 * App — root component.
 * Sets up the WebGPU Canvas, Physics world, and all UI overlays.
 * The Canvas uses the `gl` async prop to initialise WebGPURenderer.
 */
export default function App() {
  const upgradeMenuOpen = useGameStore((s) => s.upgradeMenuOpen)

  return (
    <div className="relative w-full h-full bg-[#060d18]">
      {/* Leva debug panel — top-right corner */}
      <Leva
        collapsed
        theme={{
          colors: {
            accent1: '#00e5ff',
            accent2: '#006080',
            accent3: '#003344',
            elevation1: '#060d18',
            elevation2: '#0c1a2e',
            elevation3: '#1a2e44',
          },
        }}
      />

      {/* WebGPU 3-D Canvas */}
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 30, 80], fov: 55 }}
        gl={async (canvas) => {
          // Dynamically import WebGPURenderer so non-WebGPU builds still work
          const { default: WebGPURenderer } = await import('three/webgpu')
          const renderer = new WebGPURenderer({ canvas, antialias: true })
          await renderer.init()
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          return renderer
        }}
        shadows
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]} debug={false}>
            <MainScene />
          </Physics>
        </Suspense>
      </Canvas>

      {/* 2-D UI Overlays */}
      <WebGPUWarning />
      <HUD />
      <CraneControls />
      {upgradeMenuOpen && <UpgradeMenu />}
      <LyricsOverlay />
    </div>
  )
}
