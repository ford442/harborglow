import { describe, expect, it } from 'vitest'
import {
  EXPORT_FRAMES,
  EXPORT_FPS,
  EXPORT_SECONDS,
  FRAME_US,
  audioTimestampUs,
  frameTimestampUs,
  onsetFrameErrorSec,
  withinOneFrame,
} from './exportClock'
import { beginFixedDtExport, endFixedDtExport, exportFrameDelta } from './fixedDt'

describe('export clock', () => {
  it('covers 30 seconds at 1080p60 and keeps audio on the video frame', () => {
    expect(EXPORT_SECONDS).toBe(30)
    expect(EXPORT_FPS).toBe(60)
    expect(EXPORT_FRAMES).toBe(1800)
    for (let i = 0; i < EXPORT_FRAMES; i += 60) {
      const video = frameTimestampUs(i)
      const audio = audioTimestampUs(i)
      expect(withinOneFrame(video, audio)).toBe(true)
      expect(Math.abs(video - audio)).toBeLessThanOrEqual(FRAME_US)
    }
    expect(frameTimestampUs(EXPORT_FRAMES)).toBe(30_000_000)
  })

  it('places an onset within one video frame', () => {
    const onset = 4 + 1 / 120
    expect(onsetFrameErrorSec(onset)).toBeLessThanOrEqual(1 / EXPORT_FPS)
    expect(onsetFrameErrorSec(10)).toBe(0)
  })
})

describe('fixed-dt export', () => {
  it('replaces the wall delta only while an export is running', () => {
    expect(exportFrameDelta(0.2)).toBe(0.2)
    beginFixedDtExport(1 / 60)
    expect(exportFrameDelta(0.2)).toBeCloseTo(1 / 60)
    endFixedDtExport()
    expect(exportFrameDelta(0.2)).toBe(0.2)
  })
})

