import { useEffect } from 'react'
import { cueFromPad } from './perform'
import { firePerformCue } from './firePerformCue'

/** Keyboard pads 1–5. Ignored while typing in a field. */
export function usePerformPads(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }
      const cue = cueFromPad(event.key)
      if (!cue) return
      firePerformCue(cue, 'pad')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
