import { useState, useCallback, useRef, useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '72px',
  right: '16px',
  width: '280px',
  maxHeight: '360px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  background: 'rgba(10, 15, 30, 0.92)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 212, 170, 0.35)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
  zIndex: 200,
  pointerEvents: 'auto',
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '12px',
  color: '#e8f4ff',
}

const statusDot = (status: string): React.CSSProperties => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background:
    status === 'connected' ? '#00d4aa' :
    status === 'signalling' ? '#ff9500' :
    status === 'error' ? '#ff3b30' : '#666',
  display: 'inline-block',
  marginRight: '6px',
})

const buttonStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(0, 212, 170, 0.15)',
  border: '1px solid rgba(0, 212, 170, 0.5)',
  borderRadius: '6px',
  color: '#00d4aa',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 600,
}

const chatLogStyle: React.CSSProperties = {
  flex: 1,
  minHeight: '80px',
  maxHeight: '120px',
  overflowY: 'auto',
  padding: '6px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '4px',
  fontSize: '10px',
  lineHeight: 1.4,
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '11px',
}

export default function LobbyPanel() {
  const multiplayerEnabled = useGameStore((s) => s.multiplayerEnabled)
  const multiplayerRole = useGameStore((s) => s.multiplayerRole)
  const connectionStatus = useGameStore((s) => s.connectionStatus)
  const roomId = useGameStore((s) => s.roomId)
  const spectatorCount = useGameStore((s) => s.spectatorCount)
  const networkLatencyMs = useGameStore((s) => s.networkLatencyMs)
  const chatMessages = useGameStore((s) => s.chatMessages)

  const [dismissed, setDismissed] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [creating, setCreating] = useState(false)
  const lastChatSent = useRef(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  const handleCreateRoom = useCallback(async () => {
    setCreating(true)
    try {
      const { multiplayerSystem } = await import('../systems/multiplayerSystem')
      const id = await multiplayerSystem.createRoom()
      useGameStore.getState().setRoomId(id)
      await multiplayerSystem.startHost(id)
      setShareUrl(multiplayerSystem.getShareUrl(id))
    } catch (e) {
      console.error('Failed to create room:', e)
      useGameStore.getState().setConnectionStatus('error')
    } finally {
      setCreating(false)
    }
  }, [])

  const handleCopyLink = useCallback(() => {
    if (shareUrl) void navigator.clipboard.writeText(shareUrl)
  }, [shareUrl])

  const handleSendChat = useCallback(async () => {
    const text = chatInput.trim()
    if (!text) return
    const now = Date.now()
    if (now - lastChatSent.current < 500) return
    lastChatSent.current = now
    const { multiplayerSystem } = await import('../systems/multiplayerSystem')
    multiplayerSystem.sendChat(text)
    setChatInput('')
  }, [chatInput])

  if (!multiplayerEnabled || dismissed) return null

  const isSpectator = multiplayerRole === 'spectator'
  const isHost = multiplayerRole === 'host'

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: '#00d4aa', fontSize: '11px' }}>SHARED HARBOR</strong>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{ ...buttonStyle, padding: '2px 8px', background: 'transparent', border: 'none', color: '#888' }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#aaa' }}>
        <span style={statusDot(connectionStatus)} />
        {connectionStatus}
        {isHost && spectatorCount > 0 && (
          <span style={{ marginLeft: 'auto', color: '#00d4aa' }}>
            {spectatorCount} spectator{spectatorCount !== 1 ? 's' : ''}
          </span>
        )}
        {isSpectator && networkLatencyMs > 0 && (
          <span style={{ marginLeft: 'auto' }}>{networkLatencyMs}ms</span>
        )}
      </div>

      {isSpectator && (
        <div style={{ padding: '6px 8px', background: 'rgba(255,149,0,0.1)', borderRadius: '4px', fontSize: '10px', color: '#ff9500' }}>
          Spectating — same sim tick + host inputs (crane commands disabled)
        </div>
      )}

      {multiplayerRole === 'offline' && (
        <button type="button" style={buttonStyle} onClick={handleCreateRoom} disabled={creating}>
          {creating ? 'Creating…' : 'Create shared harbor'}
        </button>
      )}
      {multiplayerRole === 'offline' && (
        <div style={{ fontSize: '10px', color: '#888', lineHeight: 1.4 }}>
          Starts a fresh seeded sim. Spectators catch up from the input log, not 10 Hz poses.
        </div>
      )}

      {isHost && roomId && (
        <div style={{ fontSize: '10px' }}>
          <div>Room: <code style={{ color: '#00d4aa' }}>{roomId}</code></div>
          {shareUrl && (
            <button type="button" style={{ ...buttonStyle, marginTop: '6px', width: '100%' }} onClick={handleCopyLink}>
              Copy share link
            </button>
          )}
        </div>
      )}

      {isSpectator && roomId && (
        <div style={{ fontSize: '10px', color: '#aaa' }}>
          Joined room <code style={{ color: '#00d4aa' }}>{roomId}</code>
        </div>
      )}

      {(isHost || isSpectator) && connectionStatus === 'connected' && (
        <>
          <div style={chatLogStyle}>
            {chatMessages.length === 0 && (
              <span style={{ color: '#666' }}>No messages yet</span>
            )}
            {chatMessages.map((m) => (
              <div key={m.id}>
                <span style={{ color: '#00bfff' }}>{m.sender}: </span>
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              style={inputStyle}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Chat…"
              maxLength={200}
            />
            <button type="button" style={{ ...buttonStyle, flexShrink: 0 }} onClick={handleSendChat}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}
