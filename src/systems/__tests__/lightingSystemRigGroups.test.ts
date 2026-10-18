import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { lightingSystem } from '../lightingSystem'
import { getLightShowV2, SHIP_BPM } from '../lightShows'
import { createSimContext, setSim } from '../sim/SimContext'

function setSimMs(ms: number) {
  setSim({ ...createSimContext(1), simTime: ms / 1000 })
}

function atBeat(bpm: number, beat: number) {
  const ms = Math.ceil((60 / bpm) * beat * 1000)
  setSimMs(ms)
  lightingSystem.update(ms / 1000, bpm)
}

describe('LightingSystem rig-group playback', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    setSimMs(0)
  })

  afterEach(() => {
    lightingSystem.setShowOverride(null)
    setSimMs(0)
  })

  it('resolves each rig group of the show ship separately (fireboat cannons vs siren mast)', () => {
    const bpm = SHIP_BPM.fireboat
    lightingSystem.startHarborShow('fb', 'fireboat')
    atBeat(bpm, 18)

    expect(lightingSystem.getRigGroupState('fb', 'accent')).toMatchObject({ active: true, pattern: 'sweep', color: '#e8f8ff' })
    expect(lightingSystem.getRigGroupState('fb', 'mast')).toMatchObject({ active: true, pattern: 'strobe', color: '#ff1111' })
    expect(lightingSystem.getRigGroupState('fb', 'deck')).toMatchObject({ active: true, pattern: 'breathe' })
    // The fireboat has no gantry; nothing targets it, so it stays dark.
    expect(lightingSystem.getRigGroupState('fb', 'gantry')?.active).toBe(false)

    atBeat(bpm, 31)
    expect(lightingSystem.getRigGroupState('fb', 'accent')?.pattern).toBe('blackout')
  })

  it('returns null for ships whose show is not playing', () => {
    lightingSystem.startHarborShow('ice', 'icebreaker')
    atBeat(SHIP_BPM.icebreaker, 2)
    expect(lightingSystem.getRigGroupState('someone-else', 'funnel')).toBeNull()
    expect(lightingSystem.getRigGroupState('ice', 'funnel')?.color).toBe('#3dff9e')
  })

  it('ends on sim time at the first whole loop past 30 s (no wall-clock timer)', () => {
    const bpm = SHIP_BPM.cruise // 120 BPM × 32 beats = 16 s loops → 32 s
    lightingSystem.startHarborShow('cruise-1', 'cruise')
    expect(lightingSystem.getCurrentShow().duration).toBe(32000)

    setSimMs(31999)
    lightingSystem.update(31.999, bpm)
    expect(lightingSystem.isShowActive()).toBe(true)

    setSimMs(32000)
    lightingSystem.update(32, bpm)
    expect(lightingSystem.isShowActive()).toBe(false)
    expect(lightingSystem.getRigGroupState('cruise-1', 'funnel')).toBeNull()
  })

  it('an imported override show keeps looping past the preset duration', () => {
    lightingSystem.setShowOverride(getLightShowV2('fireboat')!)
    lightingSystem.startHarborShow('fb', 'fireboat')
    setSimMs(600_000)
    lightingSystem.update(600, SHIP_BPM.fireboat)
    expect(lightingSystem.isShowActive()).toBe(true)
  })
})
