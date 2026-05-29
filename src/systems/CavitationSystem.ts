// =============================================================================
// CAVITATION SYSTEM — HarborGlow Tugboat Mode
// Realistic propeller cavitation detection, thrust penalty, amber alarm state,
// and distinct metallic/bitcrushed acoustic chatter using Tone.js.
// Follows singleton + direct-mutation + Tone pattern of commsSystem / craneSoundSystem.
// =============================================================================

import * as Tone from 'tone'
import { useGameStore } from '../store/useGameStore'

// -------------------------------------------------------------------------
// TUNING CONSTANTS (exposed for Leva / future external control)
// -------------------------------------------------------------------------

export const CAVITATION_CONFIG = {
  /** Slip ratio threshold to enter cavitation (0.0-1.0). Higher = harder to cavitate. */
  slipThreshold: 0.62,
  /** Hysteresis: must drop this far below threshold to exit (prevents chatter). */
  slipHysteresis: 0.12,
  /** Minimum time (s) in cavitation before audio + alarm latch on. */
  minDurationForAlarm: 0.55,
  /** Maximum forward speed (m/s) used for slip normalization at 100 RPM. */
  maxPropSpeed: 14.0,
  /** Thrust multiplier applied to a cavitating propeller (0.15-0.35 feels punishing). */
  thrustMultiplier: 0.22,
  /** Base burst interval (s) when barely cavitating. Faster = more intense. */
  baseBurstInterval: 0.095,
  /** How much RPM and slip shorten the burst interval. */
  rpmBurstScale: 0.65,
  /** Master volume for the entire cavitation layer. */
  masterVolume: -14,
}

// -------------------------------------------------------------------------
// RUNTIME STATE (mutated from Tugboat.tsx useFrame, read by console/HUD)
// -------------------------------------------------------------------------

export interface CavitationState {
  portCavitating: boolean
  starboardCavitating: boolean
  /** 0..1 — combined intensity used for alarm brightness and audio mix. */
  intensity: number
  /** Per-prop slip ratio (for debug / future HUD). */
  portSlip: number
  starboardSlip: number
}

export const cavitationState: CavitationState = {
  portCavitating: false,
  starboardCavitating: false,
  intensity: 0,
  portSlip: 0,
  starboardSlip: 0,
}

// -------------------------------------------------------------------------
// SYSTEM
// -------------------------------------------------------------------------

class CavitationSystem {
  private chatterSynth: Tone.MetalSynth | null = null
  private distortion: Tone.Distortion | null = null
  private highpass: Tone.Filter | null = null
  private compressor: Tone.Compressor | null = null

  private portCavitating = false
  private starboardCavitating = false
  private intensity = 0
  private portSlip = 0
  private starboardSlip = 0

  private alarmLatchTimer = 0
  private burstAccumulator = 0
  private lastUpdateTime = 0

  private enabled = true

  // -------------------------------------------------------------------------
  // AUDIO INIT (lazy, follows browser gesture rules)
  // -------------------------------------------------------------------------

  private async ensureReady(): Promise<void> {
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }
    if (this.chatterSynth) return

    // MetalSynth gives excellent metallic clack / bell character
    this.chatterSynth = new Tone.MetalSynth({
      envelope: {
        attack: 0.0008,
        decay: 0.038,
        release: 0.018,
      },
      harmonicity: 3.9,
      modulationIndex: 28,
      resonance: 4200,
      octaves: 1.6,
    })
    this.chatterSynth.frequency.value = 6200
    this.chatterSynth.volume.value = CAVITATION_CONFIG.masterVolume

    // Heavy distortion + filtering to get "bitcrushed" nasty industrial chatter
    this.distortion = new Tone.Distortion(0.92)
    this.highpass = new Tone.Filter(1850, 'highpass')
    this.compressor = new Tone.Compressor(-18, 6)

    // Chain: Metal -> Distortion -> HP -> Compressor -> Destination
    this.chatterSynth.connect(this.distortion)
    this.distortion.connect(this.highpass)
    this.highpass.connect(this.compressor)
    this.compressor.toDestination()

    // Occasional low growl layer (brown noise burst) for "loading up" feel
    // (created on-demand in triggerBurst for variety)
  }

  // -------------------------------------------------------------------------
  // SLIP & CAVITATION UPDATE (called every frame from Tugboat.tsx)
  // -------------------------------------------------------------------------

  /**
   * Compute slip and cavitation state for both props.
   * Mutates the exported singleton `cavitationState` (zero React cost for readers).
   * Also patches Zustand when alarm state changes (for console LED).
   */
  update(portRpm: number, starboardRpm: number, forwardSpeed: number, delta: number): void {
    if (!this.enabled) return

    const cfg = CAVITATION_CONFIG
    const absSpeed = Math.abs(forwardSpeed)

    // Slip = how much the prop is "spinning in place" relative to water
    // 0 = perfect bite, 1 = full cavitation (zero advance)
    const portSlipRaw = this.computeSlip(portRpm, absSpeed, cfg)
    const starboardSlipRaw = this.computeSlip(starboardRpm, absSpeed, cfg)

    // Apply light smoothing to avoid audio chatter
    this.portSlip = this.portSlip * 0.7 + portSlipRaw * 0.3
    this.starboardSlip = this.starboardSlip * 0.7 + starboardSlipRaw * 0.3

    // Hysteresis: once cavitating, require lower slip to exit
    const portThresh = this.portCavitating ? (cfg.slipThreshold - cfg.slipHysteresis) : cfg.slipThreshold
    const starboardThresh = this.starboardCavitating ? (cfg.slipThreshold - cfg.slipHysteresis) : cfg.slipThreshold

    const nextPortCav = this.portSlip > portThresh
    const nextStarboardCav = this.starboardSlip > starboardThresh

    // Latch timer: alarm + audio only after sustained cavitation
    const anyCavNow = nextPortCav || nextStarboardCav
    if (anyCavNow) {
      this.alarmLatchTimer += delta
    } else {
      this.alarmLatchTimer = Math.max(0, this.alarmLatchTimer - delta * 2.5)
    }

    const alarmActive = this.alarmLatchTimer >= cfg.minDurationForAlarm

    const prevPort = this.portCavitating
    const prevStar = this.starboardCavitating

    this.portCavitating = nextPortCav && alarmActive
    this.starboardCavitating = nextStarboardCav && alarmActive

    // Combined intensity (used for audio density + alarm LED glow)
    const rawIntensity = Math.max(this.portSlip, this.starboardSlip)
    this.intensity = Math.min(1, rawIntensity * 1.15)

    // Write to zero-cost singleton for any external reader (HUD, future systems)
    cavitationState.portCavitating = this.portCavitating
    cavitationState.starboardCavitating = this.starboardCavitating
    cavitationState.intensity = this.intensity
    cavitationState.portSlip = this.portSlip
    cavitationState.starboardSlip = this.starboardSlip

    // Push to Zustand only on meaningful edge transitions (cheap + prevents render spam)
    if (prevPort !== this.portCavitating || prevStar !== this.starboardCavitating) {
      useGameStore.getState().updateTugboatState({
        portCavitating: this.portCavitating,
        starboardCavitating: this.starboardCavitating,
        cavitationIntensity: this.intensity,
      })
    }

    // Drive audio (only when we have real cavitation)
    if (this.portCavitating || this.starboardCavitating) {
      void this.driveChatterAudio(portRpm, starboardRpm, delta)
    } else if (this.chatterSynth) {
      // Let the short-decay synth naturally quiet; we don't need explicit release
    }
  }

  private computeSlip(rpm: number, absSpeed: number, cfg: typeof CAVITATION_CONFIG): number {
    const commanded = (Math.abs(rpm) / 100) * cfg.maxPropSpeed
    if (commanded < 0.4) return 0
    const slip = (commanded - absSpeed) / Math.max(commanded, 0.1)
    return Math.max(0, Math.min(1, slip))
  }

  // -------------------------------------------------------------------------
  // AUDIO — Metallic clacking / bitcrushed chatter
  // -------------------------------------------------------------------------

  private async driveChatterAudio(portRpm: number, starboardRpm: number, delta: number): Promise<void> {
    await this.ensureReady()
    if (!this.chatterSynth) return

    const cfg = CAVITATION_CONFIG
    const avgRpm = (Math.abs(portRpm) + Math.abs(starboardRpm)) / 2
    const rpmFactor = Math.min(1, avgRpm / 78)

    // Intensity already incorporates slip. Higher = faster, harsher bursts.
    const density = 0.6 + this.intensity * 2.1 + rpmFactor * 0.8

    // Variable burst interval (faster when slipping hard + high RPM)
    const interval = Math.max(0.022, cfg.baseBurstInterval / density)

    this.burstAccumulator += delta

    while (this.burstAccumulator >= interval) {
      this.burstAccumulator -= interval
      this.triggerBurst(avgRpm, this.intensity)
    }
  }

  private triggerBurst(avgRpm: number, intensity: number): void {
    if (!this.chatterSynth || !this.distortion || !this.highpass) return

    const rpmNorm = Math.min(1, Math.abs(avgRpm) / 92)

    // Slightly lower frequency + more "crunch" at high intensity
    const freq = 4800 + rpmNorm * 2100 - intensity * 1400
    this.chatterSynth.frequency.value = Math.max(2100, freq)

    // Random micro-variation so it never feels robotic
    const detune = (Math.random() - 0.5) * 0.7
    const volJitter = (Math.random() - 0.5) * 2.5

    const baseVol = CAVITATION_CONFIG.masterVolume + intensity * 5.5 + volJitter
    this.chatterSynth.volume.value = baseVol

    // Very short, hard strike — the "clack"
    const dur = 0.018 + intensity * 0.011 + Math.random() * 0.008
    this.chatterSynth.triggerAttackRelease(dur, Tone.now() + detune * 0.0015)

    // Occasional nasty low "growl" layer on high-intensity cavitation (one side only)
    if (intensity > 0.72 && Math.random() < 0.18) {
      this.spawnGrowlBurst(intensity)
    }
  }

  private spawnGrowlBurst(intensity: number): void {
    // Ephemeral brown-noise growl for "prop loading / venting" texture
    try {
      const growl = new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: {
          attack: 0.001,
          decay: 0.07 + intensity * 0.04,
          sustain: 0,
          release: 0.04,
        },
        volume: CAVITATION_CONFIG.masterVolume + 6 + intensity * 4,
      })

      const lp = new Tone.Filter(420 + intensity * 180, 'lowpass')
      const dist = new Tone.Distortion(0.6 + intensity * 0.3)

      growl.connect(dist)
      dist.connect(lp)
      lp.toDestination()

      growl.triggerAttackRelease(0.06 + Math.random() * 0.03, Tone.now())

      // Auto cleanup to avoid leaking voices
      setTimeout(() => {
        try { growl.dispose(); lp.dispose(); dist.dispose() } catch {}
      }, 420)
    } catch {
      // Audio context edge case — ignore
    }
  }

  // -------------------------------------------------------------------------
  // PUBLIC QUERIES (used by physics for thrust penalty)
  // -------------------------------------------------------------------------

  isPortCavitating(): boolean { return this.portCavitating }
  isStarboardCavitating(): boolean { return this.starboardCavitating }

  getThrustMultiplier(side: 'port' | 'starboard'): number {
    const cav = side === 'port' ? this.portCavitating : this.starboardCavitating
    return cav ? CAVITATION_CONFIG.thrustMultiplier : 1.0
  }

  getIntensity(): number { return this.intensity }

  getState(): CavitationState {
    return {
      portCavitating: this.portCavitating,
      starboardCavitating: this.starboardCavitating,
      intensity: this.intensity,
      portSlip: this.portSlip,
      starboardSlip: this.starboardSlip,
    }
  }

  // -------------------------------------------------------------------------
  // UTILS
  // -------------------------------------------------------------------------

  resetCavitation(): void {
    this.portCavitating = false
    this.starboardCavitating = false
    this.intensity = 0
    this.portSlip = 0
    this.starboardSlip = 0
    this.alarmLatchTimer = 0
    this.burstAccumulator = 0

    Object.assign(cavitationState, {
      portCavitating: false,
      starboardCavitating: false,
      intensity: 0,
      portSlip: 0,
      starboardSlip: 0,
    })

    // Best-effort: clear any pending store flags
    try {
      useGameStore.getState().updateTugboatState({
        portCavitating: false,
        starboardCavitating: false,
        cavitationIntensity: 0,
      })
    } catch {}

    if (this.chatterSynth) {
      this.chatterSynth.volume.rampTo(-99, 0.08)
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.resetCavitation()
  }
}

export const cavitationSystem = new CavitationSystem()

// Optional helper for Leva debug panels
export function getCavitationDebugBindings() {
  return {
    ...CAVITATION_CONFIG,
    reset: () => cavitationSystem.resetCavitation(),
  }
}
