import type { ShowDocument } from '../schemas/showDocument'

// =============================================================================
// SHARED SHOW SPLASH — gate shown when a share link / .hgshow file is opened.
// The click is the user gesture browsers require before audio can start.
// =============================================================================

export type SharedLinkState =
    | { status: 'none' }
    | { status: 'loading' }
    | { status: 'ready'; doc: ShowDocument }
    | { status: 'error'; message: string }

interface SharedShowSplashProps {
    link: Exclude<SharedLinkState, { status: 'none' }>
    onWatch: (doc: ShowDocument) => void
    onBack: () => void
}

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    background: 'radial-gradient(ellipse at center, #10243a 0%, #05080f 70%)',
    color: '#e8f4ff',
    fontFamily: '"Inter", system-ui, sans-serif',
    textAlign: 'center',
    padding: 24,
}

const buttonStyle: React.CSSProperties = {
    padding: '14px 36px',
    fontSize: 18,
    fontWeight: 600,
    color: '#05080f',
    background: '#5fd4ff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
}

const linkButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#8fb4d4',
    cursor: 'pointer',
    fontSize: 14,
    textDecoration: 'underline',
}

export default function SharedShowSplash({ link, onWatch, onBack }: SharedShowSplashProps) {
    if (link.status === 'loading') {
        return (
            <div style={overlayStyle} role="status">
                <p>Opening shared light show…</p>
            </div>
        )
    }

    if (link.status === 'error') {
        return (
            <div style={overlayStyle} role="alert" data-testid="shared-show-error">
                <h1 style={{ margin: 0 }}>Can't open this show</h1>
                <p style={{ margin: 0, maxWidth: 420, opacity: 0.8 }}>{link.message}</p>
                <button style={buttonStyle} onClick={onBack}>Back to menu</button>
            </div>
        )
    }

    const { doc } = link
    return (
        <div style={overlayStyle} data-testid="shared-show-splash">
            <h1 style={{ margin: 0 }}>Shared light show</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>
                {doc.shipType} · {doc.cues.length} cues{doc.inputLog ? ' · with performance' : ''}
            </p>
            <button style={buttonStyle} onClick={() => onWatch(doc)}>Click to watch</button>
            <button style={linkButtonStyle} onClick={onBack}>Back to menu</button>
        </div>
    )
}
