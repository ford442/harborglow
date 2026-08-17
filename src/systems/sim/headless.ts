import * as THREE from 'three'

import { useGameStore } from '../../store/useGameStore'
import { systemRegistry } from '../bootstrap/SystemRegistry'
import {
  ensureMainSceneSystemsRegistered,
  resetMainSceneSystemsRegistrationForTests,
} from '../bootstrap/mainSceneSystems'
import type { FrameContext } from '../bootstrap/types'
import { stormSystem } from '../StormSystem'
import { waveSystem } from '../WaveSystem'
import { timeSystem } from '../timeSystem'
import { moonSystem } from '../moonSystem'
import { weatherSystem } from '../weatherSystem'
import { trafficSystem } from '../trafficSystem'
import { wildlifeSystem } from '../wildlifeSystem'
import { harborEventSystem } from '../eventSystem/HarborEventSystem'
import { dynamicEventSystem } from '../dynamicEventSystem'
import { seaEventsSystem } from '../seaEventsSystem'
import { SIM_DT } from './SimContext'
import { simScheduler } from './FixedStepScheduler'
import { captureSimSnapshot, hashSimSnapshot } from './hashState'
import type { ReplayFile } from './replay'

const dummyCamera = new THREE.PerspectiveCamera()
const dummyTrolley = new THREE.Vector3()

function dummyFrameContext(): FrameContext {
  return {
    delta: SIM_DT,
    elapsedTime: simScheduler.simTime,
    camera: dummyCamera,
    swayTrolleyPosition: dummyTrolley,
    bpm: 120,
    sim: simScheduler.context,
  }
}

export function resetDeterministicSystems(): void {
  useGameStore.setState({
    ships: [],
    currentShipId: null,
    wildlife: [],
    activeHarborEvents: [],
    activeSeaEvent: null,
    weather: 'clear',
    weatherIntensity: 0.5,
    timeOfDay: 22,
    isNight: true,
    gameTime: null,
    bpm: 128,
    stormIntensity: 0,
    stormTimeRemaining: 0,
    isStormActive: false,
    windDirection: 0,
    windStrength: 0,
    rainDensity: 0.5,
    season: 'summer',
    operationMode: 'tugboat',
    gameMode: 'sandbox',
    currentTrainingModule: null,
    reputation: 0,
    dailyShipsCompleted: 0,
    dailyShipsMissed: 0,
  })
  stormSystem.reset()
  waveSystem.reset()
  timeSystem.reset()
  moonSystem.reset()
  weatherSystem.reset()
  trafficSystem.reset()
  wildlifeSystem.reset()
  harborEventSystem.reset()
  dynamicEventSystem.reset()
  seaEventsSystem.reset()
}

export function bootHeadlessRegistry(): void {
  systemRegistry.clear()
  resetMainSceneSystemsRegistrationForTests()
  ensureMainSceneSystemsRegistered()
  systemRegistry.unregister('ambient-marine-life')
  systemRegistry.unregister('experimental-tech')
  systemRegistry.startAll()
  systemRegistry.pauseGroup('crane')
}

export interface HeadlessRunOptions {
  /** Start an active storm after reset so lightning/wind consume the RNG stream. */
  startStorm?: boolean
  /**
   * Pause spawn-heavy groups so long frame-rate runs stay O(ticks).
   * Time, weather, lighting, waves, and storm still tick.
   */
  coreOnly?: boolean
}

export function runHeadlessTicks(
  seed: number,
  ticks: number,
  frameHz = 60,
  opts: HeadlessRunOptions = {},
): string {
  simScheduler.reset(seed)
  resetDeterministicSystems()
  bootHeadlessRegistry()
  if (opts.coreOnly) {
    systemRegistry.pauseGroup('traffic')
    systemRegistry.pauseGroup('ambient')
    systemRegistry.pauseGroup('harbor-events')
  }
  if (opts.startStorm) stormSystem.start(180)
  const frameDt = 1 / frameHz
  while (simScheduler.tick < ticks) {
    const remaining = ticks - simScheduler.tick
    simScheduler.advance(Math.min(frameDt, remaining * SIM_DT + 1e-9), (sim) => {
      systemRegistry.tick(sim.dt, dummyFrameContext())
    })
  }
  return hashSimSnapshot()
}

function applyReplayInput(entry: ReplayFile['inputs'][number]): void {
  if (entry.action === 'storm.start') {
    const duration = typeof entry.payload === 'number'
      ? entry.payload
      : (entry.payload as { duration?: number })?.duration ?? 180
    stormSystem.start(duration)
  }
  if (entry.action === 'storm.stop') {
    stormSystem.stop()
  }
}

export function stepHeadless(frameDt = SIM_DT, beforeTick?: () => void): void {
  simScheduler.advance(frameDt, (sim) => {
    beforeTick?.()
    systemRegistry.tick(sim.dt, dummyFrameContext())
  })
}

export function runHeadlessReplay(file: ReplayFile, ticks: number): string {
  simScheduler.loadReplay(file, (entry) => {
    applyReplayInput(entry)
  })
  resetDeterministicSystems()
  bootHeadlessRegistry()
  while (simScheduler.tick < ticks) {
    stepHeadless(SIM_DT)
  }
  return hashSimSnapshot()
}

export { captureSimSnapshot, hashSimSnapshot }
