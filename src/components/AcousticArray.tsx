import type { CSSProperties } from 'react'
import { useGameStore } from '../store/useGameStore'
import { commsSystem, ACOUSTIC_NOTE_LAYOUT, AcousticNote } from '../systems/commsSystem'

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

const keyRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(13, minmax(0, 1fr))',
  gap: '4px',
}

export default function AcousticArray() {
  const handshakeComplete = useGameStore((s) => s.handshakeComplete)
  const handshakeInputSequence = useGameStore((s) => s.handshakeInputSequence)
  const handshakeTargetSequence = useGameStore((s) => s.handshakeTargetSequence)
  const submitAcousticNote = useGameStore((s) => s.submitAcousticNote)

  const handlePress = (note: AcousticNote) => {
    submitAcousticNote(note)
    void commsSystem.triggerHornBlast(note)
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Acoustic Override Array
      </div>
      <div style={keyRowStyle}>
        {ACOUSTIC_NOTE_LAYOUT.map((note) => {
          const isSharp = note.includes('#')
          return (
            <button
              key={note}
              onClick={() => handlePress(note)}
              style={{
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: isSharp ? 'rgba(38, 44, 60, 0.9)' : 'rgba(220, 229, 255, 0.18)',
                color: isSharp ? '#a4b8ff' : '#f1f6ff',
                padding: '8px 0',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.1s ease, background 0.2s ease',
              }}
            >
              {note}
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: '10px', color: handshakeComplete ? '#00d4aa' : 'rgba(255,255,255,0.55)' }}>
        {handshakeComplete
          ? 'Handshake complete. Towing controls unlocked.'
          : `Signal progress: ${handshakeInputSequence.length}/${handshakeTargetSequence.length}`}
      </div>
    </div>
  )
}
