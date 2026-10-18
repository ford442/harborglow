import type { ShipType } from '../../store/gameStoreTypes'

// =============================================================================
// SHOW EMITTERS — GPU particle bindings for the native V2 factory shows (#253).
//
// Factory-only data: not part of LightShowV2, so share links and the valibot
// schema don't change. Each binding names an attachment point (the emitter's
// anchor) and a loop-relative beat window. The TSL compute particle system
// (#248) reads these through getActiveShowEmitters(); until it lands nothing
// renders them.
//
// Icebreaker glitter binds to the blueprint parts funnelMain / mastArray /
// heliDeck; once the Yamal GLB (#203) ships, the same ids resolve to its sockets.
// =============================================================================

export type ShowEmitterKind = 'fireworks' | 'mist' | 'glitter'

export interface ShowEmitterBinding {
  kind: ShowEmitterKind
  /** Attachment-point id on the ship's blueprint (or GLB socket map). */
  attachmentPoint: string
  /** Loop-relative start beat. */
  beat: number
  lengthBeats: number
  /** 0..1 share of the tier's particle budget this emitter may claim. */
  density: number
  /** '#rrggbb' */
  color: string
}

const CRUISE: readonly ShowEmitterBinding[] = [
  { kind: 'fireworks', attachmentPoint: 'funnel1', beat: 24, lengthBeats: 7, density: 0.25, color: '#ffd700' },
  { kind: 'fireworks', attachmentPoint: 'funnel2', beat: 24, lengthBeats: 7, density: 0.25, color: '#ffd700' },
  { kind: 'fireworks', attachmentPoint: 'balcony5', beat: 28, lengthBeats: 3, density: 0.15, color: '#ffffff' },
  { kind: 'fireworks', attachmentPoint: 'balcony6', beat: 28, lengthBeats: 3, density: 0.15, color: '#ffffff' },
]

const FIREBOAT: readonly ShowEmitterBinding[] = [
  { kind: 'mist', attachmentPoint: 'waterCannonPort', beat: 0, lengthBeats: 30, density: 0.4, color: '#cfefff' },
  { kind: 'mist', attachmentPoint: 'waterCannonStbd', beat: 0, lengthBeats: 30, density: 0.4, color: '#cfefff' },
  { kind: 'mist', attachmentPoint: 'foamDeck', beat: 16, lengthBeats: 8, density: 0.2, color: '#ffffff' },
]

const ICEBREAKER: readonly ShowEmitterBinding[] = [
  { kind: 'glitter', attachmentPoint: 'funnelMain', beat: 16, lengthBeats: 14, density: 0.35, color: '#e8f4ff' },
  { kind: 'glitter', attachmentPoint: 'mastArray', beat: 16, lengthBeats: 14, density: 0.35, color: '#ffffff' },
  { kind: 'glitter', attachmentPoint: 'heliDeck', beat: 20, lengthBeats: 10, density: 0.3, color: '#a8d8ea' },
]

export const FACTORY_SHOW_EMITTERS: Partial<Record<ShipType, readonly ShowEmitterBinding[]>> = {
  cruise: CRUISE,
  fireboat: FIREBOAT,
  icebreaker: ICEBREAKER,
}

/**
 * Emitters live at `beatInLoop` for a ship's factory show, pushed into `out`
 * (cleared first) so a per-frame caller can reuse one array.
 */
export function getActiveShowEmitters(
  shipType: ShipType,
  beatInLoop: number,
  out: ShowEmitterBinding[] = [],
): ShowEmitterBinding[] {
  out.length = 0
  const bindings = FACTORY_SHOW_EMITTERS[shipType]
  if (!bindings) return out
  for (const binding of bindings) {
    if (beatInLoop >= binding.beat && beatInLoop < binding.beat + binding.lengthBeats) out.push(binding)
  }
  return out
}
