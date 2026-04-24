// =============================================================================
// ATTACHMENT SYSTEM - HarborGlow Phase 9
// Manages attachment point states, magnetic snap zones, and installation events
// =============================================================================

import { useGameStore, Ship, AttachmentPoint, ShipType } from '../store/useGameStore'

// Attachment point states
export type AttachmentState = 'available' | 'hovered' | 'snapping' | 'installing' | 'installed'

// Rig types for color coding
export type RigType = 'rgb_matrix' | 'projector' | 'emergency_strobe' | 'led_strip' | 'searchlight'

// Map part names to rig types
export function getRigTypeForPart(partName: string): RigType {
  const partLower = partName.toLowerCase()
  
  if (partLower.includes('funnel') || partLower.includes('balcony') || partLower.includes('mast')) {
    return 'rgb_matrix'
  }
  if (partLower.includes('stack') || partLower.includes('bridge') || partLower.includes('deck')) {
    return 'projector'
  }
  if (partLower.includes('flare') || partLower.includes('emergency') || partLower.includes('rescue')) {
    return 'emergency_strobe'
  }
  if (partLower.includes('rail') || partLower.includes('hatch') || partLower.includes('ramp')) {
    return 'led_strip'
  }
  return 'searchlight'
}

// Color coding for rig types
export const RIG_TYPE_COLORS: Record<RigType, { primary: string; glow: string; intensity: number }> = {
  rgb_matrix: { primary: '#00d4ff', glow: '#00d4ff80', intensity: 2.5 },
  projector: { primary: '#a855f7', glow: '#a855f780', intensity: 2.0 },
  emergency_strobe: { primary: '#ff4444', glow: '#ff444480', intensity: 3.0 },
  led_strip: { primary: '#ffcc00', glow: '#ffcc0080', intensity: 1.8 },
  searchlight: { primary: '#ffffff', glow: '#ffffff60', intensity: 3.5 },
}

// Ship type accent colors for installed lights
export const SHIP_TYPE_LIGHT_COLORS: Record<ShipType, string> = {
  cruise: '#00d4ff',
  container: '#ffaa00',
  tanker: '#ff4444',
  bulk: '#88ff88',
  lng: '#4488ff',
  roro: '#ff88ff',
  research: '#88ffff',
  droneship: '#ffff88',
}

// Attachment system configuration
export interface AttachmentSystemConfig {
  showPoints: boolean
  visibilityRange: number  // meters
  snapStrength: number     // 0-1
  snapRadius: number       // meters
  installDistance: number  // meters (how close crane needs to be)
  showCable: boolean       // show/hide crane cable
  bindDurationMs: number   // ms to interpolate spreader to anchor before install
}

// Default configuration
export const DEFAULT_ATTACHMENT_CONFIG: AttachmentSystemConfig = {
  showPoints: true,
  visibilityRange: 15,
  snapStrength: 0.5,
  snapRadius: 5,
  installDistance: 2,
  showCable: true,
  bindDurationMs: 150,
}

// Active attachment point tracking
export interface ActiveAttachmentPoint {
  shipId: string
  partName: string
  position: [number, number, number]
  rigType: RigType
  state: AttachmentState
  distance: number  // distance from crane
  snapStrength: number  // 0-1 based on proximity
}

// Calculate distance between two 3D points
function distance3D(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Get all attachment points from all ships
export function getAllAttachmentPoints(ships: Ship[]): Array<{
  shipId: string
  point: AttachmentPoint
  rigType: RigType
}> {
  const points: Array<{ shipId: string; point: AttachmentPoint; rigType: RigType }> = []
  
  ships.forEach(ship => {
    ship.attachmentPoints?.forEach(point => {
      points.push({
        shipId: ship.id,
        point,
        rigType: getRigTypeForPart(point.partName),
      })
    })
  })
  
  return points
}

// Check if a point is already upgraded
export function isPointUpgraded(shipId: string, partName: string): boolean {
  const upgrades = useGameStore.getState().installedUpgrades
  return upgrades.some((u: {shipId: string, partName: string, installed: boolean}) => u.shipId === shipId && u.partName === partName && u.installed)
}

// Calculate attachment point state based on crane position
export function calculateAttachmentState(
  shipId: string,
  partName: string,
  pointPosition: [number, number, number],
  cranePosition: { x: number; y: number; z: number },
  twistlockEngaged: boolean,
  config: AttachmentSystemConfig
): { state: AttachmentState; distance: number; snapStrength: number } {
  const distance = distance3D(pointPosition, [cranePosition.x, cranePosition.y, cranePosition.z])
  
  // Check if already installed
  if (isPointUpgraded(shipId, partName)) {
    return { state: 'installed', distance, snapStrength: 0 }
  }
  
  // Calculate snap strength (0-1 based on distance)
  const snapStrength = Math.max(0, 1 - (distance / config.snapRadius))
  
  // Determine state
  let state: AttachmentState = 'available'
  
  if (distance <= config.installDistance && twistlockEngaged) {
    state = 'installing'
  } else if (distance <= config.snapRadius) {
    state = 'snapping'
  } else if (distance <= config.visibilityRange * 1.5) {
    state = 'hovered'
  }
  
  return { state, distance, snapStrength }
}

// Find the nearest attachment point to the crane
export function findNearestAttachmentPoint(
  ships: Ship[],
  cranePosition: { x: number; y: number; z: number },
  config: AttachmentSystemConfig
): ActiveAttachmentPoint | null {
  let nearest: ActiveAttachmentPoint | null = null
  let minDistance = Infinity
  
  ships.forEach(ship => {
    ship.attachmentPoints?.forEach(point => {
      const pointWorldPos: [number, number, number] = [
        ship.position[0] + point.position[0],
        ship.position[1] + point.position[1],
        ship.position[2] + point.position[2],
      ]
      
      const distance = distance3D(pointWorldPos, [cranePosition.x, cranePosition.y, cranePosition.z])
      
      if (distance < minDistance && distance <= config.visibilityRange * 2) {
        minDistance = distance
        const { state, snapStrength } = calculateAttachmentState(
          ship.id,
          point.partName,
          pointWorldPos,
          cranePosition,
          useGameStore.getState().twistlockEngaged,
          config
        )
        
        nearest = {
          shipId: ship.id,
          partName: point.partName,
          position: pointWorldPos,
          rigType: getRigTypeForPart(point.partName),
          state,
          distance,
          snapStrength,
        }
      }
    })
  })
  
  return nearest
}

// Get all visible attachment points
export function getVisibleAttachmentPoints(
  ships: Ship[],
  cranePosition: { x: number; y: number; z: number },
  cameraPosition: [number, number, number],
  config: AttachmentSystemConfig
): ActiveAttachmentPoint[] {
  const points: ActiveAttachmentPoint[] = []
  const twistlockEngaged = useGameStore.getState().twistlockEngaged
  
  ships.forEach(ship => {
    ship.attachmentPoints?.forEach(point => {
      const pointWorldPos: [number, number, number] = [
        ship.position[0] + point.position[0],
        ship.position[1] + point.position[1],
        ship.position[2] + point.position[2],
      ]
      
      // Check distance from camera (visibility)
      const distFromCamera = distance3D(pointWorldPos, cameraPosition)
      if (distFromCamera > config.visibilityRange * 2) return
      
      const { state, distance, snapStrength } = calculateAttachmentState(
        ship.id,
        point.partName,
        pointWorldPos,
        cranePosition,
        twistlockEngaged,
        config
      )
      
      points.push({
        shipId: ship.id,
        partName: point.partName,
        position: pointWorldPos,
        rigType: getRigTypeForPart(point.partName),
        state,
        distance,
        snapStrength,
      })
    })
  })
  
  return points
}

// Installation event type
export interface InstallationEvent {
  shipId: string
  partName: string
  position: [number, number, number]
  rigType: RigType
  shipType: ShipType
  timestamp: number
}

// Trigger installation
/** Triggers an installation event and binds part to ship. */
export function triggerInstallation(
  shipId: string,
  partName: string,
  position: [number, number, number],
  onComplete?: (event: InstallationEvent) => void
): void {
  const state = useGameStore.getState()
  const ship = state.ships.find(s => s.id === shipId)
  
  if (!ship) return
  
  // Install the upgrade
  state.installUpgrade(shipId, partName)
  
  const event: InstallationEvent = {
    shipId,
    partName,
    position,
    rigType: getRigTypeForPart(partName),
    shipType: ship.type,
    timestamp: Date.now(),
  }
  
  // Store last installation (skip for now - would need to add to store)
  // useGameStore.setState({
  //   lastInstallation: event,
  // })
  
  onComplete?.(event)
}

// Find a bind candidate without triggering installation
/** Finds a valid candidate to bind to based on distance and configuration without triggering the install. */
export function findBindCandidate(
  ships: Ship[],
  cranePosition: { x: number; y: number; z: number },
  twistlockEngaged: boolean,
  config: AttachmentSystemConfig
): InstallationEvent | null {
  if (!twistlockEngaged) return null

  for (const ship of ships) {
    for (const point of ship.attachmentPoints || []) {
      const pointWorldPos: [number, number, number] = [
        ship.position[0] + point.position[0],
        ship.position[1] + point.position[1],
        ship.position[2] + point.position[2],
      ]

      const distance = distance3D(pointWorldPos, [cranePosition.x, cranePosition.y, cranePosition.z])

      if (distance <= config.installDistance && !isPointUpgraded(ship.id, point.partName)) {
        return {
          shipId: ship.id,
          partName: point.partName,
          position: pointWorldPos,
          rigType: getRigTypeForPart(point.partName),
          shipType: ship.type,
          timestamp: Date.now(),
        }
      }
    }
  }

  return null
}

// Check for installation trigger (call this in game loop)
export function checkInstallationTrigger(
  ships: Ship[],
  cranePosition: { x: number; y: number; z: number },
  twistlockEngaged: boolean,
  config: AttachmentSystemConfig,
  onInstall?: (event: InstallationEvent) => void
): InstallationEvent | null {
  if (!twistlockEngaged) return null

  for (const ship of ships) {
    for (const point of ship.attachmentPoints || []) {
      const pointWorldPos: [number, number, number] = [
        ship.position[0] + point.position[0],
        ship.position[1] + point.position[1],
        ship.position[2] + point.position[2],
      ]

      const distance = distance3D(pointWorldPos, [cranePosition.x, cranePosition.y, cranePosition.z])

      if (distance <= config.installDistance && !isPointUpgraded(ship.id, point.partName)) {
        triggerInstallation(ship.id, point.partName, pointWorldPos, onInstall)
        return {
          shipId: ship.id,
          partName: point.partName,
          position: pointWorldPos,
          rigType: getRigTypeForPart(point.partName),
          shipType: ship.type,
          timestamp: Date.now(),
        }
      }
    }
  }

  return null
}

// React hook for using attachment system
import { useState, useEffect, useCallback, useRef } from 'react'

export function useAttachmentSystem() {
  const [activePoints, setActivePoints] = useState<ActiveAttachmentPoint[]>([])
  const [nearestPoint, setNearestPoint] = useState<ActiveAttachmentPoint | null>(null)
  const [lastInstall, setLastInstall] = useState<InstallationEvent | null>(null)
  
  const state = useGameStore()
  const config = DEFAULT_ATTACHMENT_CONFIG
  const cranePos = state.spreaderPos
  const twistlockEngaged = state.twistlockEngaged
  const ships = state.ships
  
  // Refs for camera position (updated by component)
  const cameraPositionRef = useRef<[number, number, number]>([0, 20, 50])
  
  const updateCameraPosition = useCallback((pos: [number, number, number]) => {
    cameraPositionRef.current = pos
  }, [])
  
  useEffect(() => {
    if (!config.showPoints) {
      setActivePoints([])
      setNearestPoint(null)
      return
    }
    
    // Get visible points
    const visible = getVisibleAttachmentPoints(
      ships,
      cranePos,
      cameraPositionRef.current,
      config
    )
    setActivePoints(visible)
    
    // Find nearest
    const nearest = findNearestAttachmentPoint(ships, cranePos, config)
    setNearestPoint(nearest)
    
    // Installation is now driven by AttachmentSystemManager.tsx
    // so that a bind-interpolation can run before triggerInstallation.
    // We still compute nearest point for UI feedback.

  }, [ships, cranePos, twistlockEngaged, config])
  
  return {
    activePoints,
    nearestPoint,
    lastInstall,
    setLastInstall,
    config,
    updateCameraPosition,
    clearLastInstall: useCallback(() => setLastInstall(null), []),
  }
}
