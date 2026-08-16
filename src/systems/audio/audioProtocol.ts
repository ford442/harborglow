export const AUDIO_MEMORY_PAGES = 512
export const AUDIO_MEMORY_BYTES = AUDIO_MEMORY_PAGES * 64 * 1024

export const COMMAND_RING_PTR = 24 * 1024 * 1024
export const ANALYSIS_RING_PTR = 26 * 1024 * 1024
export const COMMAND_CAPACITY = 1024
export const COMMAND_BYTES = 64
export const ANALYSIS_CAPACITY = 8
export const ANALYSIS_BYTES = 1088

export const OUTPUT_LEFT_PTR = 30 * 1024 * 1024
export const OUTPUT_RIGHT_PTR = OUTPUT_LEFT_PTR + 4096
export const COMMAND_SCRATCH_PTR = OUTPUT_RIGHT_PTR + 4096
export const ANALYSIS_SCRATCH_PTR = COMMAND_SCRATCH_PTR + COMMAND_BYTES

export enum AudioCommandType {
  NoteOn = 1,
  NoteOff = 2,
  StopAll = 3,
  SetEffects = 4,
}

export interface RingLayout {
  dataOffset: number
  readOffset: number
  writeOffset: number
  overflowOffset: number
}

export interface AudioCommand {
  type: AudioCommandType
  voiceId?: number
  frequency?: number
  velocity?: number
  waveform?: number
  attack?: number
  decay?: number
  sustain?: number
  release?: number
  lowpassHz?: number
  distortion?: number
  bitDepth?: number
  delaySeconds?: number
  delayFeedback?: number
  chorusDepth?: number
  roomPreset?: number
  roomMix?: number
}

export interface AudioAnalysisSnapshot {
  rms: number
  peak: number
  bass: number
  mid: number
  treble: number
  spectralCentroid: number
  frame: number
  waveform: Float32Array
}

function unsignedDistance(write: number, read: number): number {
  return (write - read) >>> 0
}

export class SharedRingWriter {
  constructor(
    private readonly memory: WebAssembly.Memory,
    private readonly pointer: number,
    private readonly capacity: number,
    private readonly itemBytes: number,
    private readonly layout: RingLayout,
  ) {}

  push(writeItem: (view: DataView) => void): boolean {
    const controls = new Int32Array(this.memory.buffer)
    const readIndex = (this.pointer + this.layout.readOffset) >> 2
    const writeIndex = (this.pointer + this.layout.writeOffset) >> 2
    const overflowIndex = (this.pointer + this.layout.overflowOffset) >> 2
    const write = Atomics.load(controls, writeIndex) >>> 0
    const read = Atomics.load(controls, readIndex) >>> 0
    if (unsignedDistance(write, read) >= this.capacity) {
      Atomics.add(controls, overflowIndex, 1)
      return false
    }
    const itemOffset = this.pointer + this.layout.dataOffset +
      (write & (this.capacity - 1)) * this.itemBytes
    const item = new DataView(this.memory.buffer, itemOffset, this.itemBytes)
    new Uint8Array(this.memory.buffer, itemOffset, this.itemBytes).fill(0)
    writeItem(item)
    Atomics.store(controls, writeIndex, (write + 1) | 0)
    Atomics.notify(controls, writeIndex)
    return true
  }
}

export class SharedRingReader {
  constructor(
    private readonly memory: WebAssembly.Memory,
    private readonly pointer: number,
    private readonly capacity: number,
    private readonly itemBytes: number,
    private readonly layout: RingLayout,
  ) {}

  pop(readItem: (view: DataView) => void): boolean {
    const controls = new Int32Array(this.memory.buffer)
    const readIndex = (this.pointer + this.layout.readOffset) >> 2
    const writeIndex = (this.pointer + this.layout.writeOffset) >> 2
    const read = Atomics.load(controls, readIndex) >>> 0
    const write = Atomics.load(controls, writeIndex) >>> 0
    if (read === write) return false
    const itemOffset = this.pointer + this.layout.dataOffset +
      (read & (this.capacity - 1)) * this.itemBytes
    readItem(new DataView(this.memory.buffer, itemOffset, this.itemBytes))
    Atomics.store(controls, readIndex, (read + 1) | 0)
    return true
  }
}

export function encodeCommand(view: DataView, command: AudioCommand): void {
  view.setInt32(0, command.type, true)
  view.setInt32(4, command.voiceId ?? 0, true)
  view.setFloat32(8, command.frequency ?? 0, true)
  view.setFloat32(12, command.velocity ?? 0, true)
  view.setInt32(16, command.waveform ?? 0, true)
  view.setFloat32(20, command.attack ?? 0.01, true)
  view.setFloat32(24, command.decay ?? 0.1, true)
  view.setFloat32(28, command.sustain ?? 0.7, true)
  view.setFloat32(32, command.release ?? 0.2, true)
  view.setFloat32(36, command.lowpassHz ?? 20000, true)
  view.setFloat32(40, command.distortion ?? 0, true)
  view.setInt32(44, command.bitDepth ?? 24, true)
  view.setFloat32(48, command.delaySeconds ?? 0, true)
  view.setFloat32(52, command.delayFeedback ?? 0, true)
  view.setFloat32(56, command.chorusDepth ?? 0, true)
  view.setUint8(60, command.roomPreset ?? 0)
  view.setUint8(61, Math.round((command.roomMix ?? 0) * 255))
}

export function decodeAnalysis(view: DataView): AudioAnalysisSnapshot {
  const waveform = new Float32Array(256)
  for (let i = 0; i < waveform.length; i++) {
    waveform[i] = view.getFloat32(64 + i * 4, true)
  }
  return {
    rms: view.getFloat32(0, true),
    peak: view.getFloat32(4, true),
    bass: view.getFloat32(8, true),
    mid: view.getFloat32(12, true),
    treble: view.getFloat32(16, true),
    spectralCentroid: view.getFloat32(20, true),
    frame: view.getFloat64(24, true),
    waveform,
  }
}
