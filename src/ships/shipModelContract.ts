// =============================================================================
// GLB SHIP MODEL CONTRACT — HarborGlow
// Authoring spec for external 3D assets that replace procedural LOD0 hulls.
// =============================================================================

import type { QualityPreset, ShipType } from '../store/gameStoreTypes'

/**
 * Coordinate system (matches Three.js + blueprint JSON):
 * - Forward (bow): +Z
 * - Starboard: +X
 * - Up: +Y
 * - Origin: waterline amidships (same as procedural blueprint origin)
 * - Units: 1 world unit = 1 meter in model space (before blueprint.scale)
 */
export const SHIP_MODEL_FORWARD_AXIS = '+Z' as const
export const SHIP_MODEL_UP_AXIS = '+Y' as const
export const SHIP_MODEL_UNIT_METERS = 1

/** Prefix for optional attachment empties (both `stack1` and `attach_stack1` resolve). */
export const SHIP_ATTACH_PREFIX = 'attach_'

/**
 * Mesh/material name prefixes that opt a GLB surface into night-emissive driving.
 * Anything else keeps whatever the artist authored.
 */
export const SHIP_EMISSIVE_SLOT_PREFIXES = ['emissive_', 'glow_'] as const

export function isEmissiveSlotName(name: string): boolean {
  if (!name) return false
  const lower = name.toLowerCase()
  return SHIP_EMISSIVE_SLOT_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

/**
 * Quality presets that render GLB hulls. `low` stays fully procedural — the
 * authored meshes are the biggest per-ship cost, and low-end machines get more
 * out of the frame budget than out of the silhouette.
 */
export const GLB_ENABLED_QUALITY_PRESETS: readonly QualityPreset[] = ['medium', 'high']

export function isGlbAllowedForQuality(preset: QualityPreset): boolean {
  return GLB_ENABLED_QUALITY_PRESETS.includes(preset)
}

/** Root node name inside the GLB (informational for artists). */
export const shipModelRootName = (shipType: ShipType) => `${shipType}_root`

export interface ShipGlbContract {
  shipType: ShipType
  /** Public URL path served from /public */
  filename: string
  /** Attachment node names — must match blueprint attachmentPoints IDs */
  attachmentNodeIds: readonly string[]
  /** Optional GLB node name → blueprint attachment id overrides */
  attachmentSocketMap: Record<string, string>
}

/** Resolved model settings (blueprint `model` block with defaults filled in). */
export interface ShipModelSettings {
  url: string
  scale: number
  yOffset: number
  attachmentSocketMap: Record<string, string>
}

/**
 * Priority fleet: first wave of authored GLB hulls.
 * Remaining types stay procedural until assets land in public/models/.
 */
export const PRIORITY_GLB_SHIP_TYPES = ['cruise', 'container', 'tanker'] as const satisfies readonly ShipType[]

export type PriorityGlbShipType = (typeof PRIORITY_GLB_SHIP_TYPES)[number]

export interface ShipModelAttachmentPose {
  position: [number, number, number]
  rotation: [number, number, number]
}

export interface ShipModelCacheEntry {
  available: boolean
  url: string
  /** Local-space poses keyed by blueprint attachment id */
  attachments: Record<string, ShipModelAttachmentPose>
}

export type ShipModelPreloadProgress = {
  loaded: number
  total: number
  label: string
  percent: number
}
