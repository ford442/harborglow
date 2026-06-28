// =============================================================================
// LOOK DEV CONTROLS — live Visual Polish tuning (Leva → module globals)
// Persisted to localStorage; consumed via getLookDevSettings() in useFrame.
// =============================================================================

const STORAGE_KEY = 'harborglow.lookdev.v1'

export interface LookDevSettings {
  // Surfaces
  surfaceWetness: number
  dockWoodRoughness: number
  metalScuff: number
  puddleStrength: number
  // Flares & Glow
  flaresEnabled: boolean
  flareIntensity: number
  flareSize: number
  flareThreshold: number
  flareDirt: boolean
  flareAnamorphic: boolean
  bloomExtra: number
  rigEmissiveBoost: number
  // Light Rigs
  sparkDensity: number
  rigPulseAmount: number
  rigColorTempShift: number
  // Crane & Cable
  craneSheen: number
  craneWear: number
  cableTensionHighlight: number
  // Global
  envMapIntensity: number
  filmGrainScale: number
  godRayDensity: number
}

export const LOOK_DEV_DEFAULTS: LookDevSettings = {
  surfaceWetness: 1,
  dockWoodRoughness: 1,
  metalScuff: 1,
  puddleStrength: 1,
  flaresEnabled: true,
  flareIntensity: 0.85,
  flareSize: 1,
  flareThreshold: 2.8,
  flareDirt: true,
  flareAnamorphic: true,
  bloomExtra: 0,
  rigEmissiveBoost: 1,
  sparkDensity: 1,
  rigPulseAmount: 1,
  rigColorTempShift: 0,
  craneSheen: 1,
  craneWear: 1,
  cableTensionHighlight: 1,
  envMapIntensity: 1,
  filmGrainScale: 1,
  godRayDensity: 1,
}

let settings: LookDevSettings = { ...LOOK_DEV_DEFAULTS }

function loadPersistedSettings(): LookDevSettings {
  if (typeof window === 'undefined') return { ...LOOK_DEV_DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...LOOK_DEV_DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<LookDevSettings>
    return { ...LOOK_DEV_DEFAULTS, ...parsed }
  } catch {
    return { ...LOOK_DEV_DEFAULTS }
  }
}

settings = loadPersistedSettings()

function persistSettings(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Quota / private mode — tuning still live for session
  }
}

export function getLookDevSettings(): Readonly<LookDevSettings> {
  return settings
}

export function setLookDevSettings(partial: Partial<LookDevSettings>): void {
  settings = { ...settings, ...partial }
  persistSettings()
}

export function resetLookDevSettings(): void {
  settings = { ...LOOK_DEV_DEFAULTS }
  persistSettings()
}

/** Flare readers delegate here so LightFlare.tsx keeps a stable import surface. */
export function getLookDevFlareSettings() {
  const ld = settings
  return {
    enabled: ld.flaresEnabled,
    intensity: ld.flareIntensity,
    size: ld.flareSize,
    threshold: ld.flareThreshold,
    dirt: ld.flareDirt,
    anamorphic: ld.flareAnamorphic,
  }
}

export const METAL_HARBOR_KINDS = new Set(['corrodedSteel', 'railSteel', 'cautionStripe'])
export const WOOD_HARBOR_KINDS = new Set(['weatheredWood', 'weatheredWoodDeck', 'pilingTimber'])
