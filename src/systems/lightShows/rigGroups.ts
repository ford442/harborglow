import type { ShipType } from '../../store/gameStoreTypes'
import type { RigGroupId } from './types'
import { getBlueprint } from '../../types/ShipBlueprint'

// Exact attachment-point ids whose group isn't obvious from the rules below.
const EXPLICIT: Record<string, RigGroupId> = {
  bridge: 'bridge',
  mast: 'mast',
  funnel: 'funnel',
  deck: 'deck',
  reliquefaction: 'gantry',
  towingNotch: 'gantry',
}

// First match wins; anything unmatched is an accent.
const RULES: ReadonlyArray<readonly [RegExp, RigGroupId]> = [
  [/^funnel|Stack$|^flare/, 'funnel'],
  [/bridge|superstructure|laboratory|^lab/i, 'bridge'],
  [/crane|gantry|aFrame|loadingArm|octagrabber|ramp|visor/i, 'gantry'],
  [/mast|dish|radar|siren|sonar|cameras/i, 'mast'],
  [/railing|hullWash|hatch|door|balcony|barrier/i, 'hullStrip'],
  [/deck|^stack\d|hold|pool|container|tank|lifeboat/i, 'deck'],
]

export function rigGroupForAttachmentPoint(pointId: string): RigGroupId {
  const explicit = EXPLICIT[pointId]
  if (explicit) return explicit
  for (const [re, group] of RULES) if (re.test(pointId)) return group
  return 'accent'
}

const cache = new Map<ShipType, ReadonlySet<RigGroupId>>()

/** The rig groups a ship actually has, derived from its blueprint attachment points. */
export function getRigGroups(shipType: ShipType): ReadonlySet<RigGroupId> {
  let groups = cache.get(shipType)
  if (!groups) {
    const points = getBlueprint(shipType)?.attachmentPoints ?? []
    groups = new Set(points.map(rigGroupForAttachmentPoint))
    cache.set(shipType, groups)
  }
  return groups
}
