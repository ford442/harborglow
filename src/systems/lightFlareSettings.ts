// =============================================================================
// LIGHT FLARE SETTINGS — delegates to lookDevControls (Visual Polish folder)
// =============================================================================

import {
  getLookDevFlareSettings,
  setLookDevSettings,
  resetLookDevSettings,
} from '../utils/lookDevControls'

export interface LightFlareSettings {
  enabled: boolean
  intensity: number
  size: number
  /** Alignment exponent — higher = flares only near view axis */
  threshold: number
  dirt: boolean
  anamorphic: boolean
}

const DEFAULTS: LightFlareSettings = {
  enabled: true,
  intensity: 0.85,
  size: 1,
  threshold: 2.8,
  dirt: true,
  anamorphic: true,
}

export function getLightFlareSettings(): Readonly<LightFlareSettings> {
  return getLookDevFlareSettings()
}

export function setLightFlareSettings(partial: Partial<LightFlareSettings>): void {
  setLookDevSettings({
    ...(partial.enabled !== undefined ? { flaresEnabled: partial.enabled } : {}),
    ...(partial.intensity !== undefined ? { flareIntensity: partial.intensity } : {}),
    ...(partial.size !== undefined ? { flareSize: partial.size } : {}),
    ...(partial.threshold !== undefined ? { flareThreshold: partial.threshold } : {}),
    ...(partial.dirt !== undefined ? { flareDirt: partial.dirt } : {}),
    ...(partial.anamorphic !== undefined ? { flareAnamorphic: partial.anamorphic } : {}),
  })
}

export function resetLightFlareSettings(): void {
  resetLookDevSettings()
}

export const FLARE_MAX_BY_QUALITY: Record<string, number> = {
  low: 1,
  medium: 3,
  high: 5,
  cinema: 6,
}

export const FLARE_QUALITY_SCALE: Record<string, number> = {
  low: 0.35,
  medium: 0.65,
  high: 1,
  cinema: 1.15,
}
