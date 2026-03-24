import { useMemo } from 'react'

// =============================================================================
// ARCTIC 360 CAM — 360° panoramic arctic environment view
// Random arrays are memoized to avoid re-seeding on every render.
// =============================================================================

interface Arctic360CamProps {
  snowIntensity: number
  windSpeed: number
  isMoving: boolean
}

const COMPASS_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export default function Arctic360Cam({ snowIntensity, windSpeed, isMoving }: Arctic360CamProps) {
  // Stable random positions — computed once on mount
  const icebergs = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        left: 10 + i * 20,
        scale: 0.5 + (i * 0.13) % 0.5,
        opacity: 0.4 + (i * 0.11) % 0.4,
        delay: i * 0.5,
      })),
    []
  )

  const snowParticles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        left: (i * 3.7) % 100,
        delay: (i * 0.07) % 2,
        duration: 0.5 + (i * 0.04) % 1,
        scale: 0.5 + (i * 0.05) % 1,
      })),
    []
  )

  const windStreaks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        top: (i * 11.3) % 100,
        delay: (i * 0.05) % 0.5,
        duration: 0.3 + (i * 0.03) % 0.3,
      })),
    []
  )

  return (
    <div className="cam-feed arctic-360">
      <div className="arctic-view-360">
        <div className="arctic-horizon" />
        <div className="arctic-ice-field" />

        <div className="wind-indicator" style={{ opacity: windSpeed / 30 }}>
          <div
            className="wind-arrow"
            style={{ animationDuration: `${1 / (windSpeed / 10)}s` }}
          />
          <span className="wind-speed">{windSpeed.toFixed(0)} m/s</span>
        </div>

        {icebergs.map((berg, i) => (
          <div
            key={i}
            className="iceberg"
            style={{
              left: `${berg.left}%`,
              transform: `scale(${berg.scale})`,
              opacity: berg.opacity,
              animationDelay: `${berg.delay}s`,
            }}
          />
        ))}

        <div className="snow-overlay" style={{ opacity: snowIntensity }}>
          {snowParticles.map((p, i) => (
            <div
              key={i}
              className="snow-particle"
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                transform: `scale(${p.scale})`,
              }}
            />
          ))}
        </div>

        <div className="wind-streaks" style={{ opacity: windSpeed / 30 }}>
          {windStreaks.map((s, i) => (
            <div
              key={i}
              className="wind-streak"
              style={{
                top: `${s.top}%`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
        </div>

        <div className="arctic-compass">
          <div className="compass-ring">
            {COMPASS_DIRS.map((dir, i) => (
              <span
                key={dir}
                className="compass-dir"
                style={{ transform: `rotate(${i * 45}deg) translateY(-35px)` }}
              >
                {dir}
              </span>
            ))}
          </div>
          <div
            className="compass-needle"
            style={{ animationDuration: isMoving ? '2s' : '10s' }}
          />
        </div>
      </div>

      <div className="data-overlay arctic">
        <div className="data-row">
          <span className="data-label">SNOW</span>
          <span className="data-value arctic-cyan">{(snowIntensity * 100).toFixed(0)}%</span>
        </div>

        <div className="data-row">
          <span className="data-label">WIND</span>
          <span className="data-value arctic-cyan">{windSpeed.toFixed(1)} m/s</span>
        </div>

        {isMoving && (
          <div className="data-row">
            <span className="data-label">OPS</span>
            <span className="data-value arctic-green">ACTIVE</span>
          </div>
        )}
      </div>
    </div>
  )
}
