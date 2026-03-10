import { useEffect } from 'react'
import ShipSpawner from './ShipSpawner'
import UpgradeMenu from './UpgradeMenu'
import LyricsDisplay from './LyricsDisplay'
import ShipVersionDisplay from './ShipVersionDisplay'
import CraneControls from './CraneControls'
import { injectDesignSystem } from './DesignSystem'

export default function HUD() {
  // Inject design system animations on mount
  useEffect(() => {
    injectDesignSystem()
  }, [])

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 100,
      fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif'
    }}>
      <ShipSpawner />
      <UpgradeMenu />
      <LyricsDisplay />
      <ShipVersionDisplay />
      <CraneControls />
      
      {/* Enhanced Crane Dashboard Hotkey Hint */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.6)',
        fontFamily: '"JetBrains Mono", monospace',
        border: '1px solid rgba(255,255,255,0.1)',
        letterSpacing: '0.5px'
      }}>
        <span style={{ color: '#00ff88', fontWeight: 600 }}>[TAB]</span>
        <span style={{ marginLeft: '6px' }}>Toggle 4th Monitor</span>
      </div>
    </div>
  )
}
