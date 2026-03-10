import * as Tone from 'tone'
import { useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// PHASE 8: AUDIO-VISUAL SYNCHRONIZATION SYSTEM
// Real-time FFT analysis → Visual pipeline for light shows, environment, UI
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

// Global audio analysis state - updated once per frame, consumed by all systems
let globalAudioData: AudioAnalysisData = {
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
  spectralCentroid: 0.5
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
  
  // Beat detection
  private lastBeatTime: number = 0
  private beatThreshold: number = 0.6
  private beatDecay: number = 0.95
  private beatEnergy: number = 0
  private bpm: number = 128
  private isInitialized: boolean = false
  
  // Callbacks for reactive systems
  private onBeatCallbacks: Set<(intensity: number) => void> = new Set()
  private onFrameCallbacks: Set<(data: AudioAnalysisData) => void> = new Set()
  
  // Initialize audio analysis chain
  async initialize() {
    if (this.isInitialized) return
    
    await Tone.start()
    
    // Main FFT analyzer - 2048 samples for good frequency resolution
    this.fft = new Tone.FFT(2048)
    
    // Waveform analyzer
    this.waveform = new Tone.Waveform(256)
    
    // Main meter for overall level
    this.meter = new Tone.Meter()
    
    // Band-pass filters for frequency isolation
    this.filterBass = new Tone.Filter(80, 'lowpass', -24)
    this.filterLowMid = new Tone.Filter(270, 'peaking', -12)
    this.filterLowMid.Q.value = 2
    this.filterMid = new Tone.Filter(1500, 'peaking', -12)
    this.filterMid.Q.value = 2
    this.filterHighMid = new Tone.Filter(3900, 'peaking', -12)
    this.filterHighMid.Q.value = 2
    this.filterTreble = new Tone.Filter(10000, 'highpass', -24)
    
    // Individual meters for each band
    this.meters.set('bass', new Tone.Meter())
    this.meters.set('lowMid', new Tone.Meter())
    this.meters.set('mid', new Tone.Meter())
    this.meters.set('highMid', new Tone.Meter())
    this.meters.set('treble', new Tone.Meter())
    
    // Connect filter chain to meters
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
    
    // Connect main output to analyzers
    Tone.Destination.connect(this.fft)
    if (this.waveform) Tone.Destination.connect(this.waveform)
    if (this.meter) Tone.Destination.connect(this.meter)
    if (this.filterBass) Tone.Destination.connect(this.filterBass)
    if (this.filterLowMid) Tone.Destination.connect(this.filterLowMid)
    if (this.filterMid) Tone.Destination.connect(this.filterMid)
    if (this.filterHighMid) Tone.Destination.connect(this.filterHighMid)
    if (this.filterTreble) Tone.Destination.connect(this.filterTreble)
    
    this.isInitialized = true
    console.log('🎵 AudioVisualSync initialized')
  }
  
  // Analyze audio and update global state
  analyze(time: number): AudioAnalysisData {
    if (!this.isInitialized || !this.fft || !this.waveform || !this.meter) {
      return globalAudioData
    }
    
    // Get FFT values (frequency domain)
    const fftValues = this.fft.getValue() as Float32Array
    
    // Get waveform (time domain)
    const waveValues = this.waveform.getValue() as Float32Array
    
    // Get RMS level
    const rms = this.meter.getValue() as number
    
    // Calculate frequency band energies from FFT
    // FFT size is 2048, sample rate assumed 44.1kHz
    // Each bin = 44100 / 2048 = ~21.5Hz
    const binSize = 44100 / 2048
    
    // Bass: 20-140Hz (bins 1-7)
    const bassBins = fftValues.slice(1, 7)
    const bass = this.calculateBandEnergy(bassBins)
    
    // LowMid: 140-400Hz (bins 7-19)
    const lowMidBins = fftValues.slice(7, 19)
    const lowMid = this.calculateBandEnergy(lowMidBins)
    
    // Mid: 400-2.6kHz (bins 19-121)
    const midBins = fftValues.slice(19, 121)
    const mid = this.calculateBandEnergy(midBins)
    
    // HighMid: 2.6-5.2kHz (bins 121-242)
    const highMidBins = fftValues.slice(121, 242)
    const highMid = this.calculateBandEnergy(highMidBins)
    
    // Treble: 5.2-20kHz (bins 242-930)
    const trebleBins = fftValues.slice(242, 930)
    const treble = this.calculateBandEnergy(trebleBins)
    
    // Get band levels from filtered meters
    const bassMeter = this.meters.get('bass')?.getValue() as number || 0
    const lowMidMeter = this.meters.get('lowMid')?.getValue() as number || 0
    const midMeter = this.meters.get('mid')?.getValue() as number || 0
    const highMidMeter = this.meters.get('highMid')?.getValue() as number || 0
    const trebleMeter = this.meters.get('treble')?.getValue() as number || 0
    
    // Combine FFT and meter values for best response
    const bassFinal = Math.max(bass, Math.abs(bassMeter))
    const lowMidFinal = Math.max(lowMid, Math.abs(lowMidMeter))
    const midFinal = Math.max(mid, Math.abs(midMeter))
    const highMidFinal = Math.max(highMid, Math.abs(highMidMeter))
    const trebleFinal = Math.max(treble, Math.abs(trebleMeter))
    
    // Calculate envelope (smoothed RMS)
    const envelope = Math.min(1, rms * 2) // Scale to 0-1 range
    
    // Calculate peak
    const peak = Math.max(...waveValues.map(v => Math.abs(v)))
    
    // Calculate spectral centroid (brightness)
    let centroidSum = 0
    let magnitudeSum = 0
    for (let i = 0; i < fftValues.length; i++) {
      const freq = i * binSize
      const mag = Math.pow(10, fftValues[i] / 20) // dB to linear
      centroidSum += freq * mag
      magnitudeSum += mag
    }
    const spectralCentroid = magnitudeSum > 0 ? centroidSum / magnitudeSum / 10000 : 0.5
    
    // Calculate overall energy
    const energy = (bassFinal + lowMidFinal + midFinal + highMidFinal + trebleFinal) / 5
    
    // Beat detection
    this.beatEnergy = this.beatEnergy * this.beatDecay + bassFinal * (1 - this.beatDecay)
    const beatDiff = bassFinal - this.beatEnergy
    const isBeat = beatDiff > this.beatThreshold && bassFinal > 0.3
    
    const now = time
    let beatPhase = 0
    if (isBeat && now - this.lastBeatTime > 0.2) { // Minimum 200ms between beats
      this.lastBeatTime = now
      this.onBeatCallbacks.forEach(cb => cb(bassFinal))
      beatPhase = 0
    } else {
      // Calculate phase within beat
      const timeSinceBeat = now - this.lastBeatTime
      const beatDuration = 60 / this.bpm
      beatPhase = Math.min(1, timeSinceBeat / beatDuration)
    }
    
    // Update global data
    globalAudioData = {
      bass: Math.min(1, bassFinal * 2), // Scale up for better visibility
      lowMid: Math.min(1, lowMidFinal * 2),
      mid: Math.min(1, midFinal * 2),
      highMid: Math.min(1, highMidFinal * 2),
      treble: Math.min(1, trebleFinal * 3),
      waveform: waveValues,
      envelope: Math.max(0, envelope),
      beat: isBeat,
      beatIntensity: bassFinal,
      beatPhase,
      rms: Math.max(0, rms),
      peak: Math.min(1, peak),
      energy: Math.min(1, energy * 1.5),
      spectralCentroid: Math.min(1, spectralCentroid)
    }
    
    // Notify frame subscribers
    this.onFrameCallbacks.forEach(cb => cb(globalAudioData))
    
    return globalAudioData
  }
  
  private calculateBandEnergy(bins: Float32Array): number {
    if (bins.length === 0) return 0
    // Convert dB to linear, average, then back to dB-like scale
    const linearValues = Array.from(bins).map(v => Math.pow(10, v / 20))
    const average = linearValues.reduce((a, b) => a + b, 0) / linearValues.length
    return 20 * Math.log10(average + 0.0001) + 100 // Normalize to 0-1 roughly
  }
  
  // Set BPM for beat detection
  setBPM(bpm: number) {
    this.bpm = bpm
  }
  
  // Subscribe to beat events
  onBeat(callback: (intensity: number) => void) {
    this.onBeatCallbacks.add(callback)
    return () => { this.onBeatCallbacks.delete(callback) }
  }
  
  // Subscribe to frame updates
  onFrame(callback: (data: AudioAnalysisData) => void) {
    this.onFrameCallbacks.add(callback)
    return () => { this.onFrameCallbacks.delete(callback) }
  }
  
  // Cleanup
  dispose() {
    this.fft?.dispose()
    this.waveform?.dispose()
    this.meter?.dispose()
    this.filterBass?.dispose()
    this.filterLowMid?.dispose()
    this.filterMid?.dispose()
    this.filterHighMid?.dispose()
    this.filterTreble?.dispose()
    this.meters.forEach(m => m.dispose())
    this.onBeatCallbacks.clear()
    this.onFrameCallbacks.clear()
  }
}

// Singleton instance
export const audioVisualSync = new AudioVisualSync()

// =============================================================================
// REACT HOOK: useAudioVisualSync
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
    
    // Subscribe to frame updates
    const unsubscribe = audioVisualSync.onFrame((data) => {
      if (mounted) setAudioData(data)
    })
    
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])
  
  // Update BPM when it changes
  const bpm = useGameStore(state => state.bpm)
  useEffect(() => {
    audioVisualSync.setBPM(bpm)
  }, [bpm])
  
  // Analyze on each frame
  useFrame((state) => {
    if (isInitialized) {
      audioVisualSync.analyze(state.clock.elapsedTime)
    }
  })
  
  return { audioData, isInitialized }
}

// =============================================================================
// REACT HOOK: useBeat
// Subscribe to beat events with intensity
// =============================================================================

export function useBeat(callback: (intensity: number) => void) {
  useEffect(() => {
    return audioVisualSync.onBeat(callback)
  }, [callback])
}

// =============================================================================
// SHADER UNIFORMS: getAudioUniforms
// Returns uniforms object for shaders
// =============================================================================

export function getAudioUniforms() {
  return {
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioTreble: { value: 0 },
    uAudioEnvelope: { value: 0 },
    uAudioBeat: { value: 0 },
    uAudioEnergy: { value: 0 },
    uAudioSpectralCentroid: { value: 0.5 }
  }
}

export function updateAudioUniforms(
  uniforms: Record<string, { value: number }>,
  data: AudioAnalysisData
) {
  if (uniforms.uAudioBass) uniforms.uAudioBass.value = data.bass
  if (uniforms.uAudioMid) uniforms.uAudioMid.value = data.mid
  if (uniforms.uAudioTreble) uniforms.uAudioTreble.value = data.treble
  if (uniforms.uAudioEnvelope) uniforms.uAudioEnvelope.value = data.envelope
  if (uniforms.uAudioBeat) uniforms.uAudioBeat.value = data.beat ? data.beatIntensity : 0
  if (uniforms.uAudioEnergy) uniforms.uAudioEnergy.value = data.energy
  if (uniforms.uAudioSpectralCentroid) uniforms.uAudioSpectralCentroid.value = data.spectralCentroid
}
