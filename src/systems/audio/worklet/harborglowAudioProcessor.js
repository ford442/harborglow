const COMMAND_RING_PTR = 24 * 1024 * 1024
const ANALYSIS_RING_PTR = 26 * 1024 * 1024
const COMMAND_CAPACITY = 1024
// Must match PROTOCOL_VERSION in audioProtocol.ts and the engine.
const PROTOCOL_VERSION = 2
const COMMAND_BYTES = 80
const ANALYSIS_CAPACITY = 8
const ANALYSIS_BYTES = 1088
const OUTPUT_LEFT_PTR = 30 * 1024 * 1024
const OUTPUT_RIGHT_PTR = OUTPUT_LEFT_PTR + 4096
const COMMAND_SCRATCH_PTR = OUTPUT_RIGHT_PTR + 4096
const ANALYSIS_SCRATCH_PTR = COMMAND_SCRATCH_PTR + COMMAND_BYTES

class HarborGlowAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.memory = options.processorOptions.memory
    this.module = options.processorOptions.module
    this.exports = null
    this.ready = false
    this.waveform = new Float32Array(256)
    this.waveformCursor = 0
    this.analysisCounter = 0
    this.initialize()
  }

  async initialize() {
    try {
      const memory = this.memory
      const noop = () => 0
      const imports = {
        env: {
          memory,
          _emscripten_notify_mailbox_postmessage: noop,
          emscripten_check_blocking_allowed: noop,
          _emscripten_receive_on_main_thread_js: noop,
          _emscripten_init_main_thread_js: noop,
          _emscripten_thread_mailbox_await: noop,
          _emscripten_thread_set_strongref: noop,
          emscripten_exit_with_live_runtime: noop,
          _emscripten_thread_cleanup: noop,
        },
        wasi_snapshot_preview1: {
          clock_time_get: (_clock, _precision, outputPointer) => {
            new DataView(memory.buffer).setBigUint64(
              outputPointer, BigInt(Math.floor(currentTime * 1e9)), true)
            return 0
          },
          proc_exit: noop,
          fd_close: noop,
          fd_write: noop,
          fd_seek: noop,
        },
      }
      const instance = await WebAssembly.instantiate(this.module, imports)
      this.exports = instance.exports
      this.exports._initialize?.()
      const protocolVersion = this.exports.dsp_audio_engine_protocol_version?.() ?? 1
      const commandBytes = this.exports.dsp_audio_engine_command_bytes?.() ?? 64
      if (protocolVersion !== PROTOCOL_VERSION || commandBytes !== COMMAND_BYTES) {
        throw new Error(
          `Audio engine protocol v${protocolVersion}/${commandBytes}B, ` +
          `worklet expects v${PROTOCOL_VERSION}/${COMMAND_BYTES}B`)
      }
      this.exports.dsp_ring_init(COMMAND_RING_PTR, COMMAND_CAPACITY, commandBytes)
      this.exports.dsp_ring_init(ANALYSIS_RING_PTR, ANALYSIS_CAPACITY, ANALYSIS_BYTES)
      if (!this.exports.dsp_audio_engine_init(sampleRate)) {
        throw new Error(`Unsupported sample rate ${sampleRate}`)
      }
      this.ready = true
      this.port.postMessage({
        type: 'ready',
        protocolVersion,
        commandBytes,
        sampleRate,
        layout: {
          dataOffset: this.exports.dsp_ring_data_offset(),
          readOffset: this.exports.dsp_ring_read_offset(),
          writeOffset: this.exports.dsp_ring_write_offset(),
          overflowOffset: this.exports.dsp_ring_overflow_offset(),
        },
      })
    } catch (error) {
      this.port.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  publishAnalysis(left, right) {
    let sumSquares = 0
    let peak = 0
    for (let i = 0; i < left.length; i++) {
      const mono = (left[i] + right[i]) * 0.5
      this.waveform[this.waveformCursor] = mono
      this.waveformCursor = (this.waveformCursor + 1) & 255
      sumSquares += mono * mono
      peak = Math.max(peak, Math.abs(mono))
    }
    this.analysisCounter++
    if ((this.analysisCounter & 3) !== 0) return

    let bass = 0
    let mid = 0
    let treble = 0
    let weighted = 0
    let magnitudeSum = 0
    for (let bin = 1; bin < 96; bin++) {
      let real = 0
      let imag = 0
      for (let i = 0; i < 256; i++) {
        const sample = this.waveform[(this.waveformCursor + i) & 255]
        const phase = -2 * Math.PI * bin * i / 256
        real += sample * Math.cos(phase)
        imag += sample * Math.sin(phase)
      }
      const magnitude = Math.sqrt(real * real + imag * imag) / 128
      const frequency = bin * sampleRate / 256
      if (frequency < 250) bass += magnitude
      else if (frequency < 2000) mid += magnitude
      else treble += magnitude
      weighted += frequency * magnitude
      magnitudeSum += magnitude
    }

    const view = new DataView(this.memory.buffer, ANALYSIS_SCRATCH_PTR, ANALYSIS_BYTES)
    new Uint8Array(this.memory.buffer, ANALYSIS_SCRATCH_PTR, ANALYSIS_BYTES).fill(0)
    view.setFloat32(0, Math.sqrt(sumSquares / Math.max(1, left.length)), true)
    view.setFloat32(4, peak, true)
    view.setFloat32(8, Math.min(1, bass / 4), true)
    view.setFloat32(12, Math.min(1, mid / 12), true)
    view.setFloat32(16, Math.min(1, treble / 24), true)
    view.setFloat32(
      20,
      magnitudeSum > 0 ? Math.min(1, weighted / magnitudeSum / (sampleRate * 0.5)) : 0,
      true,
    )
    view.setFloat64(24, currentFrame, true)
    for (let i = 0; i < 256; i++) {
      view.setFloat32(64 + i * 4, this.waveform[(this.waveformCursor + i) & 255], true)
    }
    this.exports.dsp_ring_push(ANALYSIS_RING_PTR, ANALYSIS_SCRATCH_PTR)
  }

  process(inputs, outputs) {
    const output = outputs[0]
    if (!output?.[0]) return true
    const left = output[0]
    const right = output[1] ?? output[0]
    if (!this.ready) {
      left.fill(0)
      if (right !== left) right.fill(0)
      return true
    }

    // Commands carry their own frame; the engine splits this quantum at them.
    this.exports.dsp_audio_engine_drain(COMMAND_RING_PTR)
    this.exports.dsp_audio_engine_process(
      OUTPUT_LEFT_PTR, OUTPUT_RIGHT_PTR, left.length, currentFrame)
    const wasmLeft = new Float32Array(this.memory.buffer, OUTPUT_LEFT_PTR, left.length)
    const wasmRight = new Float32Array(this.memory.buffer, OUTPUT_RIGHT_PTR, right.length)
    const input = inputs[0]
    const inputLeft = input?.[0]
    const inputRight = input?.[1] ?? inputLeft
    for (let i = 0; i < left.length; i++) {
      left[i] = Math.max(-1, Math.min(1, wasmLeft[i] + (inputLeft?.[i] ?? 0)))
      right[i] = Math.max(-1, Math.min(1, wasmRight[i] + (inputRight?.[i] ?? 0)))
    }
    this.publishAnalysis(left, right)
    return true
  }
}

registerProcessor('harborglow-audio-processor', HarborGlowAudioProcessor)
