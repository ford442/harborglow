import * as v from 'valibot'
import type { LightShowV2 } from '../systems/lightShows/types'

// =============================================================================
// LIGHT SHOW SCHEMA — validates untrusted LightShowV2 documents (share links,
// .hgshow files). Load it lazily with a dynamic import().
// Nothing in the runtime imports it statically.
// =============================================================================

const PatternSchema = v.picklist(['breathe', 'sweep', 'strobe', 'snap', 'blackout'])
const TargetSchema = v.picklist(['all', 'funnel', 'bridge', 'hullStrip', 'gantry', 'mast', 'deck', 'accent'])
const EasingSchema = v.picklist(['step', 'linear', 'easeIn', 'easeOut', 'easeInOut'])

const CueSchema = v.strictObject({
  id: v.pipe(v.string(), v.minLength(1)),
  beat: v.pipe(v.number(), v.finite(), v.minValue(0)),
  lengthBeats: v.pipe(v.number(), v.finite(), v.gtValue(0)),
  target: TargetSchema,
  pattern: PatternSchema,
  color: v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, 'color must be #rrggbb')),
  intensity: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
  easing: EasingSchema,
})

const ShowSchema = v.pipe(
  v.strictObject({
    v: v.literal(2),
    id: v.pipe(v.string(), v.minLength(1)),
    loopBeats: v.pipe(v.number(), v.finite(), v.gtValue(0)),
    seed: v.optional(v.pipe(v.number(), v.integer())),
    cues: v.array(CueSchema),
  }),
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) return
    const { cues, loopBeats } = dataset.value
    const seen = new Set<string>()
    cues.forEach((cue, i) => {
      const at = (key: string, value: unknown) => [
        { type: 'object', origin: 'value', input: dataset.value, key: 'cues', value: cues },
        { type: 'array', origin: 'value', input: cues, key: i, value: cue },
        { type: 'object', origin: 'value', input: cue, key, value },
      ] as unknown as [v.ObjectPathItem]
      if (cue.beat >= loopBeats) {
        addIssue({ message: `beat must be < loopBeats (${loopBeats})`, path: at('beat', cue.beat) })
      }
      if (i > 0 && cue.beat < cues[i - 1].beat) {
        addIssue({ message: 'cues must be sorted by beat', path: at('beat', cue.beat) })
      }
      if (seen.has(cue.id)) {
        addIssue({ message: `duplicate cue id "${cue.id}"`, path: at('id', cue.id) })
      }
      seen.add(cue.id)
    })
  }),
)

export interface LightShowImportError {
  /** Human-readable, e.g. `cue 7: color must be #rrggbb` */
  message: string
  /** Valibot issue path of the first issue, e.g. ['cues', 7, 'color'] */
  path: Array<string | number>
  issues: Array<{ message: string; path: Array<string | number> }>
}

export type ParseLightShowResult =
  | { ok: true; show: LightShowV2 }
  | { ok: false; error: LightShowImportError }

function describe(path: Array<string | number>, message: string): string {
  if (path[0] === 'cues' && typeof path[1] === 'number') return `cue ${path[1]}: ${message}`
  return path.length > 0 ? `${path.join('.')}: ${message}` : message
}

/** Validate an untrusted light-show document. Never throws. */
export function parseLightShow(input: unknown): ParseLightShowResult {
  const result = v.safeParse(ShowSchema, input)
  if (result.success) return { ok: true, show: result.output as LightShowV2 }
  const issues = result.issues.map((issue) => ({
    message: issue.message,
    path: (issue.path ?? []).map((p) => p.key as string | number),
  }))
  const first = issues[0]
  return {
    ok: false,
    error: { message: describe(first.path, first.message), path: first.path, issues },
  }
}
