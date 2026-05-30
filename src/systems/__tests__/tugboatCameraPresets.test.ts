import { describe, it, expect, vi } from 'vitest'

// Mock Tone.js (transitive dependency through store)
vi.mock('tone', () => ({
  context: { state: 'running' },
  start: vi.fn(),
  now: vi.fn(() => 0),
  MetalSynth: vi.fn(),
  NoiseSynth: vi.fn(),
  Distortion: vi.fn(),
  Filter: vi.fn(),
  Compressor: vi.fn(),
}))

import { CAMERA_PRESET_IDS, isCameraPresetId } from '../../types/CameraPreset'
import type { CameraPresetId, TugboatViewportId } from '../../types/CameraPreset'
import { CAMERA_PRESETS, getCameraPresetById, TUGBOAT_DASHBOARD_PRESETS, TUGBOAT_VIEWPORT_ORDER } from '../cameraSystem'

describe('tugboat camera presets', () => {
  const TUGBOAT_PRESET_IDS: CameraPresetId[] = ['tug-helm', 'tug-deck', 'tug-chase', 'tug-prop', 'tug-towline']

  it('includes all tugboat preset IDs in the CAMERA_PRESET_IDS array', () => {
    for (const id of TUGBOAT_PRESET_IDS) {
      expect(CAMERA_PRESET_IDS).toContain(id)
    }
  })

  it('validates tugboat preset IDs with isCameraPresetId', () => {
    for (const id of TUGBOAT_PRESET_IDS) {
      expect(isCameraPresetId(id)).toBe(true)
    }
  })

  it('has CameraPreset entries for all tugboat presets', () => {
    for (const id of TUGBOAT_PRESET_IDS) {
      const preset = getCameraPresetById(id)
      expect(preset.id).toBe(id)
      expect(preset.mode).toBe('tug-relative')
      expect(preset.position).toHaveLength(3)
      expect(preset.target).toHaveLength(3)
      expect(preset.fov).toBeGreaterThan(0)
    }
  })

  it('defines TUGBOAT_DASHBOARD_PRESETS with correct viewport mappings', () => {
    const expectedViewports: TugboatViewportId[] = ['tug-helm', 'tug-deck', 'tug-chase', 'tug-prop']
    for (const vp of expectedViewports) {
      expect(TUGBOAT_DASHBOARD_PRESETS[vp]).toBeDefined()
      expect(isCameraPresetId(TUGBOAT_DASHBOARD_PRESETS[vp])).toBe(true)
    }
  })

  it('defines TUGBOAT_VIEWPORT_ORDER with 4 entries', () => {
    expect(TUGBOAT_VIEWPORT_ORDER).toHaveLength(4)
    expect(TUGBOAT_VIEWPORT_ORDER).toContain('tug-helm')
    expect(TUGBOAT_VIEWPORT_ORDER).toContain('tug-deck')
    expect(TUGBOAT_VIEWPORT_ORDER).toContain('tug-chase')
    expect(TUGBOAT_VIEWPORT_ORDER).toContain('tug-prop')
  })

  it('all tugboat presets have unique labels', () => {
    const tugPresets = CAMERA_PRESETS.filter(p => p.id.startsWith('tug-'))
    const labels = tugPresets.map(p => p.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
