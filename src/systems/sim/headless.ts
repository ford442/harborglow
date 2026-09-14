import * as THREE from 'three'

import { useGameStore } from '../../store/useGameStore'
import { systemRegistry } from '../bootstrap/SystemRegistry'
import {
  ensureMainSceneSystemsRegistered,
  resetMainSceneSystemsRegistrationForTests,
} from '../bootstrap/mainSceneSystems'
import type { FrameContext } from '../bootstrap/types'
import { stormSystem } from '../StormSystem'
import { iceFieldSystem } from '../ice/IceFieldSystem'
import { ShipSpawner } from '../shipSpawner'
import { resetCraneAxes } from '../cranePhysics'
import { applyReplayInput } from './applyInput'
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

export function resetDeterministicSystems(opts: { preserveStoreMode?: boolean } = {}): void {
  const prev = useGameStore.getState()
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
    operationMode: opts.preserveStoreMode ? prev.operationMode : 'tugboat',
    gameMode: opts.preserveStoreMode ? prev.gameMode : 'sandbox',
    currentTrainingModule: null,
    reputation: 0,
    dailyShipsCompleted: 0,
    dailyShipsMissed: 0,
    installedUpgrades: [],
    craneUpgrades: [],
    musicPlaying: new Map(),
    spreaderPos: { x: 0, y: 10, z: 0 },
    spreaderRotation: 0,
    cableDepth: 15,
    loadTension: 0,
    trolleyPosition: 0.5,
    twistlockEngaged: false,
    isMoving: false,
    joystickLeft: { x: 0, y: 0 },
    joystickRight: { x: 0, y: 0 },
  })
  stormSystem.reset()
  iceFieldSystem.reset()
  waveSystem.reset()
  timeSystem.reset()
  moonSystem.reset()
  weatherSystem.reset()
  trafficSystem.reset()
  wildlifeSystem.reset()
  harborEventSystem.reset()
  dynamicEventSystem.reset()
  seaEventsSystem.reset()
  ShipSpawner.resetCounters()
  resetCraneAxes()
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

export function tickSimSystems(): void {
  systemRegistry.tick(SIM_DT, dummyFrameContext())
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
