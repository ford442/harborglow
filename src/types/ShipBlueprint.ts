import shipsJson from '../blueprints/ships.json'

// =============================================================================
// Vessel Blueprint Protocol v1.0
// Standardized format for AI-generated ship blueprints
// Any AI (Jules, Gemini, Claude, Cursor, etc.) can contribute new ships
// =============================================================================

/** Material properties for a ship part - Full PBR support */
export interface BlueprintMaterial {
  /** Emissive color for glowing parts (hex) */
  emissive?: string
  /** Metalness value 0-1 (PBR) - higher = more metallic */
  metalness?: number
  /** Roughness value 0-1 (PBR) - higher = more matte */
  roughness?: number
  /** Base color (hex) - overrides ship baseColor if set */
  color?: string
  /** Environment map intensity for reflections 0-1 */
  envMapIntensity?: number
}

/** Individual ship part (primitive geometry) */
export interface BlueprintPart {
  /** Unique identifier for this part */
  id: string
  /** Geometry type - approved formats only */
  type: 'box' | 'cylinder' | 'cone'
  /** Position [x, y, z] relative to ship center */
  position: [number, number, number]
  /** Rotation [x, y, z] in radians */
  rotation: [number, number, number]
  /** Size [width, height, depth] or [radiusTop, radiusBottom, height] for cylinders */
  size: [number, number, number]
  /** Optional material overrides */
  material?: BlueprintMaterial
  /** Cast shadows from this part */
  castShadow?: boolean
  /** Receive shadows on this part */
  receiveShadow?: boolean
}

/**
 * Optional authored GLB hull for a ship type (LOD0 only).
 *
 * The blueprint stays the source of truth for attachment points, colliders and
 * the LOD1/LOD2 silhouettes — the GLB only replaces the near-camera body.
 * See `docs/plans/CONTRIBUTING_SHIPS.md` for the authoring contract.
 */
export interface ShipModelConfig {
  /** Public URL, relative to the app base (e.g. `./models/cruise_liner.glb`). */
  url: string
  /** Multiplier applied on top of `blueprint.scale` to reconcile model units. */
  scale?: number
  /** Vertical nudge in metres, applied to the GLB root (origin should be waterline amidships). */
  yOffset?: number
  /** GLB node name → blueprint attachment point id, for models whose empties are named differently. */
  attachmentSocketMap?: Record<string, string>
}

/** Vessel Blueprint - complete ship definition with PBR support */
export interface ShipBlueprint {
  /** Ship type identifier (must be unique) */
  id: string
  /** Blueprint version (semver) */
  version: string
  /** Display name with version */
  name: string
  /** Global scale multiplier */
  scale: number
  /** Base color for unpainted parts */
  baseColor: string
  /** Array of geometry parts */
  parts: BlueprintPart[]
  /** Attachment point IDs for crane/LED upgrades */
  attachmentPoints: string[]
  /** AI contributor name(s) */
  contributor: string
  /** Date added (ISO 8601) */
  added: string
  /** Optional notes */
  notes?: string
  /** Environment map preset for reflections */
  envMap?: 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse'
  /** Ship casts shadows (default: true) */
  castShadow?: boolean
  /** Ship receives shadows (default: true) */
  receiveShadow?: boolean
  /** Default metalness for all parts */
  metalness?: number
  /** Default roughness for all parts */
  roughness?: number
  /** Per-ship music theme identifier for Tone.js mapping */
  musicTheme?: string
  /** LOD2 impostor geometry */
  lod2?: Lod2Data
  /** Optional authored GLB hull for LOD0 (procedural parts remain the fallback) */
  model?: ShipModelConfig
}

/** LOD2 feature definition */
export interface Lod2Feature {
  type: string
  xOffset: number
  yOffset: number
  zOffset: number
  width: number
  height: number
  depth: number
}

/** LOD2 impostor data */
export interface Lod2Data {
  hull: { width: number; height: number; length: number }
  profile: 'flat' | 'stepped' | 'tall' | 'barge'
  features: Lod2Feature[]
}

/** Vessel Blueprint Protocol root structure */
export interface BlueprintRegistry {
  /** Schema version identifier */
  $schema: string
  /** Human-readable description */
  description: string
  /** Array of ship blueprints */
  ships: ShipBlueprint[]
}

// =============================================================================
// LOADED REGISTRY
// Import from JSON file at build time
// =============================================================================

/** The loaded blueprint registry from ships.json */
export const BLUEPRINT_REGISTRY: BlueprintRegistry = shipsJson as BlueprintRegistry

/** Array of all ship blueprints */
export const SHIP_BLUEPRINTS: ShipBlueprint[] = BLUEPRINT_REGISTRY.ships

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get a blueprint by its ID
 * @param id - The ship type identifier
 * @returns ShipBlueprint or undefined if not found
 */
export const getBlueprint = (id: string): ShipBlueprint | undefined =>
  SHIP_BLUEPRINTS.find(b => b.id === id)

/**
 * Get all attachment points for a ship
 * @param blueprint - The ship blueprint
 * @returns Array of part IDs that can have upgrades attached
 */
export const getAttachmentPoints = (blueprint: ShipBlueprint): string[] =>
  blueprint.attachmentPoints

/**
 * Find a specific part by ID within a blueprint
 * @param blueprint - The ship blueprint
 * @param partId - The part identifier
 * @returns BlueprintPart or undefined if not found
 */
export const getPartById = (blueprint: ShipBlueprint, partId: string): BlueprintPart | undefined =>
  blueprint.parts.find(p => p.id === partId)

/**
 * List all available ship types
 * @returns Array of ship IDs
 */
export const getAvailableShipTypes = (): string[] =>
  SHIP_BLUEPRINTS.map(b => b.id)

/**
 * Get ship count
 * @returns Number of ships in registry
 */
export const getShipCount = (): number =>
  SHIP_BLUEPRINTS.length

// =============================================================================
// GLB MODEL CONFIG
// =============================================================================

/**
 * Validate a blueprint's optional `model` block.
 * Returns human-readable problems; an empty array means the config is usable.
 *
 * Invalid configs are never fatal — callers drop the model and stay procedural.
 */
export const validateShipModelConfig = (
  model: unknown,
  shipId = 'unknown'
): string[] => {
  const errors: string[] = []
  if (model === undefined || model === null) return errors

  if (typeof model !== 'object' || Array.isArray(model)) {
    return [`${shipId}: model must be an object`]
  }

  const cfg = model as Partial<ShipModelConfig>

  if (typeof cfg.url !== 'string' || cfg.url.trim() === '') {
    errors.push(`${shipId}: model.url must be a non-empty string`)
  } else if (!cfg.url.toLowerCase().endsWith('.glb') && !cfg.url.toLowerCase().endsWith('.gltf')) {
    errors.push(`${shipId}: model.url must point at a .glb or .gltf file (got "${cfg.url}")`)
  }

  if (cfg.scale !== undefined && (typeof cfg.scale !== 'number' || !(cfg.scale > 0))) {
    errors.push(`${shipId}: model.scale must be a positive number`)
  }

  if (cfg.yOffset !== undefined && (typeof cfg.yOffset !== 'number' || !Number.isFinite(cfg.yOffset))) {
    errors.push(`${shipId}: model.yOffset must be a finite number`)
  }

  if (cfg.attachmentSocketMap !== undefined) {
    const map = cfg.attachmentSocketMap
    if (typeof map !== 'object' || map === null || Array.isArray(map)) {
      errors.push(`${shipId}: model.attachmentSocketMap must be an object`)
    } else {
      for (const [node, id] of Object.entries(map)) {
        if (typeof id !== 'string' || id.trim() === '') {
          errors.push(`${shipId}: attachmentSocketMap["${node}"] must map to an attachment id`)
        }
      }
    }
  }

  return errors
}

/**
 * Resolved model config for a ship type, or null when the blueprint has none
 * (or declares an invalid one — in which case the problem is logged once and
 * the ship stays procedural rather than breaking the harbor).
 */
export const getShipModelConfig = (id: string): ShipModelConfig | null => {
  const blueprint = getBlueprint(id)
  if (!blueprint?.model) return null

  const errors = validateShipModelConfig(blueprint.model, id)
  if (errors.length > 0) {
    console.warn(`⚠️ Invalid model config, falling back to procedural:\n  ${errors.join('\n  ')}`)
    return null
  }

  return blueprint.model
}

/** Blueprint ids that declare a valid GLB hull. */
export const getBlueprintsWithModels = (): ShipBlueprint[] =>
  SHIP_BLUEPRINTS.filter((b) => getShipModelConfig(b.id) !== null)

console.log(`📋 Loaded ${getShipCount()} ships from standardized Vessel Blueprint Protocol v1.0`)
