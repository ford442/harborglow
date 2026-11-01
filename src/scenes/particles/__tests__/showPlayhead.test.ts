import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getActiveShowEmitters } from '../../../systems/lightShows/showEmitters'
import { lightingSystem } from '../../../systems/lightingSystem'
import { beginSharedPlayback, endSharedPlayback } from '../../../systems/share/sharedPlaybackState'
import { createSimContext, setSim } from '../../../systems/sim/SimContext'
import { createBindingFrame } from '../showBindingDriver'
import { readShowPlayhead } from '../showPlayhead'

function setSimMs(ms: number) {
  setSim({ ...createSimContext(1), simTime: ms / 1000 })
}

/** Advance the sim clock and let lighting resolve its cue, like the frame loop does. */
function at(ms: number) {
  setSimMs(ms)
  lightingSystem.update(ms / 1000, 120)
}

describe('readShowPlayhead', () => {
  beforeEach(() => setSimMs(0))
  afterEach(() => {
    endSharedPlayback()
    lightingSystem.endHarborShow()
    setSimMs(0)
  })

  it('is idle with no show running', () => {
    const f = readShowPlayhead(createBindingFrame(), 1 / 60)
    expect(f.shipId).toBeNull()
    expect(f.shipType).toBeNull()
  })

  it('opens the cruise fireworks on the same frame the lighting drop cue starts (beat 24 = 12 s)', () => {
    lightingSystem.startHarborShow('cruise-1', 'cruise')
    const f = createBindingFrame()
    const live: ReturnType<typeof getActiveShowEmitters> = []

    at(11_999)
    readShowPlayhead(f, 1 / 60)
    expect(f.shipId).toBe('cruise-1')
    expect(lightingSystem.getActiveCue()?.beat).toBe(16)
    expect(getActiveShowEmitters(f.shipType!, f.beatInLoop, live)).toEqual([])

    at(12_000)
    readShowPlayhead(f, 1 / 60)
    expect(f.beatInLoop).toBe(24)
    expect(lightingSystem.getActiveCue()?.beat).toBe(24)
    expect(getActiveShowEmitters(f.shipType!, f.beatInLoop, live).map((b) => b.attachmentPoint)).toEqual(['funnel1', 'funnel2'])

    at(14_000)
    readShowPlayhead(f, 1 / 60)
    expect(lightingSystem.getActiveCue()?.beat).toBe(28)
    expect(getActiveShowEmitters(f.shipType!, f.beatInLoop, live).map((b) => b.attachmentPoint)).toEqual([
      'funnel1', 'funnel2', 'balcony5', 'balcony6',
    ])
  })

  it('wraps the fireboat loop at 32 beats (152 BPM)', () => {
    lightingSystem.startHarborShow('fb-1', 'fireboat')
    const f = createBindingFrame()
    const beatMs = (60 / 152) * 1000
    setSimMs(beatMs * 34)
    readShowPlayhead(f, 1 / 60)
    expect(f.beatSeconds).toBeCloseTo(60 / 152, 12)
    expect(f.beatInLoop).toBeCloseTo(2, 6)
  })

  it('goes idle between festival acts and picks up the next ship', () => {
    const f = createBindingFrame()
    lightingSystem.startHarborShow('a', 'cruise')
    readShowPlayhead(f, 1 / 60)
    expect(f.shipType).toBe('cruise')

    lightingSystem.endHarborShow()
    readShowPlayhead(f, 1 / 60)
    expect(f.shipId).toBeNull()

    setSimMs(5_000)
    lightingSystem.startHarborShow('b', 'icebreaker')
    setSimMs(5_000 + (60 / 108) * 1000 * 16)
    readShowPlayhead(f, 1 / 60)
    expect(f.shipId).toBe('b')
    expect(f.beatInLoop).toBeCloseTo(16, 6)
  })

  it('plays no factory bindings while a shared (imported) show is running', () => {
    lightingSystem.startHarborShow('cruise-1', 'cruise')
    beginSharedPlayback('cruise', null)
    const f = readShowPlayhead(createBindingFrame(), 1 / 60)
    expect(f.shipId).toBeNull()
    expect(f.shipType).toBeNull()
  })
})
