// =============================================================================
// TELEMETRY GRAPH — Real-time bar chart with live history tracking
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { useAudioData } from '../../systems/audioVisualSync'

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
          {value.toFixed(2)}{unit}
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

const HISTORY_MAX = 20
const HISTORY_THROTTLE_MS = 100

function pushHistory(history: number[], value: number): number[] {
  const next = history.length >= HISTORY_MAX ? history.slice(1) : history.slice()
  next.push(value)
  return next
}

/** Live bass/mid/treble + beat indicator for ?audioDebug=1 sessions. */
export function AudioSpectrumTelemetry() {
  const audioData = useAudioData()
  const bassHistoryRef = useRef<number[]>([])
  const midHistoryRef = useRef<number[]>([])
  const trebleHistoryRef = useRef<number[]>([])
  const lastPushRef = useRef(0)
  const [histories, setHistories] = useState({
    bass: [] as number[],
    mid: [] as number[],
    treble: [] as number[],
  })

  useEffect(() => {
    const now = performance.now()
    if (now - lastPushRef.current < HISTORY_THROTTLE_MS) return
    lastPushRef.current = now

    bassHistoryRef.current = pushHistory(bassHistoryRef.current, audioData.bass)
    midHistoryRef.current = pushHistory(midHistoryRef.current, audioData.mid)
    trebleHistoryRef.current = pushHistory(trebleHistoryRef.current, audioData.treble)

    setHistories({
      bass: bassHistoryRef.current,
      mid: midHistoryRef.current,
      treble: trebleHistoryRef.current,
    })
  }, [audioData.bass, audioData.mid, audioData.treble, audioData.beat])

  const beatColor = audioData.beat ? '#ff3366' : '#445566'

  return (
    <div
      style={{
        width: 280,
        padding: 8,
        background: 'rgba(4, 12, 24, 0.92)',
        border: '1px solid rgba(0, 200, 255, 0.35)',
        borderRadius: 4,
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#cceeff',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          borderBottom: '1px solid rgba(0,200,255,0.2)',
          paddingBottom: 4,
        }}
      >
        <span>AUDIO SPECTRUM</span>
        <span style={{ color: beatColor, fontWeight: audioData.beat ? 700 : 400 }}>
          BEAT {audioData.beat ? 'ON' : 'off'}
        </span>
      </div>

      <TelemetryGraph
        label="BASS"
        value={audioData.bass}
        max={1}
        unit=""
        color="#ff6b35"
        history={histories.bass}
      />
      <TelemetryGraph
        label="MID"
        value={audioData.mid}
        max={1}
        unit=""
        color="#00d4aa"
        history={histories.mid}
      />
      <TelemetryGraph
        label="TREBLE"
        value={audioData.treble}
        max={1}
        unit=""
        color="#66a3ff"
        history={histories.treble}
      />
    </div>
  )
}
