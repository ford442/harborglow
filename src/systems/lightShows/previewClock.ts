// =============================================================================
// PREVIEW CLOCK — scrubs a private transport on the 'audio' clock.
// It never reads or writes sim time, and it is not the music transport.
// =============================================================================

import { BeatTransport } from '../audio/transport'

export interface PreviewControls {
  play: (beat: number, bpm: number) => void
  scrub: (beat: number) => void
  pause: () => void
  beats: () => number
  clock: () => 'sim' | 'audio'
}

export function createPreviewControls(
  transport = new BeatTransport({ autoPump: false }),
): PreviewControls {
  return {
    play(beat: number, bpm: number) {
      transport.bpm = bpm
      transport.start({ clock: 'audio', atBeat: beat })
    },
    scrub(beat: number) {
      transport.seek(Math.max(0, beat))
    },
    pause() {
      transport.stop()
    },
    beats() {
      return transport.beats
    },
    clock() {
      return transport.clock
    },
  }
}

/** Editor singleton. Tests build their own controls around a fake audio clock. */
export const previewClock = createPreviewControls()
