import { useState, type CSSProperties } from 'react'
import { capturePosterPng, downloadDataUrl, getLiveRenderer } from '../../rendering'

// Poster and show export. The muxer chunk loads only when an export starts.

export default function ExportShowButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const poster = async () => {
    setStatus('Capturing poster…')
    const shot = await capturePosterPng(getLiveRenderer())
    if (!shot) {
      setStatus('Poster unavailable')
      return
    }
    downloadDataUrl(shot.dataUrl, 'harborglow-poster.png')
    setStatus('Poster saved')
    window.setTimeout(() => setStatus(null), 2500)
  }

  const exp = async (mode: 'live' | 'offline') => {
    if (busy) return
    setBusy(true)
    setStatus(mode === 'offline' ? 'Rendering 30s…' : 'Recording 30s…')
    try {
      const { exportShow } = await import('../../systems/export/runExport')
      const bytes = await exportShow({ mode, container: 'mp4' })
      const blob = new Blob([bytes as BlobPart], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = mode === 'offline' ? 'harborglow-show-offline.mp4' : 'harborglow-show.mp4'
      a.click()
      URL.revokeObjectURL(url)
      setStatus('MP4 saved')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(false)
      window.setTimeout(() => setStatus(null), 4000)
    }
  }

  return (
    <div style={{ position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, pointerEvents: 'auto' }}>
      <button type="button" onClick={poster} style={btn}>Save poster</button>
      <button type="button" disabled={busy} onClick={() => exp('live')} style={btn}>Export MP4</button>
      <button type="button" disabled={busy} onClick={() => exp('offline')} style={btn}>Export offline</button>
      {status && <span style={{ color: '#c9d6e2', font: '12px sans-serif', alignSelf: 'center' }}>{status}</span>}
    </div>
  )
}

const btn: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #00d4aa',
  background: 'rgba(5,8,15,0.75)',
  color: '#00d4aa',
  cursor: 'pointer',
}
