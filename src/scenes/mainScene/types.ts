import type * as React from 'react'
import type * as THREE from 'three'
import type { Ship, CameraMode } from '../../store/useGameStore'

export interface AtSeaShip {
    shipId: string
    returnTime: number
    originalPosition: [number, number, number]
}

export interface LevaControlsConfig {
    currentShip?: Ship
    ships: Ship[]
    timeOfDay: number
    setBPM: (bpm: number) => void
    setLyricsSize: (size: number) => void
    setLightIntensity: (intensity: number) => void
    setTimeOfDay: (hour: number) => void
    setCameraMode: (mode: CameraMode) => void
    weather: string
    setWeather: (weather: any) => void
    setCurrentShip: (id: string | null) => void
    multiviewMode: string
    setMultiviewMode: (mode: 'single' | 'quad') => void
    underwaterIntensity: number
    setUnderwaterIntensity: (intensity: number) => void
    cabinViewMode: string
    season: string
    setSeason: (season: any) => void
    wildlifeDensity: number
    setWildlifeDensity: (density: number) => void
    enableMarineLife: boolean
    setEnableMarineLife: (enabled: boolean) => void
}

export interface ShipSchedulingConfig {
    ships: Ship[]
    departingShips: Set<string>
    setDepartingShips: (ships: Set<string>) => void
    atSeaShipsRef: React.MutableRefObject<Map<string, AtSeaShip>>
    shipPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    scheduleDeparture: (shipId: string) => void
    returnToDock: (shipId: string) => void
}

export interface SpectatorCameraConfig {
    spectatorState: { isActive: boolean; targetShipId: string | null }
    ships: Ship[]
    delta: number
    spectatorAngleRef: React.MutableRefObject<number>
    cameraMode: string
    orbitControlsRef: React.MutableRefObject<any>
}

export interface DepartingShipsConfig {
    departingShips: Set<string>
    shipPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    delta: number
    setDepartingShips: (ships: Set<string>) => void
    atSeaShipsRef: React.MutableRefObject<Map<string, AtSeaShip>>
    returnToDock: (shipId: string) => void
}
