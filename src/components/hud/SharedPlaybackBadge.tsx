import { useSharedPlayback } from '../../systems/share/sharedPlaybackState'

// Small top-right badge during shared-link playback: result of the final-hash
// check (when the show carries a performance) and a way back to the menu.

const LABEL = {
  none: '',
  pending: 'verifying…',
  match: 'verified ✓',
  mismatch: 'hash mismatch ✗',
} as const

export default function SharedPlaybackBadge() {
  const { active, shipType, verification } = useSharedPlayback()
  if (!active) return null
  return (
    <div
      data-testid="shared-playback-badge"
      data-verification={verification}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '8px 14px',
        borderRadius: 10,
        background: 'rgba(5, 8, 15, 0.75)',
        color: verification === 'mismatch' ? '#ff8a80' : '#e8f4ff',
        fontSize: 13,
        pointerEvents: 'auto',
      }}
    >
      <span>Shared show · {shipType}</span>
      {verification !== 'none' && <span>{LABEL[verification]}</span>}
      <button
        onClick={() => window.location.reload()}
        style={{ background: 'none', border: '1px solid #5fd4ff', color: '#5fd4ff', borderRadius: 6, cursor: 'pointer' }}
      >
        Exit
      </button>
    </div>
  )
}
