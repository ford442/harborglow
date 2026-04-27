// =============================================================================
// WAVE HEIGHT DEBUG — HarborGlow
// Real-time readout of wave physics at the tugboat position.
// =============================================================================

import { useRef } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { waveSystem } from '../../systems/WaveSystem'
import { useFrame } from '@react-three/fiber'
import { GLASSMORPHISM, TYPOGRAPHY } from '../DesignSystem'

interface WaveDebugState {
  waveHeight: number
  foamAmount: number
  stormIntensity: number
  windSpeed: number
  windDir: number
  buoyancyForce: number
  currentSpeed: number
}

export default function WaveHeightDebug() {
  const operationMode = useGameStore((s) => s.operationMode)
  const tugboatState = useGameStore((s) => s.tugboatState)
  const isStormActive = useGameStore((s) => s.isStormActive)
  const windStrength = useGameStore((s) => s.windStrength)
  const windDirection = useGameStore((s) => s.windDirection)

  const debugRef = useRef<WaveDebugState>({
    waveHeight: 0,
    foamAmount: 0,
    stormIntensity: 0,
    windSpeed: 0,
    windDir: 0,
    buoyancyForce: 0,
    currentSpeed: 0,
  })

  useFrame(() => {
    if (operationMode !== 'tugboat') return

    const time = waveSystem.getTime()
    const x = tugboatState.position[0]
    const z = tugboatState.position[2]

    const h = waveSystem.getWaterHeight(x, z, time)
    const foam = waveSystem.getFoamAmount(x, z, time)
    const storm = waveSystem.getStormIntensity()
    const current = waveSystem.getSurfaceCurrent(x, z)
    const speed = Math.sqrt(
      tugboatState.velocity[0] ** 2 + tugboatState.velocity[2] ** 2
    )

    // Estimate buoyancy force from submerged depth approximation
    const hullBottom = tugboatState.position[1] - 0.5
    const waterSurface = h - 2.5
    const submerged = Math.max(0, waterSurface - hullBottom)
    const buoyancy = submerged * 18 // matches BUOYANCY_SCALE in Tugboat.tsx

    debugRef.current = {
      waveHeight: h,
      foamAmount: foam,
      stormIntensity: storm,
      windSpeed: windStrength || storm * 25,
      windDir: windDirection || waveSystem.getState().layers[0].direction[0],
      buoyancyForce: buoyancy,
      currentSpeed: speed,
    }
  })

  if (operationMode !== 'tugboat') return null

  const d = debugRef.current

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 110,
        fontFamily: TYPOGRAPHY.fontFamily,
        ...GLASSMORPHISM,
        padding: '14px 18px',
        borderRadius: '12px',
        minWidth: '200px',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: isStormActive ? '#ff8800' : '#00d4aa',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{isStormActive ? '⛈' : '🌊'}</span>
        <span>Wave Diagnostics</span>
      </div>

      <DebugRow label="Wave Height" value={`${d.waveHeight.toFixed(2)} m`} />
      <DebugRow label="Foam" value={`${(d.foamAmount * 100).toFixed(0)} %`} bar={d.foamAmount} color="#ffffff" />
      <DebugRow label="Storm" value={`${(d.stormIntensity * 100).toFixed(0)} %`} bar={d.stormIntensity} color="#ff8800" />
      <DebugRow label="Wind" value={`${d.windSpeed.toFixed(1)} m/s`} />
      <DebugRow label="Buoyancy" value={`${d.buoyancyForce.toFixed(1)} N`} />
      <DebugRow label="Speed" value={`${(d.currentSpeed * 1.944).toFixed(1)} kts`} />

      <div
        style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '9px',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'monospace',
        }}
      >
        Heading: {((tugboatState.heading * 180) / Math.PI).toFixed(0)}°
        {'  '}Wind: {((d.windDir * 180) / Math.PI).toFixed(0)}°
      </div>
    </div>
  )
}

function DebugRow({
  label,
  value,
  bar,
  color = '#00d4aa',
}: {
  label: string
  value: string
  bar?: number
  color?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '6px',
        fontSize: '11px',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {bar !== undefined && (
          <div
            style={{
              width: 40,
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, bar * 100))}%`,
                height: '100%',
                background: color,
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        )}
        <span style={{ color: '#fff', fontVariantNumeric: 'tabular-nums', minWidth: '50px', textAlign: 'right' }}>
          {value}
        </span>
      </div>
    </div>
  )
}
