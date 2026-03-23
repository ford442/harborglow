// =============================================================================
// WEATHER MONITOR — Arctic weather data display
// =============================================================================

interface WeatherMonitorProps {
  temp: number
  wind: number
  visibility: string
  iceBuildup: number
}

export default function WeatherMonitor({ temp, wind, visibility, iceBuildup }: WeatherMonitorProps) {
  return (
    <div className="weather-monitor-panel">
      <div className="weather-header">ARCTIC WX</div>

      <div className="weather-data">
        <div
          className="weather-item"
          style={{
            borderLeft: `3px solid ${temp < -20 ? '#0088ff' : temp < 0 ? '#00ccff' : '#ff8800'}`,
          }}
        >
          <span className="weather-icon">🌡️</span>
          <div className="weather-details">
            <span className="weather-value">{temp}°C</span>
            <span className="weather-label">TEMP</span>
          </div>
        </div>

        <div className="weather-item" style={{ borderLeft: '3px solid #00ff88' }}>
          <span className="weather-icon">💨</span>
          <div className="weather-details">
            <span className="weather-value">{wind.toFixed(1)} m/s</span>
            <span className="weather-label">WIND</span>
          </div>
        </div>

        <div className="weather-item" style={{ borderLeft: '3px solid #ffcc00' }}>
          <span className="weather-icon">👁️</span>
          <div className="weather-details">
            <span className="weather-value">{visibility}</span>
            <span className="weather-label">VIS</span>
          </div>
        </div>

        {iceBuildup > 0 && (
          <div className="weather-item" style={{ borderLeft: '3px solid #ffffff' }}>
            <span className="weather-icon">❄️</span>
            <div className="weather-details">
              <span className="weather-value">{(iceBuildup * 100).toFixed(0)}%</span>
              <span className="weather-label">ICE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
