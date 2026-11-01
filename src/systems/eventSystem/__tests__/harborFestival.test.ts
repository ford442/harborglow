import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore, UPGRADE_TARGETS, type ShipType } from '../../../store/useGameStore'
import { simScheduler } from '../../sim/FixedStepScheduler'
import { bootHeadlessRegistry, hashSimSnapshot, resetDeterministicSystems, stepHeadless } from '../../sim/headless'
import { applyReplayInput } from '../../sim/applyInput'
import { harborEventSystem } from '../HarborEventSystem'
import {
  FESTIVAL_CREDITS_PER_ACT,
  FESTIVAL_FULL_SETLIST_BONUS,
  FESTIVAL_REPUTATION_PER_ACT,
  FESTIVAL_SETLIST,
  type FestivalPhase,
} from '../harborFestival'
import { lightingSystem } from '../../lightingSystem'
import { systemRegistry } from '../../bootstrap/SystemRegistry'
import { getLightShowV2 } from '../../lightShows'

const festival = harborEventSystem.festival
const MAX_TICKS = 60 * 120

function boot(seed: number) {
  simScheduler.reset(seed)
  resetDeterministicSystems()
  bootHeadlessRegistry()
  // As runHeadlessTicks' coreOnly: the festival needs core + harbor-events only.
  systemRegistry.pauseGroup('traffic')
  systemRegistry.pauseGroup('ambient')
}

function input(action: string, payload: unknown = null) {
  applyReplayInput({ tick: simScheduler.tick, action, payload })
}

function stepUntil(phase: FestivalPhase, maxTicks = MAX_TICKS): number {
  let ticks = 0
  while (festival.getSnapshot().phase !== phase) {
    if (ticks++ >= maxTicks) throw new Error(`festival never reached ${phase} (at ${festival.getSnapshot().phase})`)
    stepHeadless()
  }
  return ticks
}

/** Install every rig the ship needs, as the replay log would. */
function installAll(shipId: string, type: ShipType) {
  for (let i = 0; i < UPGRADE_TARGETS[type]; i++) {
    input('upgrade.install', { shipId, partName: `rig${i}` })
  }
}

function festivalShip() {
  const { shipId } = festival.getSnapshot()
  return useGameStore.getState().ships.find((s) => s.id === shipId)!
}

/** Drive a whole festival: every act's rigs installed as soon as it arrives. */
function runFullFestival(): string[] {
  const shows: string[] = []
  input('event.festival.start')
  for (let act = 0; act < FESTIVAL_SETLIST.length; act++) {
    const ship = festivalShip()
    installAll(ship.id, ship.type)
    stepUntil('playing')
    shows.push(lightingSystem.getCurrentShow().shipType!)
    stepUntil(act === FESTIVAL_SETLIST.length - 1 ? 'complete' : 'awaitingRigs')
  }
  return shows
}

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

beforeEach(() => {
  boot(253)
})

describe('Harbor Festival', () => {
  it('runs the three-ship setlist end to end, playing each native V2 show', { timeout: 30_000 }, () => {
    const credits = useGameStore.getState().harborCredits
    let reputationBeforeFinale = 0

    input('event.festival.start')
    let snap = festival.getSnapshot()
    expect(snap.phase).toBe('awaitingRigs')
    expect(harborEventSystem.hasActiveEvent('harbor_festival')).toBe(true)

    for (let act = 0; act < FESTIVAL_SETLIST.length; act++) {
      const ship = festivalShip()
      expect(ship.type).toBe(FESTIVAL_SETLIST[act])
      expect(useGameStore.getState().currentShipId).toBe(ship.id)
      expect(festival.getSnapshot().actIndex).toBe(act)

      // Nothing plays until every rig is in.
      stepHeadless()
      expect(festival.getSnapshot().phase).toBe('awaitingRigs')

      installAll(ship.id, ship.type)
      stepUntil('playing')
      const show = lightingSystem.getCurrentShow()
      expect(show).toMatchObject({ isActive: true, shipId: ship.id, shipType: ship.type })
      expect(useGameStore.getState().musicPlaying.get(ship.id)).toBe(true)
      // The targeted show drives this ship's rig groups.
      expect(lightingSystem.getRigGroupState(ship.id, 'bridge')).not.toBeNull()
      expect(getLightShowV2(ship.type)!.cues.some((c) => c.target !== 'all')).toBe(true)

      // The act lasts as long as the show (sim time), then the intermission.
      const playTicks = stepUntil('intermission')
      expect(playTicks / 60).toBeCloseTo(show.duration / 1000, 0)
      expect(lightingSystem.isShowActive()).toBe(false)
      // Installs earn their own reputation; measure only the festival's.
      reputationBeforeFinale = useGameStore.getState().reputation
      stepUntil(act === FESTIVAL_SETLIST.length - 1 ? 'complete' : 'awaitingRigs')
    }

    snap = festival.getSnapshot()
    const reward = FESTIVAL_SETLIST.length * FESTIVAL_CREDITS_PER_ACT + FESTIVAL_FULL_SETLIST_BONUS
    expect(snap).toMatchObject({ phase: 'complete', actsPlayed: 3, actsMissed: 0, rewardCredits: reward })
    expect(useGameStore.getState().harborCredits).toBe(credits + reward)
    expect(useGameStore.getState().reputation).toBe(reputationBeforeFinale + 3 * FESTIVAL_REPUTATION_PER_ACT)
    expect(harborEventSystem.hasActiveEvent('harbor_festival')).toBe(false)
    expect(useGameStore.getState().ships.map((s) => s.type)).toEqual([...FESTIVAL_SETLIST])
  })

  it('replays identically from the same seed and inputs', { timeout: 60_000 }, () => {
    const shows = runFullFestival()
    const a = hashSimSnapshot()
    expect(shows).toEqual([...FESTIVAL_SETLIST])

    boot(253)
    runFullFestival()
    expect(hashSimSnapshot()).toBe(a)
  })

  it('skips an act whose ship leaves before its show, and pays only for shows played', { timeout: 30_000 }, () => {
    input('event.festival.start')
    useGameStore.getState().removeShip(festivalShip().id)
    stepHeadless()
    expect(festival.getSnapshot()).toMatchObject({ phase: 'awaitingRigs', actIndex: 1, actsMissed: 1 })
    expect(festivalShip().type).toBe('fireboat')

    for (let act = 1; act < FESTIVAL_SETLIST.length; act++) {
      const ship = festivalShip()
      installAll(ship.id, ship.type)
      stepUntil('playing')
      stepUntil(act === FESTIVAL_SETLIST.length - 1 ? 'complete' : 'awaitingRigs')
    }
    expect(festival.getSnapshot()).toMatchObject({
      actsPlayed: 2,
      actsMissed: 1,
      rewardCredits: 2 * FESTIVAL_CREDITS_PER_ACT,
    })
  })

  it('stops on event.festival.stop and can start again', () => {
    input('event.festival.start')
    input('event.festival.start') // already running: ignored
    expect(useGameStore.getState().ships).toHaveLength(1)

    input('event.festival.stop')
    expect(festival.getSnapshot().phase).toBe('idle')
    expect(harborEventSystem.hasActiveEvent('harbor_festival')).toBe(false)

    input('event.festival.start', { setlist: ['icebreaker', 'not-a-ship'] })
    expect(festival.getSnapshot().setlist).toEqual(['icebreaker'])
    expect(festivalShip().type).toBe('icebreaker')
  })

  it('never starts on its own', () => {
    for (let i = 0; i < 600; i++) stepHeadless()
    expect(festival.getSnapshot().phase).toBe('idle')
  })

  it('resets with the deterministic systems', () => {
    input('event.festival.start')
    resetDeterministicSystems()
    expect(festival.getSnapshot().phase).toBe('idle')
    expect(harborEventSystem.snapshotIds()).toEqual([])
  })
})
