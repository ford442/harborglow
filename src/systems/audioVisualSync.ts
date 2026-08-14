import * as Tone from 'tone'
import { useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { wasmDSP } from './wasmDSP'

// =============================================================================
// PHASE 8: AUDIO-VISUAL SYNCHRONIZATION SYSTEM
// Real-time AnalyserNode + FFT analysis → Visual pipeline for light shows
// =============================================================================

export interface AudioAnalysisData {
  // Frequency bands (0-1 normalized)
  bass: number      // 20-140Hz
  lowMid: number    // 140-400Hz
  mid: number       // 400-2.6kHz
  highMid: number   // 2.6-5.2kHz
  treble: number    // 5.2-20kHz

  // Waveform/envelope
  waveform: Float32Array  // 256 samples
  envelope: number        // 0-1 amplitude envelope

  // Beat detection
  beat: boolean
  beatIntensity: number
  beatPhase: number       // 0-1 within beat

  // RMS levels
  rms: number
  peak: number

  // Derived values
  energy: number          // Overall energy 0-1
  spectralCentroid: number // Brightness indicator
}

// ---------------------------------------------------------------------------
// Pure band / onset helpers (testable without Tone)
// ---------------------------------------------------------------------------

export const BAND_BIN_RANGES = {
  bass: [0, 4] as const,
  mid: [5, 43] as const,
  treble: [44, 512] as const,
}

export function meanByteBins(buf: Uint8Array, start: number, end: number): number {
  let sum = 0
  const count = end - start + 1
  if (count <= 0) return 0
  for (let i = start; i <= end; i++) {
    sum += buf[i] ?? 0
  }
  return sum / count / 255
}

export function computeMeasuredBands(byteBuf: Uint8Array): { bass: number; mid: number; treble: number } {
  return {
    bass: meanByteBins(byteBuf, BAND_BIN_RANGES.bass[0], BAND_BIN_RANGES.bass[1]),
    mid: meanByteBins(byteBuf, BAND_BIN_RANGES.mid[0], BAND_BIN_RANGES.mid[1]),
    treble: meanByteBins(byteBuf, BAND_BIN_RANGES.treble[0], BAND_BIN_RANGES.treble[1]),
  }
}

export function mapBandsToAnalysisFields(
  bass: number,
  mid: number,
  treble: number,
): { bass: number; lowMid: number; mid: number; highMid: number; treble: number } {
  return {
    bass: Math.min(1, bass),
    lowMid: Math.min(1, bass * 0.85),
    mid: Math.min(1, mid),
    highMid: Math.min(1, (mid + treble) / 2),
    treble: Math.min(1, treble),
  }
}

export function computeSpectralCentroidFromBytes(buf: Uint8Array): number {
  let weighted = 0
  let magnitude = 0
  const len = Math.min(buf.length, 512)
  for (let i = 0; i < len; i++) {
    const mag = buf[i]
    weighted += i * mag
    magnitude += mag
  }
  return magnitude > 0 ? Math.min(1, weighted / magnitude / len) : 0.5
}

export interface OnsetDetectorState {
  rollingBassAvg: number
  lastBeatTime: number
}

export interface OnsetDetectorOptions {
  onsetMultiplier?: number
  bassFloor?: number
  emaAlpha?: number
  minIntervalFloor?: number
}

export interface OnsetDetectorResult {
  beat: boolean
  beatPhase: number
  rollingBassAvg: number
  lastBeatTime: number
  shouldFireCallback: boolean
}

export function createOnsetDetectorState(): OnsetDetectorState {
  return { rollingBassAvg: 0, lastBeatTime: 0 }
}

export function detectBeatOnset(
  state: OnsetDetectorState,
  bass: number,
  now: number,
  bpm: number,
  options: OnsetDetectorOptions = {},
): OnsetDetectorResult {
  const onsetMultiplier = options.onsetMultiplier ?? 1.5
  const bassFloor = options.bassFloor ?? 0.05
  const emaAlpha = options.emaAlpha ?? 0.15
  const minIntervalFloor = options.minIntervalFloor ?? 0.2

  const rollingBassAvg =
    state.rollingBassAvg * (1 - emaAlpha) + bass * emaAlpha

  const beatDuration = 60 / Math.max(bpm, 1)
  const minInterval = Math.max(minIntervalFloor, beatDuration)
  const onsetDetected =
    bass > rollingBassAvg * onsetMultiplier && bass > bassFloor
  const beatAccepted =
    onsetDetected && now - state.lastBeatTime >= minInterval

  let lastBeatTime = state.lastBeatTime
  let beatPhase: number

  if (beatAccepted) {
    lastBeatTime = now
    beatPhase = 0
  } else {
    const timeSinceBeat = now - state.lastBeatTime
    beatPhase = Math.min(1, timeSinceBeat / beatDuration)
  }

  return {
    beat: beatAccepted,
    beatPhase,
    rollingBassAvg,
    lastBeatTime,
    shouldFireCallback: beatAccepted,
  }
}

/** Convert Tone.FFT dB bin to 0-1 proxy for fallback band reads. */
function dbBinToNormalized(db: number): number {
  return Math.min(1, Math.max(0, (db + 100) / 100))
}

function fillByteScratchFromDbFft(fftValues: Float32Array, scratch: Uint8Array): void {
  const len = Math.min(fftValues.length, scratch.length)
  for (let i = 0; i < len; i++) {
    scratch[i] = dbBinToNormalized(fftValues[i]) * 255
  }
}

// Global audio analysis state - mutated in place once per frame (zero-alloc),
// consumed by all systems. The binding itself never rebinds, so subscribers can
// hold the reference returned by getAudioAnalysisData() across frames.
const globalAudioData: AudioAnalysisData = {
  bass: 0,
  lowMid: 0,
  mid: 0,
  highMid: 0,
  treble: 0,
  waveform: new Float32Array(256),
  envelope: 0,
  beat: false,
  beatIntensity: 0,
  beatPhase: 0,
  rms: 0,
  peak: 0,
  energy: 0,
  spectralCentroid: 0.5,
}

// Get current audio data (for non-React contexts)
export function getAudioAnalysisData(): AudioAnalysisData {
  return globalAudioData
}

// =============================================================================
// CORE AUDIO VISUAL SYNC SYSTEM
// =============================================================================

export class AudioVisualSync {
  private fft: Tone.FFT | null = null
  private waveform: Tone.Waveform | null = null
  private meter: Tone.Meter | null = null
  private filterBass: Tone.Filter | null = null
  private filterLowMid: Tone.Filter | null = null
  private filterMid: Tone.Filter | null = null
  private filterHighMid: Tone.Filter | null = null
  private filterTreble: Tone.Filter | null = null
  private meters: Map<string, Tone.Meter> = new Map()

  private analyser: AnalyserNode | null = null
  private frequencyByteBuffer: Uint8Array | null = null
  private fftByteScratch: Uint8Array | null = null

  private onsetState: OnsetDetectorState = createOnsetDetectorState()
  private bpm: number = 128
  private isInitialized: boolean = false

  private onBeatCallbacks: Set<(intensity: number) => void> = new Set()
  private onFrameCallbacks: Set<(data: AudioAnalysisData) => void> = new Set()

  async initialize() {
    if (this.isInitialized) return

    await Tone.start()
    wasmDSP.init().catch(() => {})

    this.fft = new Tone.FFT(2048)
    this.waveform = new Tone.Waveform(256)
    this.meter = new Tone.Meter()
    this.fftByteScratch = new Uint8Array(1024)

    this.filterBass = new Tone.Filter(80, 'lowpass', -24)
    this.filterLowMid = new Tone.Filter(270, 'peaking', -12)
    this.filterLowMid.Q.value = 2
    this.filterMid = new Tone.Filter(1500, 'peaking', -12)
    this.filterMid.Q.value = 2
    this.filterHighMid = new Tone.Filter(3900, 'peaking', -12)
    this.filterHighMid.Q.value = 2
    this.filterTreble = new Tone.Filter(10000, 'highpass', -24)

    this.meters.set('bass', new Tone.Meter())
    this.meters.set('lowMid', new Tone.Meter())
    this.meters.set('mid', new Tone.Meter())
    this.meters.set('highMid', new Tone.Meter())
    this.meters.set('treble', new Tone.Meter())

    const bassMeter = this.meters.get('bass')
    const lowMidMeter = this.meters.get('lowMid')
    const midMeter = this.meters.get('mid')
    const highMidMeter = this.meters.get('highMid')
    const trebleMeter = this.meters.get('treble')

    if (bassMeter && this.filterBass) this.filterBass.connect(bassMeter)
    if (lowMidMeter && this.filterLowMid) this.filterLowMid.connect(lowMidMeter)
    if (midMeter && this.filterMid) this.filterMid.connect(midMeter)
    if (highMidMeter && this.filterHighMid) this.filterHighMid.connect(highMidMeter)
    if (trebleMeter && this.filterTreble) this.filterTreble.connect(trebleMeter)

    Tone.Destination.connect(this.fft)
    if (this.waveform) Tone.Destination.connect(this.waveform)
    if (this.meter) Tone.Destination.connect(this.meter)
    if (this.filterBass) Tone.Destination.connect(this.filterBass)
    if (this.filterLowMid) Tone.Destination.connect(this.filterLowMid)
    if (this.filterMid) Tone.Destination.connect(this.filterMid)
    if (this.filterHighMid) Tone.Destination.connect(this.filterHighMid)
    if (this.filterTreble) Tone.Destination.connect(this.filterTreble)

    try {
      const rawContext = Tone.getContext().rawContext
      if (rawContext) {
        this.analyser = rawContext.createAnalyser()
        this.analyser.fftSize = 2048
        this.frequencyByteBuffer = new Uint8Array(this.analyser.frequencyBinCount)
        Tone.Destination.connect(this.analyser)
      }
    } catch {
      this.analyser = null
      this.frequencyByteBuffer = null
    }

    this.isInitialized = true
    console.log('🎵 AudioVisualSync initialized')
  }

  analyze(time: number): AudioAnalysisData {
    if (!this.isInitialized || !this.fft || !this.waveform || !this.meter) {
      return globalAudioData
    }

    let measuredBass = 0
    let measuredMid = 0
    let measuredTreble = 0
    let spectralCentroid = 0.5

    if (this.analyser && this.frequencyByteBuffer) {
      this.analyser.getByteFrequencyData(this.frequencyByteBuffer as Uint8Array<ArrayBuffer>)
      const bands = computeMeasuredBands(this.frequencyByteBuffer)
      measuredBass = bands.bass
      measuredMid = bands.mid
      measuredTreble = bands.treble
      spectralCentroid = computeSpectralCentroidFromBytes(this.frequencyByteBuffer)
    } else if (this.fftByteScratch) {
      const fftValues = this.fft.getValue() as Float32Array
      fillByteScratchFromDbFft(fftValues, this.fftByteScratch)
      const bands = computeMeasuredBands(this.fftByteScratch)
      measuredBass = bands.bass
      measuredMid = bands.mid
      measuredTreble = bands.treble
      spectralCentroid = computeSpectralCentroidFromBytes(this.fftByteScratch)
    }

    const mapped = mapBandsToAnalysisFields(measuredBass, measuredMid, measuredTreble)

    const waveValues = this.waveform.getValue() as Float32Array
    const waveformOut = globalAudioData.waveform
    const waveLen = Math.min(waveValues.length, waveformOut.length)
    let peak = 0
    for (let i = 0; i < waveLen; i++) {
      const sample = waveValues[i]
      waveformOut[i] = sample
      const abs = sample < 0 ? -sample : sample
      if (abs > peak) peak = abs
    }

    const rms = wasmDSP.audioRms(waveValues)
    const meterRms = this.meter.getValue() as number
    const rmsFinal = rms > 0 ? rms : Math.max(0, meterRms)

    const envelope = Math.min(1, rmsFinal * 2)

    const bassScaled = Math.min(1, mapped.bass * 2)
    const lowMidScaled = Math.min(1, mapped.lowMid * 2)
    const midScaled = Math.min(1, mapped.mid * 2)
    const highMidScaled = Math.min(1, mapped.highMid * 2)
    const trebleScaled = Math.min(1, mapped.treble * 3)

    const energy = Math.min(
      1,
      ((bassScaled + lowMidScaled + midScaled + highMidScaled + trebleScaled) / 5) * 1.5,
    )

    const onset = detectBeatOnset(this.onsetState, measuredBass, time, this.bpm)
    this.onsetState.rollingBassAvg = onset.rollingBassAvg
    this.onsetState.lastBeatTime = onset.lastBeatTime

    if (onset.shouldFireCallback && Tone.getTransport().state === 'started') {
      this.onBeatCallbacks.forEach((cb) => cb(measuredBass))
    }

    globalAudioData.bass = bassScaled
    globalAudioData.lowMid = lowMidScaled
    globalAudioData.mid = midScaled
    globalAudioData.highMid = highMidScaled
    globalAudioData.treble = trebleScaled
    globalAudioData.envelope = Math.max(0, envelope)
    globalAudioData.beat = onset.beat
    globalAudioData.beatIntensity = measuredBass
    globalAudioData.beatPhase = onset.beatPhase
    globalAudioData.rms = Math.max(0, rmsFinal)
    globalAudioData.peak = Math.min(1, peak)
    globalAudioData.energy = energy
    globalAudioData.spectralCentroid = Math.min(1, spectralCentroid)

    this.onFrameCallbacks.forEach((cb) => cb(globalAudioData))

    return globalAudioData
  }

  setBPM(bpm: number) {
    this.bpm = bpm
  }

  onBeat(callback: (intensity: number) => void) {
    this.onBeatCallbacks.add(callback)
    return () => {
      this.onBeatCallbacks.delete(callback)
    }
  }

  onFrame(callback: (data: AudioAnalysisData) => void) {
    this.onFrameCallbacks.add(callback)
    return () => {
      this.onFrameCallbacks.delete(callback)
    }
  }

  dispose() {
    if (this.analyser) {
      try {
        Tone.Destination.disconnect(this.analyser)
      } catch {
        // already disconnected
      }
      this.analyser = null
      this.frequencyByteBuffer = null
    }
    this.fft?.dispose()
    this.waveform?.dispose()
    this.meter?.dispose()
    this.filterBass?.dispose()
    this.filterLowMid?.dispose()
    this.filterMid?.dispose()
    this.filterHighMid?.dispose()
    this.filterTreble?.dispose()
    this.meters.forEach((m) => m.dispose())
    this.onBeatCallbacks.clear()
    this.onFrameCallbacks.clear()
    this.isInitialized = false
  }
}

// Singleton instance
export const audioVisualSync = new AudioVisualSync()

// =============================================================================
// REACT HOOK: useAudioData
// Subscribe to audio analysis data without useFrame — safe outside Canvas.
// =============================================================================

export function useAudioData(): AudioAnalysisData {
  const [audioData, setAudioData] = useState<AudioAnalysisData>(globalAudioData)

  useEffect(() => {
    let mounted = true
    const unsubscribe = audioVisualSync.onFrame((data) => {
      if (mounted) setAudioData(data)
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  return audioData
}

// =============================================================================
// REACT HOOK: useAudioVisualSync
// Full hook with useFrame analysis driver — must be used inside a Canvas.
// =============================================================================

export function useAudioVisualSync() {
  const [audioData, setAudioData] = useState<AudioAnalysisData>(globalAudioData)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      await audioVisualSync.initialize()
      if (mounted) setIsInitialized(true)
    }

    init()

    const unsubscribe = audioVisualSync.onFrame((data) => {
      if (mounted) setAudioData(data)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const bpm = useGameStore((state) => state.bpm)
  useEffect(() => {
    audioVisualSync.setBPM(bpm)
  }, [bpm])

  useFrame((state) => {
    if (isInitialized) {
      audioVisualSync.analyze(state.clock.elapsedTime)
    }
  })

  return { audioData, isInitialized }
}

// =============================================================================
// REACT HOOK: useBeat
// =============================================================================

export function useBeat(callback: (intensity: number) => void) {
  useEffect(() => {
    return audioVisualSync.onBeat(callback)
  }, [callback])
}

// =============================================================================
// SHADER UNIFORMS
// =============================================================================

export function getAudioUniforms() {
  return {
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioTreble: { value: 0 },
    uAudioEnvelope: { value: 0 },
    uAudioBeat: { value: 0 },
    uAudioEnergy: { value: 0 },
    uAudioSpectralCentroid: { value: 0.5 },
  }
}

export function updateAudioUniforms(
  uniforms: Record<string, { value: number }>,
  data: AudioAnalysisData,
) {
  if (uniforms.uAudioBass) uniforms.uAudioBass.value = data.bass
  if (uniforms.uAudioMid) uniforms.uAudioMid.value = data.mid
  if (uniforms.uAudioTreble) uniforms.uAudioTreble.value = data.treble
  if (uniforms.uAudioEnvelope) uniforms.uAudioEnvelope.value = data.envelope
  if (uniforms.uAudioBeat) uniforms.uAudioBeat.value = data.beat ? data.beatIntensity : 0
  if (uniforms.uAudioEnergy) uniforms.uAudioEnergy.value = data.energy
  if (uniforms.uAudioSpectralCentroid) uniforms.uAudioSpectralCentroid.value = data.spectralCentroid
}
