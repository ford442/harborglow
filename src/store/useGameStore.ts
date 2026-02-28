import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShipType = 'CRUISE_LINER' | 'CONTAINER_VESSEL' | 'OIL_TANKER'
export type UpgradeId = 'RGB_MATRIX' | 'PROJECTOR_RIG' | 'POWER_UNIT' | 'SPEAKER_ARRAY'
export type CameraMode = 'CRANE_CAB' | 'GOD_MODE' | 'HOOK_CAM'
export type GamePhase = 'IDLE' | 'SHIP_ARRIVING' | 'SHIP_DOCKED' | 'UPGRADING' | 'LIGHT_SHOW'

export interface Ship {
  id: string
  type: ShipType
  /** World-space dock position */
  dockPosition: [number, number, number]
  installedUpgrades: UpgradeId[]
  /** Music track name for this ship */
  trackName: string
  /** Display name shown in HUD */
  label: string
}

export interface CraneState {
  /** Horizontal rotation around Y axis (radians) */
  rotation: number
  /** Trolley position along the jib (0–1) */
  trolleyPos: number
  /** Rope length normalised (0–1, 0 = fully retracted) */
  ropeLength: number
  /** Whether the hook is carrying a payload */
  carrying: UpgradeId | null
}

export interface GameState {
  phase: GamePhase
  cameraMode: CameraMode
  currentShip: Ship | null
  dockQueue: Ship[]
  crane: CraneState
  upgradeMenuOpen: boolean
  selectedUpgrade: UpgradeId | null
  musicPlaying: boolean
  musicBPM: number
  lightSyncStrength: number // 0–1
  windStrength: number       // m/s
  craneSpeed: number         // multiplier
  lyric: string

  // ── Actions ──────────────────────────────────────────────────────────────
  spawnShip: (type: ShipType) => void
  dockCurrentShip: () => void
  openUpgradeMenu: () => void
  closeUpgradeMenu: () => void
  selectUpgrade: (id: UpgradeId) => void
  installUpgrade: () => void
  setCraneRotation: (r: number) => void
  setCraneTrolley: (t: number) => void
  setCraneRope: (l: number) => void
  setCameraMode: (m: CameraMode) => void
  setMusicPlaying: (p: boolean) => void
  setMusicBPM: (bpm: number) => void
  setLyric: (l: string) => void
  setPhase: (p: GamePhase) => void
}

// ─── Ship templates ───────────────────────────────────────────────────────────

const SHIP_TEMPLATES: Record<ShipType, Omit<Ship, 'id'>> = {
  CRUISE_LINER: {
    type: 'CRUISE_LINER',
    dockPosition: [0, 0, 0],
    installedUpgrades: [],
    trackName: 'cruise_anthem',
    label: '🚢 Cruise Liner — SS HarborGlow',
  },
  CONTAINER_VESSEL: {
    type: 'CONTAINER_VESSEL',
    dockPosition: [0, 0, 0],
    installedUpgrades: [],
    trackName: 'container_beats',
    label: '📦 Ultra Large Container — MV Titan Box',
  },
  OIL_TANKER: {
    type: 'OIL_TANKER',
    dockPosition: [0, 0, 0],
    installedUpgrades: [],
    trackName: 'tanker_drone',
    label: '🛢️ Oil Tanker — MT Petro Star',
  },
}

let shipCounter = 0

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: 'IDLE',
    cameraMode: 'GOD_MODE',
    currentShip: null,
    dockQueue: [],
    crane: {
      rotation: 0,
      trolleyPos: 0.5,
      ropeLength: 0.3,
      carrying: null,
    },
    upgradeMenuOpen: false,
    selectedUpgrade: null,
    musicPlaying: false,
    musicBPM: 120,
    lightSyncStrength: 0.8,
    windStrength: 3,
    craneSpeed: 1,
    lyric: '',

    // ── Ship actions ────────────────────────────────────────────────────────

    spawnShip: (type) => {
      const template = SHIP_TEMPLATES[type]
      const ship: Ship = {
        ...template,
        id: `ship_${++shipCounter}`,
        installedUpgrades: [],
      }
      set((s) => ({
        dockQueue: [...s.dockQueue, ship],
        phase: 'SHIP_ARRIVING',
      }))
      // Auto-dock after 3 seconds
      setTimeout(() => get().dockCurrentShip(), 3000)
    },

    dockCurrentShip: () => {
      const { dockQueue } = get()
      if (dockQueue.length === 0) return
      const [next, ...rest] = dockQueue
      set({ currentShip: next, dockQueue: rest, phase: 'SHIP_DOCKED', upgradeMenuOpen: true })
    },

    openUpgradeMenu: () => set({ upgradeMenuOpen: true }),
    closeUpgradeMenu: () => set({ upgradeMenuOpen: false }),

    selectUpgrade: (id) => set({ selectedUpgrade: id }),

    installUpgrade: () => {
      const { currentShip, selectedUpgrade } = get()
      if (!currentShip || !selectedUpgrade) return
      set((s) => ({
        currentShip: s.currentShip
          ? {
              ...s.currentShip,
              installedUpgrades: [...s.currentShip.installedUpgrades, selectedUpgrade],
            }
          : null,
        selectedUpgrade: null,
        phase: s.currentShip?.installedUpgrades.includes('RGB_MATRIX')
          ? 'LIGHT_SHOW'
          : 'UPGRADING',
        musicPlaying: true,
        upgradeMenuOpen: false,
      }))
    },

    // ── Crane actions ───────────────────────────────────────────────────────

    setCraneRotation: (r) => set((s) => ({ crane: { ...s.crane, rotation: r } })),
    setCraneTrolley: (t) => set((s) => ({ crane: { ...s.crane, trolleyPos: t } })),
    setCraneRope: (l) => set((s) => ({ crane: { ...s.crane, ropeLength: l } })),

    // ── Camera ──────────────────────────────────────────────────────────────

    setCameraMode: (m) => set({ cameraMode: m }),

    // ── Music / HUD ─────────────────────────────────────────────────────────

    setMusicPlaying: (p) => set({ musicPlaying: p }),
    setMusicBPM: (bpm) => set({ musicBPM: bpm }),
    setLyric: (l) => set({ lyric: l }),
    setPhase: (p) => set({ phase: p }),
  }))
)
