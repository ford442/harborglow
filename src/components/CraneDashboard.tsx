import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// TIER 3 ADVANCED ARCTIC COMMAND BOOTH - Fully Interactive
// 2026 Arctic port command center with live data feeds
// =============================================================================

export type BoothTier = 1 | 2 | 3

interface MonitorFeedProps {
  label: string
  camNumber: string
  active: boolean
  weather: string
  tier: number
  isOverhead?: boolean
  children: React.ReactNode
}

function MonitorFeed({ label, camNumber, active, weather, tier, isOverhead = false, children }: MonitorFeedProps) {
  const isStormy = weather === 'storm' || weather === 'rain'
  const isArctic = tier === 3
  
  // Screen shake for heavy loads (Arctic only)
  const loadTension = useGameStore(state => state.loadTension)
  const [shake, setShake] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    if (!isArctic || loadTension <= 30) {
      setShake({ x: 0, y: 0 })
      return
    }
    
    const interval = setInterval(() => {
      const intensity = (loadTension - 30) / 20
      setShake({
        x: (Math.random() - 0.5) * intensity * 3,
        y: (Math.random() - 0.5) * intensity * 3
      })
    }, 50)
    
    return () => clearInterval(interval)
  }, [isArctic, loadTension])
  
  return (
    <div 
      className={`crane-monitor tier-${tier} ${active ? 'active' : ''} ${isStormy ? 'weather-distortion' : ''} ${isOverhead ? 'overhead' : ''} ${isArctic ? 'arctic-mode' : ''}`}
      style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
    >
      {isArctic && <div className="frost-edge" />}
      
      <div className="monitor-bezel">
        {isArctic && <div className="arctic-led-accent" />}
        
        <div className="monitor-screen"
          style={{ 
            animation: isArctic && loadTension > 35 ? 'screen-flicker 0.1s infinite' : undefined 
          }}
        >
          {children}
          <div className="scanlines" />
          
          {isStormy && (
            <>
              <div className="rain-streaks" />
              <div className="static-noise" />
            </>
          )}
          
          {isArctic && weather === 'storm' && (
            <>
              <div className="snow-particles" />
              <div className="ice-static" />
            </>
          )}
          
          <div className="crt-flicker" />
          
          {/* Screen reflection overlay for Arctic */}
          {isArctic && (
            <div className="screen-reflection" />
          )}
        </div>
        
        <div className="monitor-label">
          <span className="cam-id">{camNumber}</span>
          <span className="cam-desc">{label}</span>
        </div>
        
        <div className={`status-led ${active ? 'on' : 'off'} ${isArctic ? 'arctic' : ''}`} />
      </div>
    </div>
  )
}

// Real-time Telemetry Graph
function TelemetryGraph({ 
  label, 
  value, 
  max, 
  unit, 
  color,
  history = []
}: { 
  label: string
  value: number
  max: number
  unit: string
  color: string
  history?: number[]
}) {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className="telemetry-panel"
      style={{ borderLeft: `2px solid ${color}` }}
    >
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
                    opacity: 0.4 + (i / 20) * 0.6
                  }}
                />
              )
            })
          ) : (
            Array.from({ length: 20 }, (_, i) => {
              const h = Math.max(10, percentage * (0.8 + Math.random() * 0.4))
              return (
                <div 
                  key={i}
                  className="graph-bar"
                  style={{ 
                    height: `${h}%`,
                    backgroundColor: color,
                    opacity: i < percentage / 5 ? 1 : 0.2
                  }}
                />
              )
            })
          )}
        </div>
        
        <div 
          className="graph-line" 
          style={{ 
            background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
            width: `${percentage}%`,
            boxShadow: `0 0 10px ${color}`
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

// Real-time System Status
function SystemStatusMonitor({ 
  systems 
}: { 
  systems: { name: string; status: 'ok' | 'warn' | 'error'; temp: number }[] 
}) {
  return (
    <div className="system-status-panel">
      <div className="status-header">SYSTEM STATUS</div>
      
      <div className="status-grid">
        {systems.map((sys) => (
          <div key={sys.name} className={`status-item ${sys.status}`}
            style={{
              animation: sys.status === 'error' ? 'status-blink 0.5s infinite' : undefined
            }}
          >
            <div className="status-icon">
              {sys.status === 'ok' && <div className="status-dot ok" />}
              {sys.status === 'warn' && <div className="status-dot warn" />}
              {sys.status === 'error' && <div className="status-dot error" />}
            </div>
            <div className="status-name">{sys.name}</div>
            
            <div className="status-temp" style={{
              color: sys.temp > 50 ? '#ff4444' : sys.temp > 40 ? '#ffcc00' : '#00ff44'
            }}>
              {sys.temp}°C
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Real-time Weather Monitor
function WeatherMonitor({ 
  temp, 
  wind, 
  visibility,
  iceBuildup 
}: { 
  temp: number
  wind: number
  visibility: string
  iceBuildup: number
}) {
  return (
    <div className="weather-monitor-panel">
      <div className="weather-header">ARCTIC WX</div>
      
      <div className="weather-data">
        <div className="weather-item"
          style={{ borderLeft: `3px solid ${temp < -20 ? '#0088ff' : temp < 0 ? '#00ccff' : '#ff8800'}` }}
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

// Left Twistlock Cam - Live
function LeftTwistlockCam({ 
  twistlockEngaged, 
  height,
  iceBuildup,
  isMoving 
}: { 
  twistlockEngaged: boolean
  height: number
  iceBuildup: number
  isMoving: boolean
}) {
  return (
    <div className="cam-feed left-twistlock arctic"
      style={{
        filter: iceBuildup > 0.3 ? `contrast(${1 - iceBuildup * 0.2}) brightness(${0.9 - iceBuildup * 0.1})` : undefined
      }}
    >
      <div className="feed-grid"
      >
        <div className="spreader-side"
        >
          <div className={`spreader-beam frosted ${isMoving ? 'moving' : ''}`} />
          
          <div className={`twistlock left engaged arctic ${twistlockEngaged ? 'locked' : 'unlocked'}`}
            style={{
              boxShadow: twistlockEngaged 
                ? '0 0 20px #00ff44, inset 0 0 10px #00ff44' 
                : '0 0 20px #ff4444, inset 0 0 10px #ff4444'
            }}
          >
            <div className="lock-icon">{twistlockEngaged ? '🔒' : '🔓'}</div>
          </div>
          
          <div className="corner-casting" style={{ transform: `translateY(${height * 2}px)` }}>
            <div className="container-corner ice-coated" />
          </div>
          
          {/* Ice overlay */}
          {iceBuildup > 0 && (
            <div 
              className="ice-overlay"
              style={{ opacity: iceBuildup }}
            >
              <div className="frost-pattern" />
            </div>
          )}
        </div>
        
        <div className="height-ruler"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="ruler-mark" style={{ top: `${i * 10}%` }}
            >
              <span>{(10 - i) * 2}m</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="data-overlay arctic"
      >
        <div className="data-row"
        >
          <span className="data-label">LOCK</span>
          <span className={`data-value ${twistlockEngaged ? 'arctic-green' : 'arctic-red'}`}
          >
            {twistlockEngaged ? 'ENGAGED' : 'DISENGAGED'}
          </span>
        </div>
        
        <div className="data-row"
        >
          <span className="data-label">HGT</span>
          <span className="data-value arctic-cyan">{height.toFixed(1)}m</span>
        </div>
        
        {iceBuildup > 0 && (
          <div className="data-row"
          >
            <span className="data-label">ICE</span>
            <span className="data-value arctic-white">{(iceBuildup * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Right Twistlock Cam - Live (mirrored)
function RightTwistlockCam({ 
  twistlockEngaged, 
  height,
  iceBuildup,
  isMoving 
}: { 
  twistlockEngaged: boolean
  height: number
  iceBuildup: number
  isMoving: boolean
}) {
  return (
    <div className="cam-feed right-twistlock arctic"
      style={{
        filter: iceBuildup > 0.3 ? `contrast(${1 - iceBuildup * 0.2}) brightness(${0.9 - iceBuildup * 0.1})` : undefined
      }}
    >
      <div className="feed-grid"
      >
        <div className="spreader-side mirror"
        >
          <div className={`spreader-beam frosted ${isMoving ? 'moving' : ''}`} />
          
          <div className={`twistlock right engaged arctic ${twistlockEngaged ? 'locked' : 'unlocked'}`}
            style={{
              boxShadow: twistlockEngaged 
                ? '0 0 20px #00ff44, inset 0 0 10px #00ff44' 
                : '0 0 20px #ff4444, inset 0 0 10px #ff4444'
            }}
          >
            <div className="lock-icon">{twistlockEngaged ? '🔒' : '🔓'}</div>
          </div>
          
          <div className="corner-casting" style={{ transform: `translateY(${height * 2}px)` }}>
            <div className="container-corner ice-coated" />
          </div>
          
          {iceBuildup > 0 && (
            <div 
              className="ice-overlay"
              style={{ opacity: iceBuildup }}
            >
              <div className="frost-pattern" />
            </div>
          )}
        </div>
        
        <div className="height-ruler"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="ruler-mark" style={{ top: `${i * 10}%` }}
            >
              <span>{(10 - i) * 2}m</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="data-overlay arctic"
      >
        <div className="data-row"
        >
          <span className="data-label">LOCK</span>
          <span className={`data-value ${twistlockEngaged ? 'arctic-green' : 'arctic-red'}`}
          >
            {twistlockEngaged ? 'ENGAGED' : 'DISENGAGED'}
          </span>
        </div>
        
        <div className="data-row"
        >
          <span className="data-label">HGT</span>
          <span className="data-value arctic-cyan">{height.toFixed(1)}m</span>
        </div>
        
        {iceBuildup > 0 && (
          <div className="data-row"
          >
            <span className="data-label">ICE</span>
            <span className="data-value arctic-white">{(iceBuildup * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Downward Spreader Cam - Live with alignment grid
function DownwardSpreaderCam({ 
  twistlockEngaged, 
  spreaderPos,
  iceBuildup,
  isMoving 
}: { 
  twistlockEngaged: boolean
  spreaderPos: { x: number; y: number; z: number }
  iceBuildup: number
  isMoving: boolean
}) {
  // Calculate alignment offset from center
  const alignmentX = spreaderPos.x / 20 // -1 to 1
  const alignmentZ = spreaderPos.z / 20
  
  return (
    <div className="cam-feed downward-spreader arctic">
      <div className="top-down-view"
      >
        <div 
          className={`spreader-top ${isMoving ? 'moving' : ''}`}
          style={{ 
            transform: `translate(${alignmentX * 40}px, ${alignmentZ * 30}px)`,
            transition: isMoving ? 'none' : 'transform 0.3s ease'
          }}
        >
          <div className="spreader-frame arctic"
          >
            {['tl', 'tr', 'bl', 'br'].map((corner) => (
              <div 
                key={corner}
                className={`tl-corner ${corner} ${twistlockEngaged ? 'engaged' : ''} arctic`}
              >
                <div className="tl-indicator" />
              </div>
            ))}
            
            <div className="center-crosshair arctic"
            >
              <div className="crosshair-h" />
              <div className="crosshair-v" />
            </div>
          </div>
          
          {iceBuildup > 0 && (
            <div className="ice-frost" style={{ opacity: iceBuildup }} />
          )}
        </div>
        
        <div className="target-container"
        >
          <div className="container-outline ice-glow" />
          <div className="target-crosshair arctic" />
          
          {/* Alignment guides that move with spreader */}
          <div 
            className="alignment-target"
            style={{
              transform: `translate(${-alignmentX * 40}px, ${-alignmentZ * 30}px)`
            }}
          >
            <div className="guide-h arctic" />
            <div className="guide-v arctic" />
          </div>
        </div>
        
        {/* Depth indicator ring */}
        <div 
          className="depth-ring"
          style={{
            opacity: 0.3 + (spreaderPos.y / 50) * 0.7
          }}
        >
          <div className="depth-marker" style={{ transform: `rotate(${(spreaderPos.y / 50) * 360}deg)` }} />
        </div>
      </div>
      
      <div className="data-overlay center arctic"
      >
        <div className="data-row"
        >
          <span className="data-label">POS</span>
          <span className="data-value arctic-cyan">
            X:{spreaderPos.x.toFixed(1)} Z:{spreaderPos.z.toFixed(1)}
          </span>
        </div>
        
        <div className="data-row"
        >
          <span className="data-label">ALT</span>
          <span className="data-value arctic-cyan">{spreaderPos.y.toFixed(1)}m</span>
        </div>
        
        <div className="data-row"
        >
          <span className="data-label">LOCK</span>
          <span className={`data-value ${twistlockEngaged ? 'arctic-green' : 'arctic-red'}`}
          >
            {twistlockEngaged ? 'ALL 4 ENGAGED' : 'UNLOCKED'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Winch Cam - Live
function WinchCam({ 
  cableLength, 
  tension,
  isMoving 
}: { 
  cableLength: number
  tension: number
  isMoving: boolean
}) {
  const tensionColor = tension > 30 ? '#ff4444' : tension > 20 ? '#ffcc00' : '#00ccff'
  
  return (
    <div className="cam-feed winch-cam arctic">
      <div className="winch-view"
      >
        <div className={`cable-drum arctic ${isMoving ? 'spinning' : ''}`}
        >
          <div className="drum-body" />
          <div 
            className="cable-wind" 
            style={{ 
              height: `${(cableLength / 50) * 100}%`,
              background: `linear-gradient(90deg, ${tensionColor} 0%, #666 100%)`
            }} 
          />
        </div>
        
        <div className="tension-gauge"
        >
          <div className="gauge-bg" />
          
          <div 
            className="gauge-fill"
            style={{ 
              height: `${(tension / 50) * 100}%`,
              background: `linear-gradient(0deg, ${tensionColor} 0%, ${tensionColor}88 100%)`,
              boxShadow: tension > 30 ? `0 0 20px ${tensionColor}` : 'none'
            }}
          />
          
          <div className="gauge-labels"
          >
            <span>0t</span>
            <span>25t</span>
            <span>50t</span>
          </div>
        </div>
        
        <div className="cable-animation"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <div 
              key={i} 
              className="cable-strand arctic"
              style={{ 
                animationDelay: `${i * 0.1}s`,
                opacity: isMoving ? 0.8 + Math.random() * 0.2 : 0.5,
                background: tension > 30 
                  ? `linear-gradient(180deg, #ff4444 0%, #ff8844 100%)` 
                  : `linear-gradient(180deg, #00ccff 0%, #0088ff 100%)`
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="data-overlay arctic"
      >
        <div className="data-row"
        >
          <span className="data-label">CABLE</span>
          <span className="data-value arctic-cyan">{cableLength.toFixed(1)}m</span>
        </div>
        
        <div className="data-row"
        >
          <span className="data-label">TENSION</span>
          <span 
            className="data-value"
            style={{ color: tensionColor, textShadow: tension > 30 ? `0 0 10px ${tensionColor}` : 'none' }}
          >
            {tension.toFixed(1)}t
          </span>
        </div>
      </div>
    </div>
  )
}

// Thermal Cam - Live with weather-reactive hotspots
function ThermalCam({ 
  hullTemp, 
  hotspots,
  weather,
  iceBuildup 
}: { 
  hullTemp: number
  hotspots: { x: number; y: number; intensity: number }[]
  weather: string
  iceBuildup: number
}) {
  // Adjust thermal reading based on weather
  const ambientTemp = weather === 'storm' ? -35 : weather === 'rain' ? -10 : -20
  const adjustedHullTemp = hullTemp + (ambientTemp + 20) * 0.3
  
  return (
    <div className="cam-feed thermal-cam"
      style={{
        filter: iceBuildup > 0 ? `hue-rotate(${iceBuildup * 30}deg) contrast(${1 - iceBuildup * 0.2})` : undefined
      }}
    >
      <div className="thermal-view"
      >
        <div className="thermal-bg"
        >
          <div 
            className="ship-thermal-silhouette"
            style={{
              background: `linear-gradient(180deg, 
                rgba(${adjustedHullTemp < -10 ? '0,100,150' : adjustedHullTemp < 0 ? '50,150,200' : '100,200,255'},0.4) 0%, 
                rgba(0,60,100,0.6) 100%)`
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
                boxShadow: `0 0 ${20 * spot.intensity}px ${10 * spot.intensity}px rgba(255, ${100 + spot.intensity * 100}, 0, ${spot.intensity})`
              }}
            >
              <div className="hotspot-pulse" />
            </div>
          ))}
          
          {/* Ice cold spots in storm */}
          {weather === 'storm' && (
            <>
              {Array.from({ length: 3 }, (_, i) => (
                <div 
                  key={`cold-${i}`}
                  className="thermal-coldspot"
                  style={{
                    left: `${20 + i * 30}%`,
                    top: `${60 + Math.random() * 20}%`,
                  }}
                >
                  <div className="coldspot-indicator" />
                </div>
              ))}
            </>
          )}
        </div>
        
        <div className="thermal-scale"
        >
          <div className="scale-gradient" />
          
          <div className="scale-labels"
          >
            <span>-40°C</span>
            <span>-20°C</span>
            <span>0°C</span>
            <span>+20°C</span>
          </div>
        </div>
      </div>
      
      <div className="data-overlay arctic"
      >
        <div className="data-row"
        >
          <span className="data-label">HULL</span>
          <span 
            className="data-value"
            style={{ 
              color: adjustedHullTemp < -15 ? '#0088ff' : adjustedHullTemp < 0 ? '#00ccff' : '#ff8844'
            }}
          >
            {adjustedHullTemp.toFixed(0)}°C
          </span>
        </div>
        
        <div className="data-row"
        >
          <span className="data-label">HOTSPOTS</span>
          <span className="data-value arctic-cyan">{hotspots.length} DETECTED</span>
        </div>
        
        {iceBuildup > 0 && (
          <div className="data-row"
          >
            <span className="data-label">ICE</span>
            <span className="data-value arctic-white">THERMAL MASK</span>
          </div>
        )}
      </div>
    </div>
  )
}

// 360° Arctic View - Live
function Arctic360Cam({ 
  snowIntensity, 
  windSpeed,
  isMoving 
}: { 
  snowIntensity: number
  windSpeed: number
  isMoving: boolean
}) {
  return (
    <div className="cam-feed arctic-360"
    >
      <div className="arctic-view-360"
      >
        <div className="arctic-horizon" />
        
        <div className="arctic-ice-field" />
        
        <div 
          className="wind-indicator"
          style={{ opacity: windSpeed / 30 }}
        >
          <div className="wind-arrow" style={{ animationDuration: `${1 / (windSpeed / 10)}s` }} />
          <span className="wind-speed">{windSpeed.toFixed(0)} m/s</span>
        </div>
        
        {Array.from({ length: 5 }, (_, i) => (
          <div 
            key={i}
            className="iceberg"
            style={{
              left: `${10 + i * 20}%`,
              transform: `scale(${0.5 + Math.random() * 0.5})`,
              opacity: 0.4 + Math.random() * 0.4,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
        
        <div 
          className="snow-overlay"
          style={{ opacity: snowIntensity }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <div 
              key={i}
              className="snow-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random() * 1}s`,
                transform: `scale(${0.5 + Math.random()})`
              }}
            />
          ))}
        </div>
        
        <div 
          className="wind-streaks"
          style={{ opacity: windSpeed / 30 }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div 
              key={i}
              className="wind-streak"
              style={{
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.3 + Math.random() * 0.3}s`
              }}
            />
          ))}
        </div>
        
        <div className="arctic-compass"
        >
          <div className="compass-ring"
          >
            {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir, i) => (
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
      
      <div className="data-overlay arctic"
      >
        <div className="data-row"
        >
          <span className="data-label">SNOW</span>
          <span className="data-value arctic-cyan">{(snowIntensity * 100).toFixed(0)}%</span>
        </div>
        
        <div className="data-row"
        >
          <span className="data-label">WIND</span>
          <span className="data-value arctic-cyan">{windSpeed.toFixed(1)} m/s</span>
        </div>
        
        {isMoving && (
          <div className="data-row"
          >
            <span className="data-label">OPS</span>
            <span className="data-value arctic-green">ACTIVE</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function CraneDashboard({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const [fourthMonitorMode, setFourthMonitorMode] = useState<'winch' | 'landside'>('winch')
  
  // All live data from store
  const {
    weather,
    boothTier,
    twistlockEngaged,
    spreaderPos,
    cableDepth,
    loadTension,
    heaterActive,
    iceBuildup,
    isMoving,
    joystickLeft,
    joystickRight,
  } = useGameStore(state => ({
    weather: state.weather,
    boothTier: state.boothTier,
    twistlockEngaged: state.twistlockEngaged,
    spreaderPos: state.spreaderPos,
    cableDepth: state.cableDepth,
    loadTension: state.loadTension,
    heaterActive: state.heaterActive,
    iceBuildup: state.iceBuildup,
    isMoving: state.isMoving,
    joystickLeft: state.joystickLeft,
    joystickRight: state.joystickRight,
  }))
  
  const isArctic = boothTier === 3
  
  // Live system statuses
  const systems = [
    { 
      name: 'HYDRAULICS', 
      status: loadTension > 40 ? 'warn' as const : 'ok' as const, 
      temp: 40 + loadTension * 0.5 
    },
    { 
      name: 'ELECTRICAL', 
      status: 'ok' as const, 
      temp: 35 + (joystickLeft.x !== 0 || joystickRight.x !== 0 ? 5 : 0)
    },
    { 
      name: 'HEATING', 
      status: heaterActive ? 'ok' as const : 'warn' as const, 
      temp: heaterActive ? 42 : 20 
    },
    { 
      name: 'COMMS', 
      status: weather === 'storm' ? 'warn' as const : 'ok' as const, 
      temp: 32 
    },
    { 
      name: 'SENSORS', 
      status: iceBuildup > 0.4 ? 'warn' as const : 'ok' as const, 
      temp: -10 - iceBuildup * 20 
    },
    { 
      name: 'WINCH', 
      status: loadTension > 45 ? 'error' as const : loadTension > 35 ? 'warn' as const : 'ok' as const, 
      temp: 28 + loadTension * 0.8 
    }
  ]
  
  // Live arctic data
  const arcticData = {
    hullTemp: -15,
    hotspots: [
      { x: 30, y: 40, intensity: 0.8 },
      { x: 60, y: 35, intensity: 0.6 },
      { x: 45, y: 60, intensity: 0.4 }
    ],
    snowIntensity: weather === 'storm' ? 0.8 : 0.2,
    windSpeed: weather === 'storm' ? 25 : 12,
    outsideTemp: heaterActive ? -20 : -28,
    visibility: weather === 'storm' ? '500m' : '2km'
  }
  
  // Tension history for graph
  const [tensionHistory, setTensionHistory] = useState<number[]>([])
  const [cableHistory, setCableHistory] = useState<number[]>([])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTensionHistory(prev => [...prev.slice(-19), loadTension])
      setCableHistory(prev => [...prev.slice(-19), cableDepth])
    }, 100)
    return () => clearInterval(interval)
  }, [loadTension, cableDepth])
  
  // TAB hotkey
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        setFourthMonitorMode(prev => prev === 'winch' ? 'landside' : 'winch')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])
  
  if (!isArctic) {
    // Standard dashboard for Tier 1/2
    return (
      <Html
        transform
        position={position}
        rotation={[0, 0, 0]}
        distanceFactor={10}
        style={{ width: '800px', height: '500px', pointerEvents: 'none' }}
      >
        <div className="crane-dashboard-container tier-standard"
        >
          <div className="dashboard-frame"
          >
            <div className="monitor-grid"
            >
              <div className="monitor-row"
              >
                <MonitorFeed label="LEFT TWISTLOCK" camNumber="CAM 01" active={true} weather={weather} tier={boothTier}
                >
                  <LeftTwistlockCam 
                    twistlockEngaged={twistlockEngaged} 
                    height={spreaderPos.y}
                    iceBuildup={0}
                    isMoving={isMoving}
                  />
                </MonitorFeed>
                
                <MonitorFeed label="RIGHT TWISTLOCK" camNumber="CAM 02" active={true} weather={weather} tier={boothTier}
                >
                  <RightTwistlockCam 
                    twistlockEngaged={twistlockEngaged}
                    height={spreaderPos.y}
                    iceBuildup={0}
                    isMoving={isMoving}
                  />
                </MonitorFeed>
              </div>
              
              <div className="monitor-row"
              >
                <MonitorFeed label="DOWNWARD SPREADER" camNumber="CAM 03" active={true} weather={weather} tier={boothTier}
                >
                  <DownwardSpreaderCam 
                    twistlockEngaged={twistlockEngaged}
                    spreaderPos={spreaderPos}
                    iceBuildup={0}
                    isMoving={isMoving}
                  />
                </MonitorFeed>
                
                <MonitorFeed 
                  label={fourthMonitorMode === 'winch' ? 'WINCH CABLES' : 'LANDSIDE QUAY'} 
                  camNumber="CAM 04" 
                  active={true} 
                  weather={weather} 
                  tier={boothTier}
                >
                  <WinchCam 
                    cableLength={cableDepth}
                    tension={loadTension}
                    isMoving={isMoving}
                  />
                </MonitorFeed>
              </div>
            </div>
            
            <div className="dashboard-controls"
            >
              <button 
                className="monitor-toggle-btn" 
                onClick={() => setFourthMonitorMode(prev => prev === 'winch' ? 'landside' : 'winch')}
              >
                <span className="btn-icon">🔄</span>
                <span className="btn-label">
                  {fourthMonitorMode === 'winch' ? 'SWITCH TO QUAY' : 'SWITCH TO WINCH'}
                </span>
                <span className="btn-hint">[TAB]</span>
              </button>
            </div>
          </div>
        </div>
      </Html>
    )
  }
  
  // Tier 3: Advanced Arctic Command Booth - Fully Interactive
  return (
    <Html
      transform
      position={position}
      rotation={[0, 0, 0]}
      distanceFactor={10}
      style={{ width: '1200px', height: '900px', pointerEvents: 'none' }}
    >
      <div className="crane-dashboard-container tier-arctic"
      >
        {/* Heated Windows */}
        <div className="arctic-windows"
        >
          <HeatedWindow heaterActive={heaterActive} frostLevel={iceBuildup} />
          <HeatedWindow heaterActive={heaterActive} frostLevel={iceBuildup * 0.8} />
        </div>
        
        {/* Overhead Monitor Bar */}
        <div className="overhead-monitor-bar"
        >
          <div className="overhead-monitors"
          >
            <MonitorFeed label="TENSION LOAD" camNumber="TLM 01" active={true} weather={weather} tier={boothTier} isOverhead={true}
            >
              <TelemetryGraph 
                label="TENSION" 
                value={loadTension} 
                max={50} 
                unit="t" 
                color={loadTension > 30 ? '#ff4444' : '#00ccff'}
                history={tensionHistory}
              />
            </MonitorFeed>
            
            <MonitorFeed label="CABLE DEPTH" camNumber="TLM 02" active={true} weather={weather} tier={boothTier} isOverhead={true}
            >
              <TelemetryGraph 
                label="DEPTH" 
                value={cableDepth} 
                max={50} 
                unit="m" 
                color="#0088ff"
                history={cableHistory}
              />
            </MonitorFeed>
            
            <MonitorFeed label="SYSTEMS" camNumber="SYS 03" active={true} weather={weather} tier={boothTier} isOverhead={true}
            >
              <SystemStatusMonitor systems={systems} />
            </MonitorFeed>
            
            <MonitorFeed label="ARCTIC WX" camNumber="WX 04" active={true} weather={weather} tier={boothTier} isOverhead={true}
            >
              <WeatherMonitor 
                temp={arcticData.outsideTemp}
                wind={arcticData.windSpeed}
                visibility={arcticData.visibility}
                iceBuildup={iceBuildup}
              />
            </MonitorFeed>
            
            <MonitorFeed label="THERMAL SCAN" camNumber="CAM 05" active={true} weather={weather} tier={boothTier} isOverhead={true}
            >
              <ThermalCam 
                hullTemp={arcticData.hullTemp} 
                hotspots={arcticData.hotspots}
                weather={weather}
                iceBuildup={iceBuildup}
              />
            </MonitorFeed>
            
            <MonitorFeed label="360° ARCTIC" camNumber="CAM 06" active={true} weather={weather} tier={boothTier} isOverhead={true}
            >
              <Arctic360Cam 
                snowIntensity={arcticData.snowIntensity} 
                windSpeed={arcticData.windSpeed}
                isMoving={isMoving}
              />
            </MonitorFeed>
          </div>
        </div>
        
        {/* Curved Main Console */}
        <div className="arctic-console curved"
        >
          <div className="console-led-glow" />
          
          <div className="main-monitors-curved"
          >
            <div className="curved-row"
            >
              <MonitorFeed label="LEFT TWISTLOCK" camNumber="CAM 01" active={true} weather={weather} tier={boothTier}
              >
                <LeftTwistlockCam 
                  twistlockEngaged={twistlockEngaged}
                  height={spreaderPos.y}
                  iceBuildup={iceBuildup}
                  isMoving={isMoving}
                />
              </MonitorFeed>
              
              <MonitorFeed label="RIGHT TWISTLOCK" camNumber="CAM 02" active={true} weather={weather} tier={boothTier}
              >
                <RightTwistlockCam 
                  twistlockEngaged={twistlockEngaged}
                  height={spreaderPos.y}
                  iceBuildup={iceBuildup}
                  isMoving={isMoving}
                />
              </MonitorFeed>
            </div>
            
            <div className="curved-row lower"
            >
              <MonitorFeed label="DOWNWARD SPREADER" camNumber="CAM 03" active={true} weather={weather} tier={boothTier}
              >
                <DownwardSpreaderCam 
                  twistlockEngaged={twistlockEngaged}
                  spreaderPos={spreaderPos}
                  iceBuildup={iceBuildup}
                  isMoving={isMoving}
                />
              </MonitorFeed>
              
              <MonitorFeed 
                label={fourthMonitorMode === 'winch' ? 'WINCH CABLES' : 'LANDSIDE QUAY'} 
                camNumber="CAM 04" 
                active={true} 
                weather={weather} 
                tier={boothTier}
              >
                <WinchCam 
                  cableLength={cableDepth}
                  tension={loadTension}
                  isMoving={isMoving}
                />
              </MonitorFeed>
            </div>
          </div>
          
          {/* Control buttons */}
          <div className="arctic-controls"
          >
            <button 
              className="arctic-btn heater"
              onClick={() => useGameStore.getState().setHeaterActive(!heaterActive)}
              style={{
                boxShadow: heaterActive ? '0 0 20px rgba(255,100,0,0.5)' : 'none'
              }}
            >
              <span className="btn-glow" />
              <span className="btn-icon">🔥</span>
              <span className="btn-label">{heaterActive ? 'HEATER ON' : 'HEATER OFF'}</span>
            </button>
            
            <button 
              className="arctic-btn toggle" 
              onClick={() => setFourthMonitorMode(prev => prev === 'winch' ? 'landside' : 'winch')}
            >
              <span className="btn-glow" />
              <span className="btn-icon">🔄</span>
              <span className="btn-label">CAM 04</span>
              <span className="btn-hint">[TAB]</span>
            </button>
          </div>
        </div>
        
        {/* Padded Wall Insulation */}
        <div className="arctic-walls"
        >
          <div className="wall-padding left" />
          <div className="wall-padding right" />
          <div className="ceiling-padding" />
        </div>
      </div>
    </Html>
  )
}

// Heated Window with live defrost
function HeatedWindow({ heaterActive, frostLevel }: { heaterActive: boolean; frostLevel: number }) {
  const [currentFrost, setCurrentFrost] = useState(frostLevel)
  
  useEffect(() => {
    // Frost clears faster when heater is on
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
    <div className={`heated-window ${heaterActive ? 'heater-on' : ''}`}
    >
      <div className="window-glass" />
      
      <div 
        className="frost-layer"
        style={{ opacity: currentFrost }}
      >
        <div className="frost-texture" />
      </div>
      
      <div className={`defrost-grid ${heaterActive ? 'active' : ''}`}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div 
            key={i}
            className="grid-line horizontal"
            style={{ 
              top: `${(i + 1) * 12}%`,
              opacity: heaterActive ? 1 : 0.3 + Math.random() * 0.3
            }}
          />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <div 
            key={`v-${i}`}
            className="grid-line vertical"
            style={{ 
              left: `${(i + 1) * 10}%`,
              opacity: heaterActive ? 1 : 0.3 + Math.random() * 0.3
            }}
          />
        ))}
      </div>
      
      {heaterActive && currentFrost > 0.1 && (
        <div className="heater-indicator"
        >
          <span className="heat-icon">🔥</span>
          <span className="heat-text">DEFROSTING</span>
        </div>
      )}
    </div>
  )
}
