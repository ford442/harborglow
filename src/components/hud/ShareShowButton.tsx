import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'

// "Share show": copies a #hgshow link (<= 8 KB) or downloads a .hgshow file.
// The share modules (codec, valibot) load only on click.

export default function ShareShowButton() {
  const shipType = useGameStore((s) => s.ships.find((x) => x.id === s.currentShipId)?.type)
  const [status, setStatus] = useState<string | null>(null)
  if (!shipType) return null

  const share = async () => {
    try {
      const [{ buildShowDocument }, { packShow }, { buildShareUrl }] = await Promise.all([
        import('../../systems/share/buildShowDocument'),
        import('../../systems/share/showCodec'),
        import('../../systems/share/shareLink'),
      ])
      const packed = await packShow(buildShowDocument(shipType))
      if (packed.kind === 'fragment') {
        const url = buildShareUrl(packed.fragment)
        await navigator.clipboard.writeText(url)
        setStatus('Link copied')
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob([packed.bytes as BlobPart], { type: 'application/octet-stream' }))
        a.download = packed.filename
        a.click()
        URL.revokeObjectURL(a.href)
        setStatus(`Saved ${packed.filename}`)
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Share failed')
    }
    setTimeout(() => setStatus(null), 3000)
  }

  return (
    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}>
      <button
        onClick={share}
        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #5fd4ff', background: 'rgba(5,8,15,0.75)', color: '#5fd4ff', cursor: 'pointer' }}
      >
        {status ?? 'Share show'}
      </button>
    </div>
  )
}
