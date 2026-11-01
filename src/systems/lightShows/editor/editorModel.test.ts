import { describe, expect, it } from 'vitest'
import { parseLightShow } from '../../../schemas/lightShow'
import type { ShipType } from '../../../store/gameStoreTypes'
import { lightShowRegistryV2 } from '../index'
import { RIG_GROUP_IDS } from '../rigCues'
import type { LightShowV2 } from '../types'
import {
  HISTORY_LIMIT,
  MAX_LOOP_BEATS,
  MIN_CUE_BEATS,
  MIN_LOOP_BEATS,
  TARGET_ROWS,
  barCount,
  canRedo,
  canUndo,
  checkInvariants,
  commit,
  copyBar,
  createEditorState,
  deleteCue,
  draftFromShow,
  duplicateCue,
  emptyDraft,
  findCue,
  forkShow,
  moveCue,
  placeCue,
  quantize,
  redo,
  setCueProps,
  setLoopBeats,
  snapBeat,
  stretchCue,
  undo,
  type EditorDraft,
} from './editorModel'

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o)
    for (const v of Object.values(o)) deepFreeze(v)
  }
  return o
}

const expectValid = (d: EditorDraft) => {
  expect(checkInvariants(d)).toEqual([])
  const parsed = parseLightShow(JSON.parse(JSON.stringify(d.show)))
  expect(parsed.ok, parsed.ok ? '' : parsed.error.message).toBe(true)
}

const blank = () => emptyDraft('cruise')

describe('placeCue', () => {
  it('assigns ${showId}:${n} ids from a monotonic counter, never reusing a deleted id', () => {
    let d = blank()
    const a = placeCue(d, { beat: 4 })
    const b = placeCue(a.draft, { beat: 0 })
    expect([a.cueId, b.cueId]).toEqual(['cruise-user:0', 'cruise-user:1'])
    const gone = deleteCue(b.draft, a.cueId)
    d = placeCue(gone, { beat: 2 }).draft
    expect(d.show.cues.map((c) => c.id)).toEqual(['cruise-user:1', 'cruise-user:2'])
    expect(d.nextId).toBe(3)
  })

  it('sorts by beat and keeps insertion order for ties', () => {
    let d = blank()
    d = placeCue(d, { beat: 8, target: 'funnel' }).draft
    d = placeCue(d, { beat: 8, target: 'bridge' }).draft
    d = placeCue(d, { beat: 0, target: 'deck' }).draft
    d = placeCue(d, { beat: 8, target: 'mast' }).draft
    expect(d.show.cues.map((c) => c.target)).toEqual(['deck', 'funnel', 'bridge', 'mast'])
    expectValid(d)
  })

  it('shortens (never moves) a cue that would overrun the loop', () => {
    const { draft } = placeCue(blank(), { beat: 31, lengthBeats: 8 })
    const c = draft.show.cues[0]
    expect(c.beat).toBe(31)
    expect(c.lengthBeats).toBe(1)
  })

  it('clamps beat, length and intensity and normalises bad input', () => {
    const { draft } = placeCue(blank(), {
      beat: 999, lengthBeats: -3, intensity: 7, color: 'red', pattern: 'nope' as never, target: 'zzz' as never, easing: 'x' as never,
    })
    const c = draft.show.cues[0]
    expect(c.beat).toBe(32 - MIN_CUE_BEATS)
    expect(c.lengthBeats).toBe(MIN_CUE_BEATS)
    expect(c.intensity).toBe(1)
    expect(c.color).toBe('#ffffff')
    expect([c.pattern, c.target, c.easing]).toEqual(['breathe', 'all', 'step'])
    expectValid(draft)
  })

  it('lower-cases colours and tolerates NaN', () => {
    const { draft } = placeCue(blank(), { beat: NaN, lengthBeats: NaN, intensity: NaN, color: '#FFD700' })
    expect(draft.show.cues[0]).toMatchObject({ beat: 0, lengthBeats: 1, intensity: 1, color: '#ffd700' })
  })
})

describe('moveCue', () => {
  const base = () => placeCue(blank(), { beat: 4, lengthBeats: 4, target: 'funnel' })

  it('moves in time and across rows, keeping length', () => {
    const { draft, cueId } = base()
    const m = moveCue(draft, cueId, 10, 'bridge')
    expect(m.show.cues[0]).toMatchObject({ beat: 10, lengthBeats: 4, target: 'bridge' })
  })

  it('clamps so the cue stays inside the loop', () => {
    const { draft, cueId } = base()
    expect(moveCue(draft, cueId, 100).show.cues[0].beat).toBe(28)
    expect(moveCue(draft, cueId, -5).show.cues[0].beat).toBe(0)
  })

  it('returns the same reference when nothing changes or the id is unknown', () => {
    const { draft, cueId } = base()
    expect(moveCue(draft, cueId, 4)).toBe(draft)
    expect(moveCue(draft, 'nope', 9)).toBe(draft)
  })

  it('re-sorts when the move crosses another cue', () => {
    let d = placeCue(blank(), { beat: 0, target: 'funnel' }).draft
    const b = placeCue(d, { beat: 8, target: 'bridge' })
    d = moveCue(b.draft, b.cueId, 0)
    expect(d.show.cues.map((c) => c.target)).toEqual(['funnel', 'bridge'])
    d = moveCue(d, 'cruise-user:0', 12)
    expect(d.show.cues.map((c) => c.target)).toEqual(['bridge', 'funnel'])
    expectValid(d)
  })
})

describe('stretchCue', () => {
  const base = () => placeCue(blank(), { beat: 8, lengthBeats: 4 })

  it('drags the end edge', () => {
    const { draft, cueId } = base()
    expect(stretchCue(draft, cueId, 'end', 14).show.cues[0]).toMatchObject({ beat: 8, lengthBeats: 6 })
  })

  it('drags the start edge, keeping the end fixed', () => {
    const { draft, cueId } = base()
    expect(stretchCue(draft, cueId, 'start', 6).show.cues[0]).toMatchObject({ beat: 6, lengthBeats: 6 })
  })

  it('enforces the 1/16 minimum from either side', () => {
    const { draft, cueId } = base()
    expect(stretchCue(draft, cueId, 'end', 0).show.cues[0].lengthBeats).toBe(MIN_CUE_BEATS)
    const s = stretchCue(draft, cueId, 'start', 50).show.cues[0]
    expect(s.lengthBeats).toBe(MIN_CUE_BEATS)
    expect(s.beat + s.lengthBeats).toBe(12)
  })

  it('cannot leave the loop', () => {
    const { draft, cueId } = base()
    expect(stretchCue(draft, cueId, 'end', 500).show.cues[0].lengthBeats).toBe(24)
    expect(stretchCue(draft, cueId, 'start', -9).show.cues[0]).toMatchObject({ beat: 0, lengthBeats: 12 })
  })

  it('is a no-op for the same edge position', () => {
    const { draft, cueId } = base()
    expect(stretchCue(draft, cueId, 'end', 12)).toBe(draft)
  })
})

describe('deleteCue / duplicateCue / setCueProps', () => {
  it('deletes by id; unknown id is a no-op', () => {
    const { draft, cueId } = placeCue(blank(), { beat: 1 })
    expect(deleteCue(draft, 'x')).toBe(draft)
    expect(deleteCue(draft, cueId).show.cues).toEqual([])
  })

  it('duplicates onto another beat/row with a fresh id', () => {
    const a = placeCue(blank(), { beat: 0, lengthBeats: 2, target: 'funnel', color: '#ff0000' })
    const { draft, cueId } = duplicateCue(a.draft, a.cueId, 8, 'mast')
    expect(cueId).toBe('cruise-user:1')
    expect(findCue(draft, cueId!)).toMatchObject({ beat: 8, lengthBeats: 2, target: 'mast', color: '#ff0000' })
    expect(duplicateCue(draft, 'nope', 1).cueId).toBeNull()
  })

  it('sets props, ignores invalid values, and is a no-op when unchanged', () => {
    const { draft, cueId } = placeCue(blank(), { beat: 30, lengthBeats: 2, color: '#112233' })
    const d = setCueProps(draft, cueId, { pattern: 'strobe', easing: 'easeOut', intensity: 0.25, color: '#ABCDEF', target: 'deck', lengthBeats: 99 })
    expect(d.show.cues[0]).toMatchObject({ pattern: 'strobe', easing: 'easeOut', intensity: 0.25, color: '#abcdef', target: 'deck', lengthBeats: 2 })
    const bad = setCueProps(d, cueId, { color: 'nope', pattern: 'x' as never, intensity: NaN })
    expect(bad).toBe(d)
    expect(setCueProps(d, 'nope', { intensity: 0 })).toBe(d)
    expectValid(d)
  })
})

describe('copyBar', () => {
  it('copies the cues that start in a bar and replaces the destination bar', () => {
    let d = blank()
    d = placeCue(d, { beat: 0, lengthBeats: 1, target: 'funnel' }).draft
    d = placeCue(d, { beat: 2, lengthBeats: 2, target: 'bridge' }).draft
    d = placeCue(d, { beat: 8, lengthBeats: 1, target: 'deck' }).draft // dest bar 2: replaced
    const c = copyBar(d, 0, 2)
    expect(c.show.cues.map((x) => [x.beat, x.target])).toEqual([
      [0, 'funnel'], [2, 'bridge'], [8, 'funnel'], [10, 'bridge'],
    ])
    expect(c.nextId).toBe(d.nextId + 2)
    expectValid(c)
  })

  it('clips copies at the loop end and ignores bad bars / same bar / empty-over-empty', () => {
    let d = placeCue(blank(), { beat: 0, lengthBeats: 8 }).draft
    d = copyBar(d, 0, 7)
    expect(d.show.cues.at(-1)).toMatchObject({ beat: 28, lengthBeats: 4 })
    expect(copyBar(d, 0, 0)).toBe(d)
    expect(copyBar(d, 0, 8)).toBe(d)
    expect(copyBar(d, -1, 1)).toBe(d)
    expect(copyBar(d, 1.5, 2)).toBe(d)
    expect(copyBar(blank(), 0, 1)).toEqual(blank())
    expectValid(d)
  })

  it('copying an empty bar clears the destination', () => {
    const d = placeCue(blank(), { beat: 4 }).draft
    expect(copyBar(d, 0, 1).show.cues).toEqual([])
  })

  it('counts bars', () => {
    expect(barCount(32)).toBe(8)
    expect(barCount(18)).toBe(5)
  })
})

describe('quantize', () => {
  it('snaps beats and lengths to the grid', () => {
    let d = placeCue(blank(), { beat: 1.37, lengthBeats: 0.9 }).draft
    d = placeCue(d, { beat: 5.2, lengthBeats: 0.01 }).draft
    expect(quantize(d, 4).show.cues.map((c) => [c.beat, c.lengthBeats])).toEqual([[1, 1], [5, 1]])
    expect(quantize(d, 8).show.cues.map((c) => [c.beat, c.lengthBeats])).toEqual([[1.5, 1], [5, 0.5]])
    expect(quantize(d, 16).show.cues.map((c) => [c.beat, c.lengthBeats])).toEqual([[1.25, 1], [5.25, 0.25]])
  })

  it('only touches the given ids and is a no-op once snapped', () => {
    let d = placeCue(blank(), { beat: 1.3 }).draft
    const b = placeCue(d, { beat: 2.3 })
    d = quantize(b.draft, 4, [b.cueId])
    expect(d.show.cues.map((c) => c.beat)).toEqual([1.3, 2])
    const all = quantize(d, 4)
    expect(quantize(all, 4)).toBe(all)
  })

  it('keeps the last cue inside the loop', () => {
    const d = placeCue(blank(), { beat: 31.4, lengthBeats: 0.6 }).draft
    expectValid(quantize(d, 4))
  })

  it('snapBeat is the UI helper', () => {
    expect(snapBeat(1.3, 4)).toBe(1)
    expect(snapBeat(1.3, null)).toBe(1.3)
    expect(snapBeat(1.3, 16)).toBe(1.25)
  })
})

describe('setLoopBeats', () => {
  it('clamps to 16–64 and drops / clips cues', () => {
    let d = placeCue(blank(), { beat: 4, lengthBeats: 20 }).draft
    d = placeCue(d, { beat: 30 }).draft
    const s = setLoopBeats(d, 16)
    expect(s.show.loopBeats).toBe(16)
    expect(s.show.cues).toHaveLength(1)
    expect(s.show.cues[0]).toMatchObject({ beat: 4, lengthBeats: 12 })
    expect(setLoopBeats(d, 4).show.loopBeats).toBe(MIN_LOOP_BEATS)
    expect(setLoopBeats(d, 1000).show.loopBeats).toBe(MAX_LOOP_BEATS)
    expect(setLoopBeats(d, 32)).toBe(d)
    expectValid(s)
  })
})

describe('draftFromShow / forkShow', () => {
  const ships = Object.keys(lightShowRegistryV2) as ShipType[]

  it.each(ships)('forks the %s factory show into a valid `${ship}-user` draft', (ship) => {
    const d = forkShow(ship, lightShowRegistryV2[ship])
    expect(d.show.id).toBe(`${ship}-user`)
    expect(d.show.cues.length).toBe(lightShowRegistryV2[ship].cues.length)
    expect(d.show.cues.every((c, i) => c.id === `${ship}-user:${i}`)).toBe(true)
    expect(d.nextId).toBe(d.show.cues.length)
    expectValid(d)
  })

  it('does not alter beats / targets / lengths of the factory show', () => {
    const f = lightShowRegistryV2.cruise
    const d = forkShow('cruise', f)
    expect(d.show.cues.map(({ id: _id, ...c }) => c)).toEqual(f.cues.map(({ id: _id, ...c }) => c))
  })

  it('round-trips a saved draft unchanged (ids kept, counter restored)', () => {
    let d = forkShow('cruise', lightShowRegistryV2.cruise)
    d = deleteCue(d, 'cruise-user:3')
    const again = draftFromShow(JSON.parse(JSON.stringify(d.show)))
    expect(again.show).toEqual(d.show)
    expect(again.nextId).toBe(d.nextId) // 9 cues were 0..9 minus one deleted -> max id + 1
  })

  it('repairs hostile input instead of throwing', () => {
    const hostile = {
      v: 2, id: 'tanker-user', loopBeats: 5000, seed: 3,
      cues: [
        { id: 'a', beat: 40, lengthBeats: 9, target: 'bogus', pattern: 'x', color: 'blue', intensity: 4, easing: 'q' },
        { id: 'a', beat: 70, lengthBeats: 1, target: 'all', pattern: 'snap', color: '#00FF00', intensity: 1, easing: 'step' },
        { id: 'b', beat: 2, lengthBeats: 0, target: 'deck', pattern: 'snap', color: '#00FF00', intensity: -1, easing: 'step' },
      ],
    } as unknown as LightShowV2
    const d = draftFromShow(hostile)
    expect(d.show.loopBeats).toBe(MAX_LOOP_BEATS)
    expect(d.show.seed).toBe(3)
    expect(d.show.cues).toHaveLength(2) // beat 70 starts past the 64-beat loop: dropped
    expect(d.show.cues.map((c) => c.id)).toEqual(['tanker-user:0', 'tanker-user:1'])
    expectValid(d)
  })
})

describe('immutability & determinism', () => {
  it('never mutates its inputs', () => {
    let d = deepFreeze(forkShow('cruise', lightShowRegistryV2.cruise))
    const id = d.show.cues[2].id
    d = deepFreeze(moveCue(d, id, 5, 'mast'))
    d = deepFreeze(stretchCue(d, id, 'end', 9))
    d = deepFreeze(setCueProps(d, id, { intensity: 0.1 }))
    d = deepFreeze(placeCue(d, { beat: 3 }).draft)
    d = deepFreeze(copyBar(d, 0, 1))
    d = deepFreeze(quantize(d, 4))
    d = deepFreeze(setLoopBeats(d, 20))
    d = deepFreeze(deleteCue(d, id))
    expectValid(d)
  })

  it('produces a fresh show object per change (rigCues caches by identity)', () => {
    const { draft, cueId } = placeCue(blank(), { beat: 1 })
    expect(moveCue(draft, cueId, 2).show).not.toBe(draft.show)
  })

  it('the same edit script yields byte-identical output', () => {
    const run = () => {
      let d = forkShow('container', lightShowRegistryV2.container)
      d = placeCue(d, { beat: 3.5, target: 'gantry', color: '#abc123' }).draft
      d = copyBar(d, 1, 5)
      d = quantize(d, 8)
      return JSON.stringify(d)
    }
    expect(run()).toBe(run())
  })
})

describe('fuzz: invariants + parseLightShow after every op', () => {
  function rng(seed: number) {
    let a = seed >>> 0
    return () => {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  it.each([1, 2, 3, 4, 5, 6])('seed %i', (seed) => {
    const r = rng(seed)
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]
    let d = r() < 0.5 ? blank() : forkShow('fireboat', lightShowRegistryV2.fireboat)
    for (let i = 0; i < 400; i++) {
      const ids = d.show.cues.map((c) => c.id)
      const id = ids.length ? pick(ids) : 'none'
      const beat = (r() - 0.2) * 80
      switch (Math.floor(r() * 10)) {
        case 0: d = placeCue(d, { beat, lengthBeats: r() * 12, target: pick(TARGET_ROWS), intensity: r() * 1.4 - 0.2 }).draft; break
        case 1: d = moveCue(d, id, beat, pick(TARGET_ROWS)); break
        case 2: d = stretchCue(d, id, r() < 0.5 ? 'start' : 'end', beat); break
        case 3: d = deleteCue(d, id); break
        case 4: d = copyBar(d, Math.floor(r() * 9), Math.floor(r() * 9)); break
        case 5: d = quantize(d, pick([4, 8, 16] as const), r() < 0.5 ? undefined : [id]); break
        case 6: d = setCueProps(d, id, { lengthBeats: r() * 20, intensity: r(), pattern: pick(['snap', 'sweep', 'blackout'] as const) }); break
        case 7: d = setLoopBeats(d, 10 + r() * 60); break
        case 8: d = duplicateCue(d, id, beat).draft; break
        default: d = placeCue(d, { beat: Math.round(beat), target: pick(RIG_GROUP_IDS) }).draft
      }
      expect(checkInvariants(d), `op ${i}`).toEqual([])
      if (i % 25 === 0) expectValid(d)
    }
    expectValid(d)
  })
})

describe('history', () => {
  it('commit / undo / redo', () => {
    const s0 = createEditorState(blank())
    const p = placeCue(s0.draft, { beat: 1 })
    const s1 = commit(s0, p.draft)
    const s2 = commit(s1, moveCue(s1.draft, p.cueId, 9))
    expect([canUndo(s0), canUndo(s2), canRedo(s2)]).toEqual([false, true, false])
    const u = undo(s2)
    expect(u.draft).toBe(s1.draft)
    expect(canRedo(u)).toBe(true)
    expect(redo(u).draft).toBe(s2.draft)
    expect(undo(s0)).toBe(s0)
    expect(redo(s2)).toBe(s2)
  })

  it('a new edit clears redo; a no-op does not touch history', () => {
    const s0 = createEditorState(blank())
    const s1 = commit(s0, placeCue(s0.draft, { beat: 1 }).draft)
    const back = undo(s1)
    expect(commit(back, back.draft)).toBe(back)
    const s2 = commit(back, placeCue(back.draft, { beat: 2 }).draft)
    expect(canRedo(s2)).toBe(false)
  })

  it('caps the stack at 100, dropping the oldest', () => {
    let s = createEditorState(blank())
    for (let i = 0; i < HISTORY_LIMIT + 30; i++) s = commit(s, placeCue(s.draft, { beat: i % 30 }).draft)
    expect(s.past).toHaveLength(HISTORY_LIMIT)
    let n = 0
    while (canUndo(s)) { s = undo(s); n++ }
    expect(n).toBe(HISTORY_LIMIT)
    expect(s.draft.show.cues.length).toBe(30) // 130 placed, oldest 100 states reachable -> state after 30
  })

  it('undo restores the id counter, so a replayed place gets the same id', () => {
    const s0 = createEditorState(blank())
    const a = placeCue(s0.draft, { beat: 1 })
    const s1 = commit(s0, a.draft)
    const b = placeCue(undo(s1).draft, { beat: 1 })
    expect(b.cueId).toBe(a.cueId)
  })
})
