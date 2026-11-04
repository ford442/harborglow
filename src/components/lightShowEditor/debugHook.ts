import { lightingSystem } from '../../systems/lightingSystem'
import type { RigGroupId } from '../../systems/lightShows/types'
import type { EditorSession } from '../../systems/lightShows/editor/editorSession'

// window.harborglowDebug.lightShow — for e2e/light-show-editor.spec.ts.
// `harborglowDebug` only exists with ?screenshot=1 (GameShell), so this is a
// no-op for players. It stays installed after the editor closes: the spec
// asserts what the *game* plays once the editor is gone.

export interface LightShowDebug {
  /** Copy of lightingSystem.getRigGroupState (the live object is reused every frame). */
  rigGroupState(shipId: string, group: RigGroupId): { active: boolean; pattern: string; level: number; color: string } | null
  isShowActive(): boolean
  /** The open editor session's committed cues, or null when closed. */
  cues(): Array<{ id: string; beat: number; lengthBeats: number; target: string; color: string }> | null
  session(): EditorSession | null
}

type DebugHost = { harborglowDebug?: { lightShow?: LightShowDebug } }

let current: EditorSession | null = null

export function publishEditorDebug(session: EditorSession | null): void {
  current = session
  const debug = (window as unknown as DebugHost).harborglowDebug
  if (!debug || debug.lightShow) return
  debug.lightShow = {
    rigGroupState(shipId, group) {
      const s = lightingSystem.getRigGroupState(shipId, group)
      return s ? { active: s.active, pattern: s.pattern, level: s.level, color: s.color } : null
    },
    isShowActive: () => lightingSystem.isShowActive(),
    cues: () => current?.base().show.cues.map((c) => ({ id: c.id, beat: c.beat, lengthBeats: c.lengthBeats, target: c.target, color: c.color })) ?? null,
    session: () => current,
  }
}
