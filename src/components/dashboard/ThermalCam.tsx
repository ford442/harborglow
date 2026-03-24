// =============================================================================
// THERMAL CAM — Thermal imaging view with hull temperature and hotspots
// =============================================================================

interface ThermalCamProps {
  hullTemp: number
  hotspots: { x: number; y: number; intensity: number }[]
  weather: string
  iceBuildup: number
}

export default function ThermalCam({ hullTemp, hotspots, weather, iceBuildup }: ThermalCamProps) {
  const ambientTemp = weather === 'storm' ? -35 : weather === 'rain' ? -10 : -20
  const adjustedHullTemp = hullTemp + (ambientTemp + 20) * 0.3

  return (
    <div
      className="cam-feed thermal-cam"
      style={{
        filter:
          iceBuildup > 0
            ? `hue-rotate(${iceBuildup * 30}deg) contrast(${1 - iceBuildup * 0.2})`
            : undefined,
      }}
    >
      <div className="thermal-view">
        <div className="thermal-bg">
          <div
            className="ship-thermal-silhouette"
            style={{
              background: `linear-gradient(180deg,
                rgba(${adjustedHullTemp < -10 ? '0,100,150' : adjustedHullTemp < 0 ? '50,150,200' : '100,200,255'},0.4) 0%,
                rgba(0,60,100,0.6) 100%)`,
            }}
          />

          {hotspots.map((spot, i) => (
            <div
              key={i}
              className="thermal-hotspot"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                opacity: spot.intensity * (1 - iceBuildup * 0.5),
                boxShadow: `0 0 ${20 * spot.intensity}px ${10 * spot.intensity}px rgba(255, ${100 + spot.intensity * 100}, 0, ${spot.intensity})`,
              }}
            >
              <div className="hotspot-pulse" />
            </div>
          ))}

          {weather === 'storm' && (
            <>
              {[20, 50, 80].map((xPct, i) => (
                <div
                  key={`cold-${i}`}
                  className="thermal-coldspot"
                  style={{ left: `${xPct}%`, top: '65%' }}
                >
                  <div className="coldspot-indicator" />
                </div>
              ))}
            </>
          )}
        </div>

        <div className="thermal-scale">
          <div className="scale-gradient" />
          <div className="scale-labels">
            <span>-40°C</span>
            <span>-20°C</span>
            <span>0°C</span>
            <span>+20°C</span>
          </div>
        </div>
      </div>

      <div className="data-overlay arctic">
        <div className="data-row">
          <span className="data-label">HULL</span>
          <span
            className="data-value"
            style={{
              color:
                adjustedHullTemp < -15
                  ? '#0088ff'
                  : adjustedHullTemp < 0
                  ? '#00ccff'
                  : '#ff8844',
            }}
          >
            {adjustedHullTemp.toFixed(0)}°C
          </span>
        </div>

        <div className="data-row">
          <span className="data-label">HOTSPOTS</span>
          <span className="data-value arctic-cyan">{hotspots.length} DETECTED</span>
        </div>

        {iceBuildup > 0 && (
          <div className="data-row">
            <span className="data-label">ICE</span>
            <span className="data-value arctic-white">THERMAL MASK</span>
          </div>
        )}
      </div>
    </div>
  )
}
