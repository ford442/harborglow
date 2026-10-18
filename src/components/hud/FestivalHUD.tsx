// =============================================================================
// FESTIVAL HUD — Harbor Festival setlist: start/stop, "Act 2/3", completion.
// Reads the festival through useSyncExternalStore (no store state, no canvas
// re-render); start/stop go through recordHostInput so peers stay in sync.
// =============================================================================

import { useEffect, useState, useSyncExternalStore } from 'react'
import { harborEventSystem } from '../../systems/eventSystem/HarborEventSystem'
import type { FestivalPhase } from '../../systems/eventSystem/harborFestival'
import { recordHostInput } from '../../systems/sim'
import type { ShipType } from '../../store/useGameStore'
import { createGlassPanelStyles, TYPOGRAPHY } from '../DesignSystem'

const festival = harborEventSystem.festival
const subscribe = (cb: () => void) => festival.subscribe(cb)
const getSnapshot = () => festival.getSnapshot()

const SHOW_TITLES: Partial<Record<ShipType, string>> = {
  cruise: 'Cruise Liner Finale',
  fireboat: 'Fireboat Water-Cannon Show',
  icebreaker: 'Icebreaker Aurora',
}

const PHASE_LABELS: Record<FestivalPhase, string> = {
  idle: '',
  awaitingRigs: 'Install every rig to start the show',
  playing: 'Now playing',
  intermission: 'Intermission — next ship arriving',
  complete: '',
}

const COMPLETE_BANNER_MS = 8000

export default function FestivalHUD({ canControl }: { canControl: boolean }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot)
  const [showComplete, setShowComplete] = useState(false)

  useEffect(() => {
    if (snap.phase !== 'complete') return
    setShowComplete(true)
    const id = window.setTimeout(() => setShowComplete(false), COMPLETE_BANNER_MS)
    return () => window.clearTimeout(id)
  }, [snap.phase])

  if (snap.phase === 'idle' || (snap.phase === 'complete' && !showComplete)) {
    if (!canControl) return null
    return (
      <div style={containerStyle}>
        <button style={buttonStyle} onClick={() => recordHostInput('event.festival.start', null)}>
          🎪 Start Harbor Festival
        </button>
      </div>
    )
  }

  const total = snap.setlist.length
  const shipType = snap.setlist[snap.actIndex]

  return (
    <div style={containerStyle}>
      <div style={{ ...createGlassPanelStyles({ padding: '10px 16px' }), ...panelStyle }}>
        {snap.phase === 'complete' ? (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ffd700' }}>
            🎪 Festival complete — {snap.actsPlayed}/{total} shows · +{snap.rewardCredits.toLocaleString()} HC
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
              🎪 Harbor Festival · Act {snap.actIndex + 1}/{total}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffd700' }}>
              {SHOW_TITLES[shipType] ?? shipType}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{PHASE_LABELS[snap.phase]}</div>
            {canControl && (
              <button
                style={{ ...buttonStyle, marginTop: 6, fontSize: 11, padding: '4px 10px' }}
                onClick={() => recordHostInput('event.festival.stop', null)}
              >
                Stop festival
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 64,
  left: '50%',
  transform: 'translateX(-50%)',
  pointerEvents: 'auto',
  fontFamily: TYPOGRAPHY.fontFamily,
  zIndex: 104,
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  border: '1px solid rgba(255, 215, 0, 0.35)',
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #ffd700',
  background: 'rgba(5,8,15,0.75)',
  color: '#ffd700',
  cursor: 'pointer',
}
