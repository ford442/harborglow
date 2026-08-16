import { describe, it, expect } from 'vitest'
import type { NetworkSyncState } from '../../store/gameStoreTypes'
import {
  computeDelta,
  encodeSnapshot,
  encodeDeltaPacket,
  decodeStatePacket,
  encodeChat,
  decodeChatPacket,
  encodePing,
  decodePacket,
} from '../multiplayerCodec'

function minimalSyncState(overrides: Partial<NetworkSyncState> = {}): NetworkSyncState {
  return {
    ships: [],
    craneUpgrades: [],
    musicEnabled: true,
    bpm: 128,
    lyricsSize: 28,
    lightIntensity: 1.5,
    timeOfDay: 12,
    shipVersions: {},
    shipSailTimes: {},
    shipDockedStatus: {},
    weather: 'clear',
    weatherIntensity: 0.5,
    operationMode: 'crane',
    tugboatState: {
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      throttle: 0,
      steering: 0,
      heading: 0,
      portEngineRpm: 0,
      starboardEngineRpm: 0,
      portCavitating: false,
      starboardCavitating: false,
      cavitationIntensity: 0,
      windShear: 0,
      currentDrift: [0, 0],
    },
    tugboatDockedCount: 0,
    tugboatWinTriggered: false,
    tugboatFirstTimeViewed: false,
    salvageContracts: [],
    salvageSuccessfulTows: 0,
    tugboatCareerStats: { totalTonsAssisted: 0, cleanTows: 0, nightRescues: 0 },
    tugboatUpgrades: {
      heavy_tow_winch: false,
      cavitation_suppression_jets: false,
      searchlight_rig: false,
      dynamic_positioning_assist: false,
    },
    waveParams: { amplitude: 1, speed: 1, chaos: 0 },
    harborCredits: 0,
    unlockedShopItems: [],
    season: 'summer',
    wildlifeDensity: 0.6,
    enableMarineLife: true,
    spreaderPos: { x: 0, y: 10, z: 0 },
    spreaderRotation: 0,
    cableDepth: 15,
    loadTension: 0,
    trolleyPosition: 0.5,
    winchSpeed: 1,
    twistlockEngaged: false,
    craneHeight: 15.5,
    craneRotation: 0.2,
    isMoving: false,
    heaterActive: true,
    iceBuildup: 0.3,
    joystickLeft: { x: 0, y: 0 },
    joystickRight: { x: 0, y: 0 },
    currentShipId: null,
    spectatorState: { isActive: false, targetShipId: null, startTime: 0, duration: 10 },
    tugSpectatorActive: false,
    lastInstallation: null,
    musicPlaying: {},
    gameTime: null,
    isNight: false,
    wildlife: [],
    activeSeaEvent: null,
    activeHarborEvents: [],
    walkingPosition: [0, 0, 0],
    stormIntensity: 0,
    stormTimeRemaining: 0,
    isStormActive: false,
    windDirection: 0,
    windStrength: 0,
    rainDensity: 0.5,
    ...overrides,
  }
}

describe('multiplayerCodec', () => {
  it('computeDelta returns null when nothing changed', () => {
    const state = minimalSyncState()
    expect(computeDelta(state, state)).toBeNull()
  })

  it('computeDelta includes only changed keys', () => {
    const prev = minimalSyncState()
    const next = minimalSyncState({
      spreaderPos: { x: 1, y: 2, z: 3 },
      bpm: 140,
    })
    const delta = computeDelta(prev, next)
    expect(delta).toEqual({
      spreaderPos: { x: 1, y: 2, z: 3 },
      bpm: 140,
    })
  })

  it('encodeSnapshot round-trips through decodeStatePacket', () => {
    const state = minimalSyncState({ bpm: 99 })
    const bytes = encodeSnapshot(state)
    const decoded = decodeStatePacket(bytes)
    expect(decoded.type).toBe('full')
    expect(decoded.patch.bpm).toBe(99)
  })

  it('encodeDeltaPacket produces delta with changed fields only', () => {
    const prev = minimalSyncState()
    const next = minimalSyncState({ cableDepth: 20 })
    const bytes = encodeDeltaPacket(prev, next)
    expect(bytes).not.toBeNull()
    const decoded = decodeStatePacket(bytes!)
    expect(decoded.type).toBe('delta')
    expect(decoded.patch).toEqual({ cableDepth: 20 })
  })

  it('encodeDeltaPacket returns null when unchanged', () => {
    const state = minimalSyncState()
    expect(encodeDeltaPacket(state, state)).toBeNull()
  })

  it('chat packet round-trips', () => {
    const bytes = encodeChat('hello harbor', 'spectator-1')
    const msg = decodeChatPacket(bytes)
    expect(msg.text).toBe('hello harbor')
    expect(msg.sender).toBe('spectator-1')
  })

  it('ping packet has correct type', () => {
    const bytes = encodePing()
    const envelope = decodePacket(bytes)
    expect(envelope.t).toBe('ping')
  })
})
