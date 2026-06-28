// =============================================================================
// CRANE WELCOME HANDLER — HarborGlow
// One-time, state-derived first-rig nudge for brand-new crane players.
// Visibility is purely derived from store state — no dismiss flag, no button.
// =============================================================================

import { useGameStore } from '../../store/useGameStore'
import { createGlassPanelStyles, GLASSMORPHISM, TYPOGRAPHY, SHIP_COLORS } from '../DesignSystem'

const WELCOME_STYLE_ID = 'harborglow-crane-welcome-keyframes'

function ensureWelcomeKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(WELCOME_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = WELCOME_STYLE_ID
  style.textContent = `
    @keyframes craneWelcomePulseIn {
      0% {
        transform: translateY(28px) scale(0.9);
        opacity: 0;
        box-shadow: ${GLASSMORPHISM.boxShadow}, 0 0 0 rgba(255, 215, 0, 0);
      }
      45% {
        transform: translateY(-4px) scale(1.04);
        opacity: 1;
        box-shadow: ${GLASSMORPHISM.boxShadow}, 0 0 40px rgba(255, 215, 0, 0.35);
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
        box-shadow: ${GLASSMORPHISM.boxShadow}, 0 0 24px rgba(255, 215, 0, 0.15);
      }
    }
  `
  document.head.appendChild(style)
}

export default function CraneWelcomeHandler() {
  const operationMode = useGameStore((s) => s.operationMode)
  const gameMode = useGameStore((s) => s.gameMode)
  const craneContract = useGameStore((s) => s.craneContract)
  const ships = useGameStore((s) => s.ships)
  const installedUpgrades = useGameStore((s) => s.installedUpgrades)

  const ship = craneContract ? ships.find((s) => s.id === craneContract.shipId) : undefined
  const installed = craneContract
    ? installedUpgrades.filter((u) => u.shipId === craneContract.shipId).length
    : 0
  const show =
    operationMode === 'crane' &&
    gameMode !== 'training' &&
    craneContract?.status === 'active' &&
    !!ship &&
    installed === 0

  if (!show) return null

  ensureWelcomeKeyframes()

  const accent = SHIP_COLORS[craneContract!.shipType]?.primary ?? '#00d4aa'
  const glow = SHIP_COLORS[craneContract!.shipType]?.glow ?? 'rgba(0,212,170,0.4)'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '148px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 108,
        fontFamily: TYPOGRAPHY.fontFamily,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...createGlassPanelStyles({ padding: '18px 24px', maxWidth: '420px' }),
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          border: `1px solid ${accent}88`,
          boxShadow: `${GLASSMORPHISM.boxShadow}, 0 0 36px ${glow}`,
          animation: 'craneWelcomePulseIn 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>⚓</span>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: accent,
              letterSpacing: '0.3px',
            }}
          >
            Harbor Operations — First Contract
          </div>
        </div>
        <div
          style={{
            fontSize: '13px',
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.82)',
          }}
        >
          Open the Upgrade Menu, pick a glowing attachment point, and lower the crane spreader to
          snap your first light rig into place.
        </div>
      </div>
    </div>
  )
}
