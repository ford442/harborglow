import shipsJson from '../blueprints/ships.json'

// =============================================================================
// Vessel Blueprint Protocol v1.0
// Standardized format for AI-generated ship blueprints
// Any AI (Jules, Gemini, Claude, Cursor, etc.) can contribute new ships
// =============================================================================

/** Material properties for a ship part */
export interface BlueprintMaterial {
  /** Emissive color for glowing parts (hex) */
  emissive?: string
  /** Metalness value 0-1 */
  metalness?: number
  /** Roughness value 0-1 */
  roughness?: number
  /** Base color (hex) - overrides ship baseColor if set */
  color?: string
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
}

/** Vessel Blueprint - complete ship definition */
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

console.log(`📋 Loaded ${getShipCount()} ships from standardized Vessel Blueprint Protocol v1.0`)
