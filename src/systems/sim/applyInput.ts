import { useGameStore, selectIsShipFullyUpgraded, type ShipType } from '../../store/useGameStore'
import { stormSystem } from '../StormSystem'
import { ShipSpawner } from '../shipSpawner'
import { setCraneAxes, type CraneAxes } from '../cranePhysics'
import { maybeStartShipMusic } from '../multiplayerMusicSync'
import type { InputLogEntry } from './replay'
import { startIceEscort } from '../ice/iceEscortMission'

function isCraneAxes(value: unknown): value is CraneAxes {
  if (!value || typeof value !== 'object') return false
  const v = value as CraneAxes
  return typeof v.leftX === 'number' && typeof v.twistlock === 'boolean'
}

export function applyReplayInput(entry: InputLogEntry): void {
  if (entry.action === 'storm.start') {
    const duration = typeof entry.payload === 'number'
      ? entry.payload
      : (entry.payload as { duration?: number })?.duration ?? 180
    stormSystem.start(duration)
    return
  }
  if (entry.action === 'storm.stop') {
    stormSystem.stop()
    return
  }
  if (entry.action === 'mission.iceEscort.start') {
    const payload = (entry.payload ?? {}) as { seed?: number }
    startIceEscort(payload)
    return
  }
  if (entry.action === 'mission.iceEscort.complete') {
    useGameStore.getState().completeMission()
    return
  }
  if (entry.action === 'mission.iceEscort.fail') {
    useGameStore.getState().failMission()
    return
  }
  if (entry.action === 'ship.spawn') {
    const type = typeof entry.payload === 'string'
      ? entry.payload
      : (entry.payload as { type?: string })?.type
    if (type) {
      ShipSpawner.spawnShip(type as ShipType)
    }
    return
  }
  if (entry.action === 'crane.axes') {
    if (isCraneAxes(entry.payload)) {
      setCraneAxes(entry.payload)
    }
    return
  }
  if (entry.action === 'upgrade.install') {
    const payload = entry.payload as { shipId?: string; partName?: string } | null
    const shipId = payload?.shipId
    const partName = payload?.partName
    if (!shipId || !partName) return
    useGameStore.getState().installUpgrade(shipId, partName)
    if (selectIsShipFullyUpgraded(useGameStore.getState(), shipId)) {
      maybeStartShipMusic(shipId)
    }
  }
}
