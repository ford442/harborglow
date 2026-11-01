import { useState } from 'react'
import { useStore } from 'zustand'
import type { EditorSession } from '../../systems/lightShows/editor/editorSession'
import { shareDraft } from '../../systems/lightShows/editor/shareDraft'
import * as s from './styles'

// Share the draft as it stands (saved or not): copies a #hgshow= link, or
// downloads a .hgshow file when it will not fit in a URL.

export default function ShareDraftButton({ session }: { session: EditorSession }) {
  const shipType = useStore(session.store, (st) => st.shipType)
  const [note, setNote] = useState<string | null>(null)

  const flash = (text: string) => {
    setNote(text)
    setTimeout(() => setNote(null), 3000)
  }

  const share = async () => {
    try {
      const shared = await shareDraft(shipType, session.base().show)
      if (shared.kind === 'link') {
        await navigator.clipboard.writeText(shared.url)
        flash('Link copied')
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob([shared.bytes as BlobPart], { type: 'application/octet-stream' }))
        a.download = shared.filename
        a.click()
        URL.revokeObjectURL(a.href)
        flash(`Saved ${shared.filename}`)
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Share failed')
    }
  }

  return (
    <button style={s.button()} onClick={() => void share()} data-testid="le-share" title="Copy a link to this show (or save a .hgshow file if it is too big for a link)">
      {note ?? '🔗 Share'}
    </button>
  )
}
