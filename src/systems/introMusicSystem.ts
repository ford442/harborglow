import { audioVisualSync } from './audioVisualSync'
import { BeatTransport, scheduleLoop, scheduleSequence } from './audio/transport'
import { Instrument, SamplePlayer, unlockAudio } from './audio/voices'

// =============================================================================
// INTRO MUSIC SYSTEM — HarborGlow
// Plays the title anthem on the Main Menu and bridges into the Loading screen.
// Supports AI-generated MP3 assets (MiniMax) with a procedural fallback.
// =============================================================================

const INTRO_TRACK_URL = './audio/clear_harbor_glow_intro.mp3'
const LOOP_TRACK_URL = './audio/clear_harbor_glow_loop.mp3'
const INTRO_BPM = 140

/** Current playback mode of the intro music system. */
type IntroMode = 'idle' | 'title' | 'loading' | 'fading'

const wait = (seconds: number) => new Promise((r) => setTimeout(r, seconds * 1000))

class IntroMusicSystem {
  private player: SamplePlayer | null = null
  private loopPlayer: SamplePlayer | null = null
  private mode: IntroMode = 'idle'
  private isInitialized = false

  // Procedural fallback. Menu music plays before the sim runs, so it keeps
  // its own audio-clocked transport instead of the shared sim-clocked one.
  private readonly fallbackTransport = new BeatTransport()
  private fallbackSynths: Instrument[] = []

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    await unlockAudio()

    // Try to load AI-generated assets
    await this.loadPlayers()

    // If no assets, prepare procedural fallback
    if (!this.player) {
      this.initializeFallbackSynths()
    }

    // Set global BPM for beat-sync systems
    audioVisualSync.setBPM(INTRO_BPM)

    this.isInitialized = true
    console.log(`🎵 IntroMusicSystem initialized (mode: ${this.player ? 'AI audio' : 'procedural fallback'})`)
  }

  private async loadPlayers(): Promise<void> {
    const tryLoad = async (url: string): Promise<SamplePlayer | null> => {
      try {
        const head = await fetch(url, { method: 'HEAD' })
        if (!head.ok) return null
        const player = new SamplePlayer(url, { loop: true })
        await player.load()
        return player.loaded ? player : null
      } catch (error) {
        console.warn(`🎵 IntroMusicSystem: could not load ${url}`, error)
        return null
      }
    }

    const [intro, loop] = await Promise.all([tryLoad(INTRO_TRACK_URL), tryLoad(LOOP_TRACK_URL)])
    this.player = intro
    this.loopPlayer = loop
  }

  // ---------------------------------------------------------------------------
  // PROCEDURAL FALLBACK
  // ---------------------------------------------------------------------------

  private initializeFallbackSynths(): void {
    this.fallbackSynths = [
      // Supersaw lead
      new Instrument({
        waveform: 'supersaw',
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 },
        volumeDb: -10,
      }),
      // M1-style piano
      new Instrument({
        waveform: 'triangle',
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.8 },
        volumeDb: -12,
      }),
      // Off-beat bass
      new Instrument({
        waveform: 'square',
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.8, release: 0.3 },
        volumeDb: -6,
      }),
      // 909-ish kick
      new Instrument({
        waveform: 'membrane',
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
        volumeDb: -4,
      }),
      // Hi-hats
      new Instrument({
        waveform: 'metal',
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.01 },
        volumeDb: -16,
      }),
    ]
  }

  private startFallback(): void {
    const transport = this.fallbackTransport
    transport.cancel()
    transport.bpm = INTRO_BPM

    const [lead, piano, bass, kick, hats] = this.fallbackSynths

    // Lead melody (drop section)
    scheduleSequence(transport, ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', null], 1, (_beat, note) => {
      lead?.play(note, '8n')
    })

    // Piano chords
    scheduleLoop(transport, [
      { beat: 0, notes: ['C4', 'E4', 'G4'] },
      { beat: 8, notes: ['F4', 'A4', 'C5'] },
    ], 16, (_beat, chord) => {
      piano?.play(chord.notes, '2n')
    })

    // Off-beat bass
    scheduleSequence(transport, [null, 'C2', null, 'C2', null, 'G2', null, 'G2'], 1, (_beat, note) => {
      bass?.play(note, '16n')
    })

    // Kick on beat
    scheduleSequence(transport, ['C1', null, 'C1', null], 1, (_beat, note) => {
      kick?.play(note, '8n')
    })

    // Hats on off-beats
    scheduleSequence(transport, [null, 'C5', null, 'C5'], 1, () => {
      hats?.play(240, '32n')
    })

    transport.start({ clock: 'audio', atBeat: 0 })
    this.mode = 'title'
  }

  private stopFallback(): void {
    this.fallbackTransport.stop()
    this.fallbackTransport.cancel()
    this.fallbackSynths.forEach((s) => s.release())
    this.mode = 'idle'
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /** Start the full title track (menu screen). */
  async playTitle(): Promise<void> {
    await this.initialize()

    if (this.mode === 'title') return

    // Fade out whatever is currently playing
    if (this.mode !== 'idle') {
      await this.fadeOut(0.5)
    }

    this.mode = 'title'

    if (this.player) {
      this.player.fadeTo(-Infinity, 0)
      this.player.start()
      this.player.fadeTo(0, 1.0)
    } else {
      this.startFallback()
    }

    audioVisualSync.setBPM(INTRO_BPM)
    console.log('▶️ IntroMusicSystem: playing title track')
  }

  /** Crossfade to the instrumental loading loop. */
  async playLoadingLoop(): Promise<void> {
    await this.initialize()

    if (this.mode === 'loading') return
    this.mode = 'loading'

    if (this.loopPlayer) {
      // Crossfade: ramp down current, swap, ramp up
      this.player?.fadeTo(-20, 0.5)
      await wait(0.5)
      this.player?.stop()
      this.stopFallback()
      this.mode = 'loading'
      this.loopPlayer.fadeTo(-Infinity, 0)
      this.loopPlayer.start()
      this.loopPlayer.fadeTo(0, 1.0)
    } else if (this.player) {
      // No loop asset — just keep playing the intro track quieter
      this.player.fadeTo(-6, 1.0)
    } else {
      // Procedural fallback — restart the pattern for the loading screen
      this.stopFallback()
      this.startFallback()
      this.mode = 'loading'
    }

    console.log('▶️ IntroMusicSystem: playing loading loop')
  }

  /** Fade out and stop all intro audio. */
  async fadeOut(duration = 2.0): Promise<void> {
    if (this.mode === 'idle') return

    this.mode = 'fading'
    this.player?.fadeTo(-Infinity, duration)
    this.loopPlayer?.fadeTo(-Infinity, duration)

    await wait(duration)

    this.player?.stop()
    this.loopPlayer?.stop()
    this.stopFallback()
    this.mode = 'idle'

    console.log('⏹️ IntroMusicSystem: faded out')
  }

  /** Hard stop (no fade). */
  stop(): void {
    this.player?.stop()
    this.loopPlayer?.stop()
    this.stopFallback()
    this.mode = 'idle'
  }

  isPlaying(): boolean {
    return this.mode !== 'idle' && this.mode !== 'fading'
  }

  getMode(): IntroMode {
    return this.mode
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  dispose(): void {
    this.stop()
    this.player?.dispose()
    this.loopPlayer?.dispose()
    this.fallbackTransport.dispose()
    this.fallbackSynths.forEach((s) => s.dispose())
    this.player = null
    this.loopPlayer = null
    this.fallbackSynths = []
    this.isInitialized = false
  }
}

export const introMusicSystem = new IntroMusicSystem()
