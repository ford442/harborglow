// =============================================================================
// RIG POLISH — shared music drive, quality scaling, flare registry, variation
// =============================================================================

import * as THREE from 'three'
import { getAudioAnalysisData } from '../../systems/audioVisualSync'
import { lightingSystem } from '../../systems/lightingSystem'
import { getLookDevSettings } from '../../utils/lookDevControls'
import { useGameStore } from '../../store/useGameStore'

export interface RigFlareEntry {
  id: string
  position: THREE.Vector3
  color: string
  brightness: number
  priority: number
}

const rigFlareRegistry = new Map<string, RigFlareEntry>()

export function setRigFlare(id: string, entry: RigFlareEntry | null): void {
  if (entry) rigFlareRegistry.set(id, entry)
  else rigFlareRegistry.delete(id)
}

export function getRigFlares(): RigFlareEntry[] {
  return Array.from(rigFlareRegistry.values())
}

export function getRigPolishScales() {
  const q = useGameStore.getState().qualityPreset
  return {
    shimmer: q === 'low' ? 0 : q === 'medium' ? 0.65 : 1,
    glints: q === 'low' ? 0 : q === 'medium' ? 0.45 : 1,
    flareBright: q === 'low' ? 0.35 : q === 'medium' ? 0.7 : 1,
    rimStrength: q === 'low' ? 0.55 : q === 'medium' ? 0.85 : 1,
  }
}

export function rigVariationSeed(...parts: string[]): number {
  const key = parts.join(':')
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

export interface RigMusicState {
  afterglow: number
  prevBeat: boolean
}

export function computeRigMusicDrive(
  power: number,
  state: RigMusicState,
  delta: number
): { emissive: number; light: number; hueShift: number; state: RigMusicState; bass: number } {
  const audio = getAudioAnalysisData()
  const lookDev = getLookDevSettings()
  const beat = lightingSystem.getBeatPulse()
  const pulse = lookDev.rigPulseAmount

  let afterglow = state.afterglow
  const base =
    power *
    lookDev.rigEmissiveBoost *
    (0.55 + beat * 0.38 * pulse + audio.bass * 0.28 + audio.envelope * 0.12)

  if (audio.beat && !state.prevBeat) {
    afterglow = Math.min(1.35, base + 0.42 * pulse)
  }

  afterglow = THREE.MathUtils.lerp(afterglow, base, delta * 5.5)
  afterglow = Math.max(base * 0.82, afterglow - delta * 0.12)

  const emissive = THREE.MathUtils.clamp(afterglow, 0, 1.45)
  const light = emissive * 1.15

  return {
    emissive,
    light,
    hueShift: lookDev.rigColorTempShift * 0.09 + audio.spectralCentroid * 0.04,
    bass: audio.bass,
    state: { afterglow, prevBeat: audio.beat },
  }
}

export function createRigRimMaterial(color: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.65,
    toneMapped: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}
