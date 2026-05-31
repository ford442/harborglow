import { modalOverlayStyle, modalContentStyle, modalHeaderStyle, modalTitleStyle, modalCloseStyle, modalBodyStyle } from './styles'

interface ChangelogModalProps {
  onClose: () => void
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const CHANGELOG = [
  {
    version: 'v2.0.0',
    date: 'May 2026',
    releaseUrl: 'https://github.com/ford442/harborglow/releases/tag/v2.0.0',
    art: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#08111d"/><path d="M8 30h32l-3 6H11z" fill="#00d4aa"/><path d="M18 14h5v16h-5z" fill="#fff"/><path d="M23 16l10 6v8H23z" fill="#7fd6ff"/><circle cx="30" cy="20" r="2" fill="#ffcc66"/></svg>`),
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
    releaseUrl: 'https://github.com/ford442/harborglow/releases/tag/v1.5.0',
    art: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#09131e"/><path d="M10 31h28l-2.5 5H13z" fill="#ff8b45"/><path d="M20 15h4v16h-4z" fill="#e6f1ff"/><path d="M16 22h14v3H16z" fill="#ffd700"/></svg>`),
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
    releaseUrl: 'https://github.com/ford442/harborglow/releases/tag/v1.0.0',
    art: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#08111d"/><path d="M10 32h28l-3 5H13z" fill="#9ca3af"/><circle cx="24" cy="18" r="7" fill="#00d4aa"/><path d="M24 12v12M18 18h12" stroke="#08111d" stroke-width="2"/></svg>`),
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <img src={entry.art} alt="" width={48} height={48} style={{ borderRadius: '10px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#00d4aa' }}>{entry.version}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{entry.date}</span>
                    {entry.releaseUrl && (
                      <a
                        href={entry.releaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#7fd6ff', fontSize: '12px', textDecoration: 'none' }}
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </div>
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
