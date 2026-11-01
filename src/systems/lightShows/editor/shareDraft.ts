import type { ShipType } from '../../../store/gameStoreTypes'
import type { LightShowV2 } from '../types'

// =============================================================================
// SHARE DRAFT (#270) — turn the editor's draft into a #hgshow= link (or a
// .hgshow file when it will not fit in a URL). The share modules (codec, valibot)
// load on demand, like ShareShowButton, so none of this reaches game-initial.
// The draft is shared as it stands, saved or not.
// =============================================================================

export type SharedDraft =
  | { kind: 'link'; url: string }
  | { kind: 'file'; filename: string; bytes: Uint8Array }

export async function shareDraft(
  shipType: ShipType,
  show: LightShowV2,
  loc?: Pick<Location, 'origin' | 'pathname'>,
): Promise<SharedDraft> {
  if (show.cues.length === 0) throw new Error('Add a cue before sharing')
  const [{ buildShowDocument }, { packShow }, { buildShareUrl }] = await Promise.all([
    import('../../share/buildShowDocument'),
    import('../../share/showCodec'),
    import('../../share/shareLink'),
  ])
  const packed = await packShow(buildShowDocument(shipType, { cues: show.cues, loopBeats: show.loopBeats }))
  if (packed.kind === 'fragment') return { kind: 'link', url: buildShareUrl(packed.fragment, loc) }
  return { kind: 'file', filename: packed.filename, bytes: packed.bytes }
}
