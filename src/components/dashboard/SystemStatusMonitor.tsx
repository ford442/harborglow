// =============================================================================
// SYSTEM STATUS MONITOR — Grid of system health indicators
// =============================================================================

interface SystemEntry {
  name: string
  status: 'ok' | 'warn' | 'error'
  temp: number
}

interface SystemStatusMonitorProps {
  systems: SystemEntry[]
}

export default function SystemStatusMonitor({ systems }: SystemStatusMonitorProps) {
  return (
    <div className="system-status-panel">
      <div className="status-header">SYSTEM STATUS</div>

      <div className="status-grid">
        {systems.map((sys) => (
          <div
            key={sys.name}
            className={`status-item ${sys.status}`}
            style={{
              animation: sys.status === 'error' ? 'status-blink 0.5s infinite' : undefined,
            }}
          >
            <div className="status-icon">
              <div className={`status-dot ${sys.status}`} />
            </div>
            <div className="status-name">{sys.name}</div>
            <div
              className="status-temp"
              style={{
                color: sys.temp > 50 ? '#ff4444' : sys.temp > 40 ? '#ffcc00' : '#00ff44',
              }}
            >
              {sys.temp}°C
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
