import { useState, useEffect } from 'react'

// =============================================================================
// HEATED WINDOW — Arctic window with live frost/defrost simulation
// =============================================================================

interface HeatedWindowProps {
  heaterActive: boolean
  frostLevel: number
}

export default function HeatedWindow({ heaterActive, frostLevel }: HeatedWindowProps) {
  const [currentFrost, setCurrentFrost] = useState(frostLevel)

  useEffect(() => {
    const targetFrost = heaterActive ? 0 : frostLevel
    const interval = setInterval(() => {
      setCurrentFrost(prev => {
        const diff = targetFrost - prev
        const speed = heaterActive ? 0.05 : 0.01
        if (Math.abs(diff) < 0.01) return targetFrost
        return prev + diff * speed
      })
    }, 100)
    return () => clearInterval(interval)
  }, [heaterActive, frostLevel])

  return (
    <div className={`heated-window ${heaterActive ? 'heater-on' : ''}`}>
      <div className="window-glass" />

      <div className="frost-layer" style={{ opacity: currentFrost }}>
        <div className="frost-texture" />
      </div>

      <div className={`defrost-grid ${heaterActive ? 'active' : ''}`}>
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="grid-line horizontal"
            style={{
              top: `${(i + 1) * 12}%`,
              opacity: heaterActive ? 1 : 0.3,
            }}
          />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={`v-${i}`}
            className="grid-line vertical"
            style={{
              left: `${(i + 1) * 10}%`,
              opacity: heaterActive ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      {heaterActive && currentFrost > 0.1 && (
        <div className="heater-indicator">
          <span className="heat-icon">🔥</span>
          <span className="heat-text">DEFROSTING</span>
        </div>
      )}
    </div>
  )
}
