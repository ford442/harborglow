// =============================================================================
// CRANE OBJECTIVE HUD — HarborGlow
// Shows the opening crane-mode goal: install every light rig on the docked
// starter ship. Gives the active-monitors scene an explicit objective,
// live progress, and a reward payoff (the upgrade light show).
// =============================================================================

import { useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { createGlassPanelStyles, GLASSMORPHISM, TYPOGRAPHY, SHIP_COLORS } from '../DesignSystem'

export default function CraneObjectiveHUD() {
  const craneContract = useGameStore((s) => s.craneContract)
  const ships = useGameStore((s) => s.ships)
  const installedUpgrades = useGameStore((s) => s.installedUpgrades)
  const completeCraneContract = useGameStore((s) => s.completeCraneContract)

  const ship = craneContract ? ships.find((s) => s.id === craneContract.shipId) : undefined
  const installed = craneContract
    ? installedUpgrades.filter((u) => u.shipId === craneContract.shipId).length
    : 0
  const target = craneContract?.targetRigs ?? 0
  const isComplete = craneContract?.status === 'completed' || (target > 0 && installed >= target)

  // Award the contract reward exactly once when all rigs are installed.
  useEffect(() => {
    if (craneContract && craneContract.status === 'active' && target > 0 && installed >= target) {
      completeCraneContract()
    }
  }, [craneContract, installed, target, completeCraneContract])

  // Hide if there's no contract, or its ship has left the harbor.
  if (!craneContract || !ship) return null

  const ratio = target > 0 ? Math.min(1, installed / target) : 0
  const accent = SHIP_COLORS[craneContract.shipType]?.primary ?? '#00d4aa'
  const glow = SHIP_COLORS[craneContract.shipType]?.glow ?? 'rgba(0,212,170,0.4)'

  return (
    <div
      style={{
        position: 'fixed',
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 109,
        fontFamily: TYPOGRAPHY.fontFamily,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...createGlassPanelStyles({ padding: '14px 20px', maxWidth: '360px' }),
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: `1px solid ${accent}55`,
          boxShadow: `${GLASSMORPHISM.boxShadow}, 0 0 30px ${glow}`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{isComplete ? '✨' : '🏗️'}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: accent }}>
              {isComplete ? 'Contract Complete!' : 'First Contract'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              {isComplete
                ? `${craneContract.shipName} is fully lit`
                : `Light up the ${craneContract.shipName}`}
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 200, 50, 0.12)',
              border: '1px solid rgba(255, 200, 50, 0.25)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffd700' }}>
              +{craneContract.reward.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Light Rigs Installed
            </span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff' }}>
              {installed}/{target}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${ratio * 100}%`,
                height: '100%',
                borderRadius: 2,
                background: isComplete
                  ? 'linear-gradient(90deg, #ffd700, #ffaa00)'
                  : `linear-gradient(90deg, ${accent}, #0088ff)`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Next-step hint */}
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
          {isComplete
            ? 'Enjoy the light show — spawn another vessel to keep building the harbor.'
            : 'Open the upgrade menu, pick an attachment point, and lower the crane spreader to install a rig.'}
        </div>
      </div>
    </div>
  )
}
