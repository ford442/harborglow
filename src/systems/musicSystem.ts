import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

/**
 * useMusicSystem — manages per-ship audio playback using the Web Audio API
 * (via Tone.js synth) so no audio files are needed.
 * Beat detection updates musicBPM in the store so lights can react.
 *
 * Each ship type gets a distinct procedural pattern:
 * - CRUISE_LINER: sweeping pads + bass line
 * - CONTAINER_VESSEL: industrial 4/4 pulse
 * - OIL_TANKER: slow drone with deep sub-bass
 */
export function useMusicSystem() {
  const musicPlaying = useGameStore((s) => s.musicPlaying)
  const currentShip = useGameStore((s) => s.currentShip)
  const setMusicBPM = useGameStore((s) => s.setMusicBPM)

  // We keep a ref to the Tone Transport start so we can stop it
  const started = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!musicPlaying || !currentShip) return

    // Dynamically import Tone.js to avoid SSR issues
    let cancelled = false

    ;(async () => {
      const Tone = await import('tone')

      if (cancelled) return

      await Tone.start()

      let bpm = 120
      let cleanup: (() => void) | null = null

      switch (currentShip.type) {
        case 'CRUISE_LINER': {
          bpm = 90
          Tone.getTransport().bpm.value = bpm
          const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.2 },
          }).toDestination()
          const bass = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.8 },
          }).toDestination()
          bass.volume.value = -6
          synth.volume.value = -12

          const chords = ['C4 E4 G4', 'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4']
          let ci = 0
          const bassNotes = ['C2', 'A1', 'F1', 'G1']
          const seq = new Tone.Sequence((time, _) => {
            synth.triggerAttackRelease(chords[ci % chords.length].split(' '), '2n', time)
            bass.triggerAttackRelease(bassNotes[ci % bassNotes.length], '2n', time)
            ci++
          }, [0], '2n')

          seq.start(0)
          Tone.getTransport().start()
          cleanup = () => { seq.stop(); seq.dispose(); synth.dispose(); bass.dispose(); Tone.getTransport().stop() }
          break
        }

        case 'CONTAINER_VESSEL': {
          bpm = 128
          Tone.getTransport().bpm.value = bpm
          const kick = new Tone.MembraneSynth().toDestination()
          kick.volume.value = -4
          const hihat = new Tone.MetalSynth({
            frequency: 400,
            envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5,
          }).toDestination()
          hihat.volume.value = -20

          const pattern = new Tone.Sequence(
            (time, note) => {
              if (note === 'kick') kick.triggerAttackRelease('C1', '8n', time)
              else hihat.triggerAttackRelease('16n', time)
            },
            ['kick', 'hat', 'kick', 'kick', 'hat', 'hat', 'kick', 'hat'],
            '8n'
          )
          pattern.start(0)
          Tone.getTransport().start()
          cleanup = () => { pattern.stop(); pattern.dispose(); kick.dispose(); hihat.dispose(); Tone.getTransport().stop() }
          break
        }

        case 'OIL_TANKER': {
          bpm = 60
          Tone.getTransport().bpm.value = bpm
          const drone = new Tone.Synth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 2, decay: 0.5, sustain: 1, release: 3 },
          }).toDestination()
          drone.volume.value = -10
          const filter = new Tone.Filter(200, 'lowpass').toDestination()
          drone.connect(filter)

          drone.triggerAttack('C1')
          Tone.getTransport().start()
          cleanup = () => { drone.triggerRelease(); drone.dispose(); filter.dispose(); Tone.getTransport().stop() }
          break
        }
      }

      setMusicBPM(bpm)
      cleanupRef.current = cleanup
      started.current = true
    })()

    return () => {
      cancelled = true
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
        started.current = false
      }
    }
  }, [musicPlaying, currentShip?.id])
}
