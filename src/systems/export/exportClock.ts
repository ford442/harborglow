// =============================================================================
// EXPORT CLOCK — one 60 fps grid for video frames and audio packets.
// An onset is aligned when it falls within half a frame of a timestamp,
// which is inside the one-frame acceptance window.
// =============================================================================

export const EXPORT_FPS = 60
export const EXPORT_SECONDS = 30
export const EXPORT_WIDTH = 1920
export const EXPORT_HEIGHT = 1080
export const EXPORT_FRAMES = EXPORT_FPS * EXPORT_SECONDS
export const FRAME_US = 1_000_000 / EXPORT_FPS
export const EXPORT_SAMPLE_RATE = 48_000

export function frameTimestampUs(index: number): number {
  return Math.round(index * FRAME_US)
}

export function frameDurationUs(): number {
  return Math.round(FRAME_US)
}

/** Samples of audio that belong to one video frame. */
export function samplesPerFrame(sampleRate = EXPORT_SAMPLE_RATE, fps = EXPORT_FPS): number {
  return Math.round(sampleRate / fps)
}

/** Presentation time of the audio packet that plays with video frame `index`. */
export function audioTimestampUs(frameIndex: number, sampleRate = EXPORT_SAMPLE_RATE): number {
  const samples = frameIndex * samplesPerFrame(sampleRate)
  return Math.round(samples * 1_000_000 / sampleRate)
}

export function withinOneFrame(videoUs: number, audioUs: number): boolean {
  return Math.abs(videoUs - audioUs) <= FRAME_US
}

/** How far an onset is from the nearest video frame, in seconds. */
export function onsetFrameErrorSec(onsetSec: number, fps = EXPORT_FPS): number {
  if (!Number.isFinite(onsetSec)) return Infinity
  const nearest = Math.round(onsetSec * fps) / fps
  return Math.abs(onsetSec - nearest)
}
