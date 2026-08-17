import { stormSystem } from '../StormSystem'
import { waveSystem } from '../WaveSystem'
import { timeSystem } from '../timeSystem'
import { moonSystem } from '../moonSystem'
import { weatherSystem } from '../weatherSystem'
import { trafficSystem } from '../trafficSystem'
import { wildlifeSystem } from '../wildlifeSystem'
import { harborEventSystem } from '../eventSystem/HarborEventSystem'
import { dynamicEventSystem } from '../dynamicEventSystem'
import { getSim } from './SimContext'

function round(value: number, digits = 5): number {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

/** Canonical snapshot of the deterministic sim core for hashing / replay checks. */
export function captureSimSnapshot(): Record<string, unknown> {
  const sim = getSim()
  const storm = stormSystem.getState()
  const waves = waveSystem.getState()
  const time = timeSystem.getState()
  const moon = moonSystem.getState()
  const weather = weatherSystem.getState()
  const traffic = trafficSystem.getQueue()
  return {
    tick: sim.tick,
    simTime: round(sim.simTime, 6),
    rng: sim.rng.getState(),
    time: {
      gameTime: round(time.gameTime, 6),
      dayNumber: time.dayNumber,
      phase: time.currentPhase,
    },
    moon: {
      lunarDay: round(moon.lunarDay, 6),
      phase: moon.phase,
    },
    waves: {
      time: round(waves.time, 6),
      stormIntensity: round(waves.stormIntensity, 6),
    },
    storm: {
      active: storm.active,
      intensity: round(storm.intensity, 6),
      elapsed: round(storm.elapsed, 6),
      windDirection: round(storm.windDirection, 6),
      rainDensity: round(storm.rainDensity, 6),
    },
    weather: {
      type: weather.type,
      intensity: round(weather.intensity, 6),
      duration: round(weather.duration, 6),
      windSpeed: round(weather.windSpeed, 6),
    },
    traffic: traffic.ships.map((ship) => ship.id),
    wildlife: wildlifeSystem.snapshotIds(),
    events: harborEventSystem.snapshotIds(),
    dynamic: dynamicEventSystem.snapshotIds(),
  }
}

export function hashSimSnapshot(snapshot: Record<string, unknown> = captureSimSnapshot()): string {
  const json = JSON.stringify(snapshot)
  let hash = 2166136261
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
