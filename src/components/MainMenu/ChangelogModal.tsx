import { modalOverlayStyle, modalContentStyle, modalHeaderStyle, modalTitleStyle, modalCloseStyle, modalBodyStyle } from './styles'

interface ChangelogModalProps {
  onClose: () => void
}

const CHANGELOG = [
  {
    version: 'v2.0.0',
    date: 'May 2026',
    highlights: [
      'Spectator drone cinematic mode with DOF',
      'Music-reactive underwater atmosphere',
      'Smart auto-pilot installation system',
      'Crane control panel with winch speed',
      'Enhanced attachment point beacons',
    ],
  },
  {
    version: 'v1.5.0',
    date: 'April 2026',
    highlights: [
      'Multiview camera dashboard system',
      'Tugboat operations mode',
      'Day/night cycle with moon phases',
      'Training modules hub',
      'Economy & reputation systems',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'March 2026',
    highlights: [
      'Initial harbor simulation release',
      '8 ship types with procedural generation',
      'Physics-based crane operation',
      'Procedural music with lyrics sync',
      'Weather & sea events',
    ],
  },
]

export default function ChangelogModal({ onClose }: ChangelogModalProps) {
  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>📝 Changelog</h2>
          <button style={modalCloseStyle} onClick={onClose}>×</button>
        </div>
        <div style={modalBodyStyle}>
          {CHANGELOG.map((entry, idx) => (
            <div key={entry.version} style={{ marginBottom: idx < CHANGELOG.length - 1 ? '24px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#00d4aa' }}>{entry.version}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{entry.date}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'none' }}>
                {entry.highlights.map(h => (
                  <li key={h} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '-16px', color: '#00d4aa' }}>▸</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
