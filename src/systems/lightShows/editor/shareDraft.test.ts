import { beforeAll, describe, expect, it, vi } from 'vitest'
import { lightShowRegistryV2 } from '../index'
import { forkShow, moveCue, placeCue, stretchCue } from './editorModel'
import { shareDraft } from './shareDraft'
import { SHARE_FRAGMENT_MAX, decodeShow, fromBase64Url } from '../../share/showCodec'
import { readShareFragment } from '../../share/shareLink'
import { parseLightShow } from '../../../schemas/lightShow'

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

const LOC = { origin: 'https://harborglow.example', pathname: '/play/' }

describe('shareDraft', () => {
  it('shares an edited draft as a #hgshow= link that decodes back to the same cues', async () => {
    let d = forkShow('cruise', lightShowRegistryV2.cruise)
    const p = placeCue(d, { beat: 10, lengthBeats: 2, target: 'mast', color: '#12ab34', pattern: 'strobe', easing: 'easeOut', intensity: 0.4 })
    d = moveCue(p.draft, p.cueId, 12.5)
    d = stretchCue(d, p.cueId, 'end', 17)

    const shared = await shareDraft('cruise', d.show, LOC)
    expect(shared.kind).toBe('link')
    if (shared.kind !== 'link') return
    expect(shared.url.startsWith('https://harborglow.example/play/#hgshow=')).toBe(true)
    expect(shared.url.length).toBeLessThanOrEqual(LOC.origin.length + LOC.pathname.length + 1 + SHARE_FRAGMENT_MAX)

    const fragment = readShareFragment(new URL(shared.url).hash)!
    const doc = await decodeShow(fromBase64Url(fragment))
    expect(doc.shipType).toBe('cruise')
    expect(doc.loopBeats).toBe(d.show.loopBeats)
    expect(doc.cues).toEqual(d.show.cues)
    expect(doc.cues.find((c) => c.id === p.cueId)).toMatchObject({ beat: 12.5, lengthBeats: 4.5, target: 'mast', color: '#12ab34' })
    // and what the receiver plays is a valid show
    expect(parseLightShow({ v: 2, id: doc.shipType, loopBeats: doc.loopBeats, cues: doc.cues }).ok).toBe(true)
  })

  it('shares every factory fork as something the codec accepts', async () => {
    for (const ship of Object.keys(lightShowRegistryV2) as Array<keyof typeof lightShowRegistryV2>) {
      const d = forkShow(ship, lightShowRegistryV2[ship])
      const shared = await shareDraft(ship, d.show, LOC)
      if (shared.kind === 'link') {
        const doc = await decodeShow(fromBase64Url(readShareFragment(new URL(shared.url).hash)!))
        expect(doc.cues, ship).toEqual(d.show.cues)
      } else {
        expect(shared.filename).toMatch(/\.hgshow$/)
        expect((await decodeShow(shared.bytes)).cues, ship).toEqual(d.show.cues)
      }
    }
  })

  it('falls back to a .hgshow file when the show is too big for a URL', async () => {
    let d = forkShow('cruise', lightShowRegistryV2.cruise)
    let r = 12345 // deterministic LCG: incompressible-ish colours / beats so it cannot fit a URL
    const next = () => (r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 4294967296
    const rows = ['funnel', 'bridge', 'hullStrip', 'gantry', 'mast', 'deck', 'accent', 'all'] as const
    for (let i = 0; i < 1500; i++) {
      d = placeCue(d, {
        beat: Math.floor(next() * 31 * 16) / 16,
        lengthBeats: 1 / 16,
        target: rows[Math.floor(next() * rows.length)],
        color: `#${Math.floor(next() * 0xffffff).toString(16).padStart(6, '0')}`,
        intensity: Math.floor(next() * 100) / 100,
      }).draft
    }
    const shared = await shareDraft('cruise', d.show, LOC)
    expect(shared.kind).toBe('file')
    if (shared.kind === 'file') expect((await decodeShow(shared.bytes)).cues).toEqual(d.show.cues)
  })

  it('refuses an empty show', async () => {
    const d = forkShow('cruise', lightShowRegistryV2.cruise)
    await expect(shareDraft('cruise', { ...d.show, cues: [] })).rejects.toThrow(/cue/)
  })
})
