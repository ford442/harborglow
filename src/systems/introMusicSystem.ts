import * as Tone from 'tone'
import { audioVisualSync } from './audioVisualSync'

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

class IntroMusicSystem {
  private player: Tone.Player | null = null
  private loopPlayer: Tone.Player | null = null
  private volume: Tone.Volume | null = null
  private mode: IntroMode = 'idle'
  private isInitialized = false
  private fileExists = { intro: false, loop: false }

  // Procedural fallback synths
  private fallbackSynths: any[] = []
  private fallbackEffects: any[] = []
  private fallbackTransportId: number | null = null

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    await Tone.start()

    // Try to load AI-generated assets
    await this.loadPlayers()

    // If no assets, prepare procedural fallback
    if (!this.fileExists.intro) {
      this.initializeFallbackSynths()
    }

    // Set global BPM for beat-sync systems
    audioVisualSync.setBPM(INTRO_BPM)

    this.isInitialized = true
    console.log(`🎵 IntroMusicSystem initialized (mode: ${this.fileExists.intro ? 'AI audio' : 'procedural fallback'})`)
  }

  private async loadPlayers(): Promise<void> {
    const testAndLoad = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok
      } catch {
        return false
      }
    }

    const [introExists, loopExists] = await Promise.all([
      testAndLoad(INTRO_TRACK_URL),
      testAndLoad(LOOP_TRACK_URL),
    ])

    this.fileExists.intro = introExists
    this.fileExists.loop = loopExists

    if (introExists) {
      this.player = new Tone.Player({
        url: INTRO_TRACK_URL,
        loop: true,
        autostart: false,
        fadeIn: 0.5,
        fadeOut: 1.0,
      })
      this.player.sync()
    }

    if (loopExists) {
      this.loopPlayer = new Tone.Player({
        url: LOOP_TRACK_URL,
        loop: true,
        autostart: false,
        fadeIn: 0.5,
        fadeOut: 1.0,
      })
      this.loopPlayer.sync()
    }

    // Shared volume node for crossfading
    this.volume = new Tone.Volume(-Infinity).toDestination()

    if (this.player) this.player.connect(this.volume)
    if (this.loopPlayer) this.loopPlayer.connect(this.volume)
  }

  // ---------------------------------------------------------------------------
  // PROCEDURAL FALLBACK
  // ---------------------------------------------------------------------------

  private initializeFallbackSynths(): void {
    const reverb = new Tone.Reverb({ decay: 4, preDelay: 0.2, wet: 0.35 }).toDestination()
    const chorus = new Tone.Chorus({ frequency: 2, delayTime: 3.5, depth: 0.5, wet: 0.3 }).connect(reverb)
    const limiter = new Tone.Limiter(-2).connect(chorus)

    this.fallbackEffects.push(reverb, chorus, limiter)

    // Supersaw lead
    const lead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 5, spread: 20 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 },
    }).connect(limiter)
    lead.volume.value = -10
    this.fallbackSynths.push(lead)

    // M1-style piano
    const piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.8 },
    }).connect(chorus)
    piano.volume.value = -12
    this.fallbackSynths.push(piano)

    // Off-beat bass
    const bass = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.8, release: 0.3 },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
    }).connect(limiter)
    bass.volume.value = -6
    this.fallbackSynths.push(bass)

    // 909-ish kick
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
    }).connect(limiter)
    kick.volume.value = -4
    this.fallbackSynths.push(kick)

    // Hi-hats
    const hats = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(limiter)
    hats.volume.value = -16
    this.fallbackSynths.push(hats)
  }

  private startFallback(): void {
    const transport = Tone.getTransport()
    transport.bpm.value = INTRO_BPM

    const [lead, piano, bass, kick, hats] = this.fallbackSynths

    // Lead melody (drop section)
    const leadPart = new Tone.Sequence((time, note) => {
      if (note) lead?.triggerAttackRelease(note, '8n', time)
    }, ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', null])
    leadPart.loop = true

    // Piano chords
    const pianoPart = new Tone.Part((time, value) => {
      piano?.triggerAttackRelease(value.notes, value.duration, time)
    }, [
      { time: '0:0', notes: ['C4', 'E4', 'G4'], duration: '2n' },
      { time: '2:0', notes: ['F4', 'A4', 'C5'], duration: '2n' },
    ])
    pianoPart.loop = true
    pianoPart.loopEnd = '4:0'

    // Off-beat bass
    const bassPart = new Tone.Sequence((time, note) => {
      if (note) bass?.triggerAttackRelease(note, '16n', time)
    }, [null, 'C2', null, 'C2', null, 'G2', null, 'G2'])
    bassPart.loop = true

    // Kick on beat
    const kickPart = new Tone.Sequence(() => {
      kick?.triggerAttackRelease('C1', '8n')
    }, ['C1', null, 'C1', null])
    kickPart.loop = true

    // Hats on off-beats
    const hatPart = new Tone.Sequence((time) => {
      hats?.triggerAttackRelease('32n', time)
    }, [null, 'C5', null, 'C5'])
    hatPart.loop = true

    // Start everything
    leadPart.start(0)
    pianoPart.start(0)
    bassPart.start(0)
    kickPart.start(0)
    hatPart.start(0)

    transport.start()
    this.mode = 'title'
  }

  private stopFallback(): void {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    this.fallbackSynths.forEach((s: any) => {
      if (typeof s.releaseAll === 'function') s.releaseAll()
      else if (typeof s.triggerRelease === 'function') s.triggerRelease()
    })
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

    if (this.player && this.fileExists.intro) {
      this.player.start()
      if (this.volume) this.volume.volume.rampTo(0, 1.0)
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

    if (this.loopPlayer && this.fileExists.loop) {
      // Crossfade: ramp down current, swap, ramp up
      if (this.volume) {
        this.volume.volume.rampTo(-20, 0.5)
        await new Promise((r) => setTimeout(r, 500))
      }
      this.player?.stop()
      this.stopFallback()
      this.loopPlayer.start()
      if (this.volume) this.volume.volume.rampTo(0, 1.0)
    } else if (this.player && this.fileExists.intro) {
      // No loop asset — just keep playing the intro track quieter
      if (this.volume) this.volume.volume.rampTo(-6, 1.0)
    } else {
      // Procedural fallback — continue playing, maybe filter down
      this.stopFallback()
      this.startFallback()
    }

    console.log('▶️ IntroMusicSystem: playing loading loop')
  }

  /** Fade out and stop all intro audio. */
  async fadeOut(duration = 2.0): Promise<void> {
    if (this.mode === 'idle') return

    if (this.volume) {
      this.volume.volume.rampTo(-Infinity, duration)
    }

    await new Promise((r) => setTimeout(r, duration * 1000))

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
    if (this.volume) this.volume.volume.value = -Infinity
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
    this.volume?.dispose()
    this.fallbackSynths.forEach((s) => s.dispose())
    this.fallbackEffects.forEach((e) => e.dispose())
    this.isInitialized = false
  }
}

export const introMusicSystem = new IntroMusicSystem()
