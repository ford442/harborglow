import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'
import MonitorFeed from './dashboard/MonitorFeed'
import TwistlockCam from './dashboard/TwistlockCam'
import DownwardSpreaderCam from './dashboard/DownwardSpreaderCam'
import WinchCam from './dashboard/WinchCam'
import ThermalCam from './dashboard/ThermalCam'
import Arctic360Cam from './dashboard/Arctic360Cam'
import TelemetryGraph from './dashboard/TelemetryGraph'
import SystemStatusMonitor from './dashboard/SystemStatusMonitor'
import WeatherMonitor from './dashboard/WeatherMonitor'
import HeatedWindow from './dashboard/HeatedWindow'

// =============================================================================
// CRANE DASHBOARD — Orchestrates the multi-monitor control booth UI.
// Tier 1/2: standard 2×2 grid. Tier 3: full Arctic command booth.
// =============================================================================

export type BoothTier = 1 | 2 | 3

export default function CraneDashboard({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const [fourthMonitorMode, setFourthMonitorMode] = useState<'winch' | 'landside'>('winch')

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
    { name: 'HYDRAULICS', status: loadTension > 40 ? 'warn' as const : 'ok' as const, temp: 40 + loadTension * 0.5 },
    { name: 'ELECTRICAL', status: 'ok' as const, temp: 35 + (joystickLeft.x !== 0 || joystickRight.x !== 0 ? 5 : 0) },
    { name: 'HEATING',    status: heaterActive ? 'ok' as const : 'warn' as const, temp: heaterActive ? 42 : 20 },
    { name: 'COMMS',      status: weather === 'storm' ? 'warn' as const : 'ok' as const, temp: 32 },
    { name: 'SENSORS',    status: iceBuildup > 0.4 ? 'warn' as const : 'ok' as const, temp: -10 - iceBuildup * 20 },
    { name: 'WINCH',      status: loadTension > 45 ? 'error' as const : loadTension > 35 ? 'warn' as const : 'ok' as const, temp: 28 + loadTension * 0.8 },
  ]

  const arcticData = {
    hullTemp: -15,
    hotspots: [
      { x: 30, y: 40, intensity: 0.8 },
      { x: 60, y: 35, intensity: 0.6 },
      { x: 45, y: 60, intensity: 0.4 },
    ],
    snowIntensity: weather === 'storm' ? 0.8 : 0.2,
    windSpeed: weather === 'storm' ? 25 : 12,
    outsideTemp: heaterActive ? -20 : -28,
    visibility: weather === 'storm' ? '500m' : '2km',
  }

  const [tensionHistory, setTensionHistory] = useState<number[]>([])
  const [cableHistory, setCableHistory] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setTensionHistory(prev => [...prev.slice(-19), loadTension])
      setCableHistory(prev => [...prev.slice(-19), cableDepth])
    }, 100)
    return () => clearInterval(interval)
  }, [loadTension, cableDepth])

  // TAB key cycles the fourth monitor feed
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

  const toggleFourthMonitor = () =>
    setFourthMonitorMode(prev => prev === 'winch' ? 'landside' : 'winch')

  // ─── Standard Tier 1/2 dashboard ────────────────────────────────────────────
  if (!isArctic) {
    return (
      <Html
        transform
        position={position}
        rotation={[0, 0, 0]}
        distanceFactor={10}
        style={{ width: '800px', height: '500px', pointerEvents: 'none' }}
      >
        <div className="crane-dashboard-container tier-standard">
          <div className="dashboard-frame">
            <div className="monitor-grid">
              <div className="monitor-row">
                <MonitorFeed label="LEFT TWISTLOCK" camNumber="CAM 01" active={true} weather={weather} tier={boothTier}>
                  <TwistlockCam side="left" twistlockEngaged={twistlockEngaged} height={spreaderPos.y} iceBuildup={0} isMoving={isMoving} />
                </MonitorFeed>

                <MonitorFeed label="RIGHT TWISTLOCK" camNumber="CAM 02" active={true} weather={weather} tier={boothTier}>
                  <TwistlockCam side="right" twistlockEngaged={twistlockEngaged} height={spreaderPos.y} iceBuildup={0} isMoving={isMoving} />
                </MonitorFeed>
              </div>

              <div className="monitor-row">
                <MonitorFeed label="DOWNWARD SPREADER" camNumber="CAM 03" active={true} weather={weather} tier={boothTier}>
                  <DownwardSpreaderCam twistlockEngaged={twistlockEngaged} spreaderPos={spreaderPos} iceBuildup={0} isMoving={isMoving} />
                </MonitorFeed>

                <MonitorFeed
                  label={fourthMonitorMode === 'winch' ? 'WINCH CABLES' : 'LANDSIDE QUAY'}
                  camNumber="CAM 04"
                  active={true}
                  weather={weather}
                  tier={boothTier}
                >
                  <WinchCam cableLength={cableDepth} tension={loadTension} isMoving={isMoving} />
                </MonitorFeed>
              </div>
            </div>

            <div className="dashboard-controls">
              <button className="monitor-toggle-btn" onClick={toggleFourthMonitor}>
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

  // ─── Tier 3: Advanced Arctic Command Booth ───────────────────────────────────
  return (
    <Html
      transform
      position={position}
      rotation={[0, 0, 0]}
      distanceFactor={10}
      style={{ width: '1200px', height: '900px', pointerEvents: 'none' }}
    >
      <div className="crane-dashboard-container tier-arctic">
        {/* Heated Windows */}
        <div className="arctic-windows">
          <HeatedWindow heaterActive={heaterActive} frostLevel={iceBuildup} />
          <HeatedWindow heaterActive={heaterActive} frostLevel={iceBuildup * 0.8} />
        </div>

        {/* Overhead Telemetry Bar */}
        <div className="overhead-monitor-bar">
          <div className="overhead-monitors">
            <MonitorFeed label="TENSION LOAD" camNumber="TLM 01" active={true} weather={weather} tier={boothTier} isOverhead={true}>
              <TelemetryGraph label="TENSION" value={loadTension} max={50} unit="t" color={loadTension > 30 ? '#ff4444' : '#00ccff'} history={tensionHistory} />
            </MonitorFeed>

            <MonitorFeed label="CABLE DEPTH" camNumber="TLM 02" active={true} weather={weather} tier={boothTier} isOverhead={true}>
              <TelemetryGraph label="DEPTH" value={cableDepth} max={50} unit="m" color="#0088ff" history={cableHistory} />
            </MonitorFeed>

            <MonitorFeed label="SYSTEMS" camNumber="SYS 03" active={true} weather={weather} tier={boothTier} isOverhead={true}>
              <SystemStatusMonitor systems={systems} />
            </MonitorFeed>

            <MonitorFeed label="ARCTIC WX" camNumber="WX 04" active={true} weather={weather} tier={boothTier} isOverhead={true}>
              <WeatherMonitor temp={arcticData.outsideTemp} wind={arcticData.windSpeed} visibility={arcticData.visibility} iceBuildup={iceBuildup} />
            </MonitorFeed>

            <MonitorFeed label="THERMAL SCAN" camNumber="CAM 05" active={true} weather={weather} tier={boothTier} isOverhead={true}>
              <ThermalCam hullTemp={arcticData.hullTemp} hotspots={arcticData.hotspots} weather={weather} iceBuildup={iceBuildup} />
            </MonitorFeed>

            <MonitorFeed label="360° ARCTIC" camNumber="CAM 06" active={true} weather={weather} tier={boothTier} isOverhead={true}>
              <Arctic360Cam snowIntensity={arcticData.snowIntensity} windSpeed={arcticData.windSpeed} isMoving={isMoving} />
            </MonitorFeed>
          </div>
        </div>

        {/* Curved Main Console */}
        <div className="arctic-console curved">
          <div className="console-led-glow" />

          <div className="main-monitors-curved">
            <div className="curved-row">
              <MonitorFeed label="LEFT TWISTLOCK" camNumber="CAM 01" active={true} weather={weather} tier={boothTier}>
                <TwistlockCam side="left" twistlockEngaged={twistlockEngaged} height={spreaderPos.y} iceBuildup={iceBuildup} isMoving={isMoving} />
              </MonitorFeed>

              <MonitorFeed label="RIGHT TWISTLOCK" camNumber="CAM 02" active={true} weather={weather} tier={boothTier}>
                <TwistlockCam side="right" twistlockEngaged={twistlockEngaged} height={spreaderPos.y} iceBuildup={iceBuildup} isMoving={isMoving} />
              </MonitorFeed>
            </div>

            <div className="curved-row lower">
              <MonitorFeed label="DOWNWARD SPREADER" camNumber="CAM 03" active={true} weather={weather} tier={boothTier}>
                <DownwardSpreaderCam twistlockEngaged={twistlockEngaged} spreaderPos={spreaderPos} iceBuildup={iceBuildup} isMoving={isMoving} />
              </MonitorFeed>

              <MonitorFeed
                label={fourthMonitorMode === 'winch' ? 'WINCH CABLES' : 'LANDSIDE QUAY'}
                camNumber="CAM 04"
                active={true}
                weather={weather}
                tier={boothTier}
              >
                <WinchCam cableLength={cableDepth} tension={loadTension} isMoving={isMoving} />
              </MonitorFeed>
            </div>
          </div>

          {/* Control buttons */}
          <div className="arctic-controls">
            <button
              className="arctic-btn heater"
              onClick={() => useGameStore.getState().setHeaterActive(!heaterActive)}
              style={{ boxShadow: heaterActive ? '0 0 20px rgba(255,100,0,0.5)' : 'none' }}
            >
              <span className="btn-glow" />
              <span className="btn-icon">🔥</span>
              <span className="btn-label">{heaterActive ? 'HEATER ON' : 'HEATER OFF'}</span>
            </button>

            <button className="arctic-btn toggle" onClick={toggleFourthMonitor}>
              <span className="btn-glow" />
              <span className="btn-icon">🔄</span>
              <span className="btn-label">CAM 04</span>
              <span className="btn-hint">[TAB]</span>
            </button>
          </div>
        </div>

        {/* Padded Wall Insulation */}
        <div className="arctic-walls">
          <div className="wall-padding left" />
          <div className="wall-padding right" />
          <div className="ceiling-padding" />
        </div>
      </div>
    </Html>
  )
}
