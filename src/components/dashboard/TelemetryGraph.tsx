// =============================================================================
// TELEMETRY GRAPH — Real-time bar chart with live history tracking
// =============================================================================

interface TelemetryGraphProps {
  label: string
  value: number
  max: number
  unit: string
  color: string
  history?: number[]
}

export default function TelemetryGraph({
  label,
  value,
  max,
  unit,
  color,
  history = [],
}: TelemetryGraphProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="telemetry-panel" style={{ borderLeft: `2px solid ${color}` }}>
      <div className="telemetry-header">
        <span className="telemetry-label">{label}</span>
        <span className="telemetry-value" style={{ color }}>
          {value.toFixed(1)}{unit}
        </span>
      </div>

      <div className="telemetry-graph">
        <div className="graph-bars">
          {history.length > 0 ? (
            history.slice(-20).map((val, i) => {
              const h = Math.min((val / max) * 100, 100)
              return (
                <div
                  key={i}
                  className="graph-bar"
                  style={{
                    height: `${h}%`,
                    backgroundColor: color,
                    opacity: 0.4 + (i / 20) * 0.6,
                  }}
                />
              )
            })
          ) : (
            // Static placeholder bars when no history is available
            Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="graph-bar"
                style={{
                  height: `${Math.max(10, percentage * 0.9)}%`,
                  backgroundColor: color,
                  opacity: i < percentage / 5 ? 1 : 0.2,
                }}
              />
            ))
          )}
        </div>

        <div
          className="graph-line"
          style={{
            background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
            width: `${percentage}%`,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>

      <div className="telemetry-scale">
        <span>0{unit}</span>
        <span>{max / 2}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}
