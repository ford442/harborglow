// =============================================================================
// SHOW EXPORT — live captureStream(60) or offline fixed-dt readback.
// The muxer (mediabunny) is imported only when an export starts.
// =============================================================================

import { audioRuntime } from '../audio/AudioRuntime'
import { readScreenshotPixelsAsync } from '../../rendering/canvasReadback'
import { getLiveRenderer } from '../../rendering/liveRenderer'
import { SIM_DT } from '../sim/SimContext'
import {
  EXPORT_FRAMES,
  EXPORT_HEIGHT,
  EXPORT_SAMPLE_RATE,
  EXPORT_WIDTH,
  audioTimestampUs,
  frameDurationUs,
  frameTimestampUs,
  samplesPerFrame,
} from './exportClock'
import { beginFixedDtExport, endFixedDtExport } from './fixedDt'
import type { ExportContainer, ShowMuxer } from './showMuxer'

export type ExportMode = 'live' | 'offline'

type TrackReader<T> = {
  read: () => Promise<{ done: boolean; value?: T }>
  cancel?: () => Promise<void>
}

type TrackProcessorCtor = new (init: { track: MediaStreamTrack }) => {
  readable: { getReader: () => TrackReader<VideoFrame | AudioData> }
}

function trackProcessor(): TrackProcessorCtor | null {
  const ctor = (globalThis as unknown as { MediaStreamTrackProcessor?: TrackProcessorCtor }).MediaStreamTrackProcessor
  return ctor ?? null
}

export async function exportShow(options: {
  mode: ExportMode
  container?: ExportContainer
  canvas?: HTMLCanvasElement | null
}): Promise<Uint8Array> {
  const container = options.container ?? 'mp4'
  const { createShowMuxer } = await import('./showMuxer')
  const muxer = await createShowMuxer(container)
  if (options.mode === 'offline') return exportOffline(muxer)
  const canvas = options.canvas ?? document.querySelector('canvas')
  if (!canvas) throw new Error('No canvas to capture')
  return exportLive(muxer, canvas)
}

async function exportLive(muxer: ShowMuxer, canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const Processor = trackProcessor()
  if (!Processor) throw new Error('MediaStreamTrackProcessor is required (Chrome or Edge)')
  await audioRuntime.resume()
  const tap = audioRuntime.openExportTap()
  const videoStream = canvas.captureStream(60)
  const videoTrack = videoStream.getVideoTracks()[0]
  if (!videoTrack) throw new Error('captureStream produced no video track')
  const videoReader = new Processor({ track: videoTrack }).readable.getReader() as TrackReader<VideoFrame>
  const audioTrack = tap?.stream.getAudioTracks()[0]
  const audioReader = audioTrack
    ? new Processor({ track: audioTrack }).readable.getReader() as TrackReader<AudioData>
    : null
  const audioTask = audioReader ? pumpAudio(audioReader, muxer) : Promise.resolve()
  try {
    for (let i = 0; i < EXPORT_FRAMES; i++) {
      const next = await videoReader.read()
      if (next.done || !next.value) break
      const stamped = new VideoFrame(next.value, {
        timestamp: frameTimestampUs(i),
        duration: frameDurationUs(),
      })
      next.value.close()
      await paintAndEncode(muxer, stamped)
    }
  } finally {
    await videoReader.cancel?.()
    videoTrack.stop()
    tap?.close()
  }
  await audioTask
  return muxer.finalize()
}

async function pumpAudio(reader: TrackReader<AudioData>, muxer: ShowMuxer): Promise<void> {
  const perFrame = samplesPerFrame()
  let stampedFrames = 0
  let buffer: Float32Array<ArrayBuffer> = new Float32Array(0)
  while (stampedFrames < EXPORT_FRAMES) {
    const next = await reader.read()
    if (next.done || !next.value) break
    buffer = concatFloat(buffer, copyPlanar(next.value))
    next.value.close()
    while (buffer.length >= perFrame * 2 && stampedFrames < EXPORT_FRAMES) {
      const interleaved = tightFloat(buffer.subarray(0, perFrame * 2))
      buffer = tightFloat(buffer.subarray(perFrame * 2))
      await muxer.encodeAudio(audioPacket(interleaved, stampedFrames, perFrame))
      stampedFrames++
    }
  }
  while (stampedFrames < EXPORT_FRAMES) {
    await muxer.encodeAudio(audioPacket(tightFloat(new Float32Array(perFrame * 2)), stampedFrames, perFrame))
    stampedFrames++
  }
}

function tightFloat(samples: Float32Array): Float32Array<ArrayBuffer> {
  const copy = new Float32Array(new ArrayBuffer(samples.byteLength))
  copy.set(samples)
  return copy
}

function audioPacket(interleaved: Float32Array<ArrayBuffer>, frameIndex: number, frames: number): AudioData {
  return new AudioData({
    format: 'f32',
    sampleRate: EXPORT_SAMPLE_RATE,
    numberOfFrames: frames,
    numberOfChannels: 2,
    timestamp: audioTimestampUs(frameIndex),
    data: interleaved,
  })
}

function concatFloat(left: Float32Array, right: Float32Array): Float32Array<ArrayBuffer> {
  return tightFloat(copyConcat(left, right))
}

function copyConcat(left: Float32Array, right: Float32Array): Float32Array {
  const out = new Float32Array(left.length + right.length)
  out.set(left)
  out.set(right, left.length)
  return out
}

async function exportOffline(muxer: ShowMuxer): Promise<Uint8Array> {
  const renderer = getLiveRenderer()
  if (!renderer) throw new Error('The harbor canvas is not ready')
  const perFrame = samplesPerFrame()
  beginFixedDtExport(SIM_DT)
  try {
    for (let i = 0; i < EXPORT_FRAMES; i++) {
      const pixels = await readScreenshotPixelsAsync(renderer)
      const canvas = document.createElement('canvas')
      canvas.width = EXPORT_WIDTH
      canvas.height = EXPORT_HEIGHT
      const ctx = canvas.getContext('2d')
      if (pixels && ctx) {
        const image = new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)
        const source = document.createElement('canvas')
        source.width = pixels.width
        source.height = pixels.height
        source.getContext('2d')?.putImageData(image, 0, 0)
        ctx.drawImage(source, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)
      } else {
        ctx?.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)
      }
      const frame = new VideoFrame(canvas, {
        timestamp: frameTimestampUs(i),
        duration: frameDurationUs(),
      })
      await muxer.encodeVideo(frame)
      const audio = audioPacket(tightFloat(new Float32Array(perFrame * 2)), i, perFrame)
      await muxer.encodeAudio(audio)
    }
  } finally {
    endFixedDtExport()
  }
  return muxer.finalize()
}

async function paintAndEncode(muxer: ShowMuxer, frame: VideoFrame): Promise<void> {
  await muxer.encodeVideo(frame)
}

function copyPlanar(data: AudioData): Float32Array {
  const frames = data.numberOfFrames
  const channels = data.numberOfChannels
  const out = new Float32Array(frames * channels)
  const plane = new Float32Array(frames)
  for (let channel = 0; channel < channels; channel++) {
    data.copyTo(plane, { planeIndex: channel, format: 'f32-planar' })
    for (let i = 0; i < frames; i++) out[i * channels + channel] = plane[i]
  }
  return out
}

