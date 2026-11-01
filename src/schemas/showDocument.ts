import * as v from 'valibot'
import { SHIP_TYPES, type ShipType } from '../store/gameStoreDomainTypes'
import type { InputLogEntry } from '../systems/sim/replay'
import type { LightCueV2 } from '../systems/lightShows/types'
import { parseLightShow } from './lightShow'

// =============================================================================
// SHOW DOCUMENT SCHEMA — the payload of a share link / .hgshow file.
// Untrusted input: bounded sizes, strict objects, whitelisted replay actions.
// Load lazily with a dynamic import() (valibot stays out of the main chunk).
// =============================================================================

const SHOW_DOCUMENT_VERSION = 1

/** Every action `applyReplayInput` (src/systems/sim/applyInput.ts) handles. */
const REPLAY_ACTION_WHITELIST = [
  'storm.start',
  'storm.stop',
  'mission.iceEscort.start',
  'mission.iceEscort.complete',
  'mission.iceEscort.fail',
  'ship.spawn',
  'crane.axes',
  'upgrade.install',
] as const

const MAX_CUES = 2048
const MAX_INPUTS = 20000
const MAX_TICKS = 60 * 60 * 30 // 30 minutes at 60 Hz

interface ShowSim {
  seed: number
  dt: number
  /** Tick at which `hash` was captured. */
  ticks: number
  /** hashSimSnapshot() at `ticks` — 8 hex chars. */
  hash: string
}

export interface ShowDocument {
  v: 1
  shipType: ShipType
  /** Music/band track. Keyed by ShipType today, so equal to `shipType`. */
  trackId: string
  loopBeats: number
  cues: LightCueV2[]
  /** Optional recorded performance; requires `sim`. */
  inputLog?: InputLogEntry[]
  sim?: ShowSim
}

const ShipTypeSchema = v.picklist(SHIP_TYPES)

const InputSchema = v.strictObject({
  tick: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(MAX_TICKS)),
  action: v.picklist(REPLAY_ACTION_WHITELIST),
  payload: v.unknown(),
})

const SimSchema = v.strictObject({
  seed: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(0xffffffff)),
  dt: v.pipe(v.number(), v.finite(), v.minValue(1 / 240), v.maxValue(1 / 10)),
  ticks: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(MAX_TICKS)),
  hash: v.pipe(v.string(), v.regex(/^[0-9a-f]{8}$/, 'hash must be 8 hex chars')),
})

const DocumentSchema = v.strictObject({
  v: v.literal(SHOW_DOCUMENT_VERSION),
  shipType: ShipTypeSchema,
  trackId: ShipTypeSchema,
  loopBeats: v.pipe(v.number(), v.finite(), v.gtValue(0)),
  // Per-cue shape and ordering are checked by parseLightShow below.
  cues: v.pipe(v.array(v.unknown()), v.maxLength(MAX_CUES)),
  inputLog: v.optional(v.pipe(v.array(InputSchema), v.maxLength(MAX_INPUTS))),
  sim: v.optional(SimSchema),
})

interface ShowDocumentError {
  message: string
}

export type ParseShowDocumentResult =
  | { ok: true; doc: ShowDocument }
  | { ok: false; error: ShowDocumentError }

const fail = (message: string): ParseShowDocumentResult => ({ ok: false, error: { message } })

/** Validate an untrusted show document. Never throws. */
export function parseShowDocument(input: unknown): ParseShowDocumentResult {
  const result = v.safeParse(DocumentSchema, input)
  if (!result.success) {
    const issue = result.issues[0]
    const path = (issue.path ?? []).map((p) => String(p.key)).join('.')
    return fail(path ? `${path}: ${issue.message}` : issue.message)
  }
  const doc = result.output

  const show = parseLightShow({ v: 2, id: doc.shipType, loopBeats: doc.loopBeats, cues: doc.cues })
  if (!show.ok) return fail(show.error.message)

  if (doc.trackId !== doc.shipType) return fail('trackId must match shipType')

  if (doc.inputLog) {
    if (!doc.sim) return fail('sim is required when inputLog is present')
    let last = 0
    for (let i = 0; i < doc.inputLog.length; i++) {
      const tick = doc.inputLog[i].tick
      if (tick < last) return fail(`inputLog ${i}: ticks must be non-decreasing`)
      if (tick > doc.sim.ticks) return fail(`inputLog ${i}: tick is past sim.ticks`)
      last = tick
    }
  }
  if (doc.sim && !doc.inputLog) return fail('sim requires inputLog')

  return {
    ok: true,
    doc: {
      v: 1,
      shipType: doc.shipType,
      trackId: doc.trackId,
      loopBeats: doc.loopBeats,
      cues: show.show.cues,
      ...(doc.inputLog ? { inputLog: doc.inputLog as InputLogEntry[] } : {}),
      ...(doc.sim ? { sim: doc.sim } : {}),
    },
  }
}
