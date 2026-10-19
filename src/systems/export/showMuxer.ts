// =============================================================================
// SHOW MUXER — VideoEncoder / AudioEncoder into mediabunny.
// This module is the only static importer of mediabunny. Load it with
// import() so the chunk stays out of game-initial.
// =============================================================================

import {
  BufferTarget,
  EncodedAudioPacketSource,
  EncodedPacket,
  EncodedVideoPacketSource,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat,
} from 'mediabunny'
import { EXPORT_HEIGHT, EXPORT_SAMPLE_RATE, EXPORT_WIDTH } from './exportClock'

export type ExportContainer = 'mp4' | 'webm'

export interface ShowMuxer {
  encodeVideo(frame: VideoFrame): Promise<void>
  encodeAudio(data: AudioData): Promise<void>
  finalize(): Promise<Uint8Array>
}

export async function createShowMuxer(container: ExportContainer): Promise<ShowMuxer> {
  if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') {
    throw new Error('WebCodecs VideoEncoder/AudioEncoder are required (Chrome or Edge 113+)')
  }
  const target = new BufferTarget()
  const output = new Output({
    format: container === 'mp4'
      ? new Mp4OutputFormat({ fastStart: 'in-memory' })
      : new WebMOutputFormat(),
    target,
  })
  const videoCodec = container === 'mp4' ? 'avc' : 'vp9'
  const audioCodec = container === 'mp4' ? 'aac' : 'opus'
  const videoSource = new EncodedVideoPacketSource(videoCodec)
  const audioSource = new EncodedAudioPacketSource(audioCodec)
  output.addVideoTrack(videoSource)
  output.addAudioTrack(audioSource)
  await output.start()

  const pending: Promise<void>[] = []
  let failed: Error | null = null
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      pending.push(videoSource.add(EncodedPacket.fromEncodedChunk(chunk), meta))
    },
    error: (error) => {
      failed = error
    },
  })
  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => {
      pending.push(audioSource.add(EncodedPacket.fromEncodedChunk(chunk), meta))
    },
    error: (error) => {
      failed = error
    },
  })
  videoEncoder.configure({
    codec: container === 'mp4' ? 'avc1.640028' : 'vp09.00.10.08',
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    bitrate: 8_000_000,
    framerate: 60,
    latencyMode: 'quality',
    avc: container === 'mp4' ? { format: 'avc' } : undefined,
  })
  audioEncoder.configure({
    codec: container === 'mp4' ? 'mp4a.40.2' : 'opus',
    sampleRate: EXPORT_SAMPLE_RATE,
    numberOfChannels: 2,
    bitrate: 128_000,
  })

  const guard = () => {
    if (failed) throw failed
  }

  return {
    async encodeVideo(frame: VideoFrame) {
      guard()
      videoEncoder.encode(frame, { keyFrame: frame.timestamp % 1_000_000 === 0 })
      frame.close()
    },
    async encodeAudio(data: AudioData) {
      guard()
      audioEncoder.encode(data)
      data.close()
    },
    async finalize() {
      guard()
      await videoEncoder.flush()
      await audioEncoder.flush()
      await Promise.all(pending)
      videoEncoder.close()
      audioEncoder.close()
      await output.finalize()
      const buffer = target.buffer
      if (!buffer) throw new Error('Muxer produced an empty file')
      return new Uint8Array(buffer)
    },
  }
}
