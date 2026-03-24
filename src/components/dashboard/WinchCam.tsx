// =============================================================================
// WINCH CAM — Cable drum and tension gauge feed
// =============================================================================

interface WinchCamProps {
  cableLength: number
  tension: number
  isMoving: boolean
}

export default function WinchCam({ cableLength, tension, isMoving }: WinchCamProps) {
  const tensionColor = tension > 30 ? '#ff4444' : tension > 20 ? '#ffcc00' : '#00ccff'

  return (
    <div className="cam-feed winch-cam arctic">
      <div className="winch-view">
        <div className={`cable-drum arctic ${isMoving ? 'spinning' : ''}`}>
          <div className="drum-body" />
          <div
            className="cable-wind"
            style={{
              height: `${(cableLength / 50) * 100}%`,
              background: `linear-gradient(90deg, ${tensionColor} 0%, #666 100%)`,
            }}
          />
        </div>

        <div className="tension-gauge">
          <div className="gauge-bg" />

          <div
            className="gauge-fill"
            style={{
              height: `${(tension / 50) * 100}%`,
              background: `linear-gradient(0deg, ${tensionColor} 0%, ${tensionColor}88 100%)`,
              boxShadow: tension > 30 ? `0 0 20px ${tensionColor}` : 'none',
            }}
          />

          <div className="gauge-labels">
            <span>0t</span>
            <span>25t</span>
            <span>50t</span>
          </div>
        </div>

        <div className="cable-animation">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="cable-strand arctic"
              style={{
                animationDelay: `${i * 0.1}s`,
                opacity: isMoving ? 1 : 0.5,
                background:
                  tension > 30
                    ? 'linear-gradient(180deg, #ff4444 0%, #ff8844 100%)'
                    : 'linear-gradient(180deg, #00ccff 0%, #0088ff 100%)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="data-overlay arctic">
        <div className="data-row">
          <span className="data-label">CABLE</span>
          <span className="data-value arctic-cyan">{cableLength.toFixed(1)}m</span>
        </div>

        <div className="data-row">
          <span className="data-label">TENSION</span>
          <span
            className="data-value"
            style={{
              color: tensionColor,
              textShadow: tension > 30 ? `0 0 10px ${tensionColor}` : 'none',
            }}
          >
            {tension.toFixed(1)}t
          </span>
        </div>
      </div>
    </div>
  )
}
