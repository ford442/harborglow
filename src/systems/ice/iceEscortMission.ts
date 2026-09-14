// =============================================================================
// ICE-ESCORT MISSION — start helper shared by replay, training, HUD, Leva
// =============================================================================

import { useGameStore } from '../../store/useGameStore'
import type { Mission } from '../../store/gameStoreTypes'
import {
  iceFieldSystem,
  ICE_BERTH,
  ICE_BERTH_RADIUS,
  ICE_BREAKER_SPAWN,
} from './IceFieldSystem'

export const ICE_ESCORT_CLIENT_ID = 'ice-escort-client'
export const ICE_ESCORT_OBJECTIVE_ID = 'ice-escort-berth'
export const ICE_ESCORT_DEFAULT_SEED = 204
export const ICE_ESCORT_TIME_LIMIT = 180

export function buildIceEscortMission(seed: number): Mission {
  const concentration = iceFieldSystem.getConcentration()
  return {
    id: `ice-escort-${seed >>> 0}`,
    type: 'ice-escort',
    targetShipType: 'container',
    targetShipId: ICE_ESCORT_OBJECTIVE_ID,
    timeLimit: ICE_ESCORT_TIME_LIMIT,
    timeRemaining: ICE_ESCORT_TIME_LIMIT,
    damage: 0,
    maxDamage: 100,
    reward: 1800,
    status: 'active',
    berthCenter: ICE_BERTH,
    berthRadius: ICE_BERTH_RADIUS,
    vesselLabel: 'Polar Client Hull',
    factionLabel: 'Rosatomflot escort',
    briefing: 'Clear a channel for the client hull. Yamal holds station in pack ice.',
    reputationReward: 140,
    failurePenalty: 360,
    iceSeed: seed >>> 0,
    iceConcentration: concentration,
    clientShipId: ICE_ESCORT_CLIENT_ID,
    channelClearance: 0,
  }
}

export function startIceEscort(payload: { seed?: number } | null = null): void {
  const seed = (payload?.seed ?? ICE_ESCORT_DEFAULT_SEED) >>> 0
  iceFieldSystem.reset()
  iceFieldSystem.start({ seed })
  const store = useGameStore.getState()
  const spawn = iceFieldSystem.getBreakerSpawn()
  store.setOperationMode('tugboat')
  store.setWeather('fog')
  store.setTimeOfDay(2)
  store.updateTugboatState({
    position: spawn,
    velocity: [0, 0, 0],
    throttle: 0,
    steering: 0,
    heading: Math.PI,
  })
  store.setTugboatObjectives([
    {
      id: ICE_ESCORT_OBJECTIVE_ID,
      label: 'Polar Berth Gamma',
      berthCenter: ICE_BERTH,
      berthRadius: ICE_BERTH_RADIUS,
      completed: false,
      shipType: 'container',
    },
  ])
  store.setActiveMission(buildIceEscortMission(seed))
}

export { ICE_BERTH, ICE_BREAKER_SPAWN }
