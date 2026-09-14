// =============================================================================
// ICE FIELD SYSTEM — seeded pack ice for ice-escort missions
// Layout and client transit are hashable without Rapier.
// =============================================================================

import { Rng } from '../sim/Rng'
import { useGameStore } from '../../store/useGameStore'

export const ICE_COLS = 12
export const ICE_ROWS = 18
export const ICE_CELL = 4
export const ICE_ORIGIN_X = 15 - (ICE_COLS / 2) * ICE_CELL
export const ICE_ORIGIN_Z = -28
export const ICE_BERTH: [number, number, number] = [15, 0, -20]
export const ICE_BREAKER_SPAWN: [number, number, number] = [15, 0.5, 28]
export const ICE_CLIENT_SPAWN: [number, number, number] = [15, 0.4, 42]
export const ICE_BERTH_RADIUS = 8
export const ICE_GROUND_HEALTH = 0.2
export const ICE_CORRIDOR_HALF_WIDTH = ICE_CELL * 1.5
export const ICE_MAX_CORRIDOR_BODIES = 128

const BREAK_SPEED_MIN = 1.4
const BREAK_RATE = 0.28
const HEAVY_ICE = 0.62
const RAM_DAMAGE = 18
const CLIENT_SPEED = 2.4
const CHANNEL_X = 15

export interface IceCell {
  col: number
  row: number
  x: number
  z: number
  health: number
  corridor: boolean
}

export interface IceFieldSnapshot {
  active: boolean
  seed: number
  concentration: number
  clientProgress: number
  clientX: number
  clientZ: number
  grounded: boolean
  docked: boolean
  breakerDamage: number
  health: number[]
}

function cellCenter(col: number, row: number): { x: number; z: number } {
  return {
    x: ICE_ORIGIN_X + (col + 0.5) * ICE_CELL,
    z: ICE_ORIGIN_Z + (row + 0.5) * ICE_CELL,
  }
}

function isCorridorX(x: number): boolean {
  return Math.abs(x - CHANNEL_X) <= ICE_CORRIDOR_HALF_WIDTH
}

export class IceFieldSystem {
  private active = false
  private seed = 0
  private concentration = 0
  private cells: IceCell[] = []
  private clientX = ICE_CLIENT_SPAWN[0]
  private clientZ = ICE_CLIENT_SPAWN[2]
  private clientProgress = 0
  private grounded = false
  private docked = false
  private breakerDamage = 0
  private outcomeApplied = false
  private generation = 0

  isActive(): boolean {
    return this.active
  }

  getGeneration(): number {
    return this.generation
  }

  getSeed(): number {
    return this.seed
  }

  getConcentration(): number {
    return this.concentration
  }

  getCells(): readonly IceCell[] {
    return this.cells
  }

  getBreakerSpawn(): [number, number, number] {
    return [...ICE_BREAKER_SPAWN]
  }

  getClientPosition(): [number, number, number] {
    return [this.clientX, 0.4, this.clientZ]
  }

  getClientHeading(): number {
    return Math.PI
  }

  isGrounded(): boolean {
    return this.grounded
  }

  isDocked(): boolean {
    return this.docked
  }

  getBreakerDamage(): number {
    return this.breakerDamage
  }

  channelClearance(): number {
    const corridor = this.cells.filter((c) => c.corridor)
    if (corridor.length === 0) return 1
    const open = corridor.filter((c) => c.health < ICE_GROUND_HEALTH).length
    return open / corridor.length
  }

  healthAt(x: number, z: number): number {
    const cell = this.cellAt(x, z)
    return cell ? cell.health : 0
  }

  cellAt(x: number, z: number): IceCell | null {
    const col = Math.floor((x - ICE_ORIGIN_X) / ICE_CELL)
    const row = Math.floor((z - ICE_ORIGIN_Z) / ICE_CELL)
    if (col < 0 || row < 0 || col >= ICE_COLS || row >= ICE_ROWS) return null
    return this.cells[row * ICE_COLS + col] ?? null
  }

  /** Occupied corridor cells for Rapier kinematic cuboids (capped). */
  getCorridorColliders(): IceCell[] {
    const occupied = this.cells.filter((c) => c.corridor && c.health >= ICE_GROUND_HEALTH)
    if (occupied.length <= ICE_MAX_CORRIDOR_BODIES) return occupied
    return occupied.slice(0, ICE_MAX_CORRIDOR_BODIES)
  }

  getVisualFloes(): IceCell[] {
    return this.cells.filter((c) => c.health > 0.04)
  }

  reset(): void {
    this.active = false
    this.seed = 0
    this.concentration = 0
    this.cells = []
    this.clientX = ICE_CLIENT_SPAWN[0]
    this.clientZ = ICE_CLIENT_SPAWN[2]
    this.clientProgress = 0
    this.grounded = false
    this.docked = false
    this.breakerDamage = 0
    this.outcomeApplied = false
    this.generation += 1
  }

  start(opts: { seed: number }): void {
    const seed = opts.seed >>> 0
    const rng = new Rng(seed)
    const concentration = 0.55 + rng.next() * 0.35
    const cells: IceCell[] = []
    for (let row = 0; row < ICE_ROWS; row++) {
      for (let col = 0; col < ICE_COLS; col++) {
        const { x, z } = cellCenter(col, row)
        const corridor = isCorridorX(x)
        let health = 0
        const approach = row >= ICE_ROWS - 3
        if (corridor) {
          health = approach ? 0 : 0.45 + rng.next() * 0.55
        } else if (!approach && rng.next() < concentration) {
          health = 0.2 + rng.next() * 0.8
        }
        cells.push({ col, row, x, z, health, corridor })
      }
    }
    this.active = true
    this.seed = seed
    this.concentration = concentration
    this.cells = cells
    this.clientX = ICE_CLIENT_SPAWN[0]
    this.clientZ = ICE_CLIENT_SPAWN[2]
    this.clientProgress = 0
    this.grounded = false
    this.docked = false
    this.breakerDamage = 0
    this.outcomeApplied = false
    this.generation += 1
  }

  applyBreakerAt(x: number, z: number, speed: number, dt: number): number {
    if (!this.active || speed < BREAK_SPEED_MIN) return 0
    const cell = this.cellAt(x, z)
    if (!cell || cell.health <= 0) return 0
    const heavy = cell.health >= HEAVY_ICE
    const cut = Math.min(cell.health, BREAK_RATE * speed * dt)
    cell.health = Math.max(0, cell.health - cut)
    if (heavy && speed > 3) {
      const dmg = RAM_DAMAGE * dt * (speed / 8)
      this.breakerDamage += dmg
      return dmg
    }
    return 0
  }

  snapshot(): IceFieldSnapshot {
    return {
      active: this.active,
      seed: this.seed,
      concentration: this.concentration,
      clientProgress: this.clientProgress,
      clientX: this.clientX,
      clientZ: this.clientZ,
      grounded: this.grounded,
      docked: this.docked,
      breakerDamage: this.breakerDamage,
      health: this.cells.map((c) => Math.round(c.health * 1000) / 1000),
    }
  }

  update(dt: number): void {
    if (!this.active) return
    const store = useGameStore.getState()
    const mission = store.activeMission
    if (!mission || mission.type !== 'ice-escort' || mission.status !== 'active') {
      return
    }

    const pos = store.tugboatState.position
    const vel = store.tugboatState.velocity
    const speed = Math.hypot(vel[0], vel[2])
    const ramDamage = this.applyBreakerAt(pos[0], pos[2], speed, dt)
    if (ramDamage > 0 || this.breakerDamage !== mission.damage) {
      store.updateMission({
        damage: this.breakerDamage,
        channelClearance: this.channelClearance(),
      })
    } else {
      store.updateMission({ channelClearance: this.channelClearance() })
    }

    this.advanceClient(dt)

    const timeRemaining = Math.max(0, mission.timeRemaining - dt)
    store.updateMission({ timeRemaining })

    if (this.outcomeApplied) return

    if (this.docked) {
      this.outcomeApplied = true
      store.completeMission()
      store.completeTugboatObjective(mission.targetShipId)
      return
    }
    if (this.grounded || this.breakerDamage >= mission.maxDamage || timeRemaining <= 0) {
      this.outcomeApplied = true
      store.failMission()
    }
  }

  private advanceClient(dt: number): void {
    if (this.grounded || this.docked) return
    const dx = ICE_BERTH[0] - this.clientX
    const dz = ICE_BERTH[2] - this.clientZ
    const dist = Math.hypot(dx, dz)
    if (dist < ICE_BERTH_RADIUS) {
      this.docked = true
      this.clientProgress = 1
      return
    }
    const step = CLIENT_SPEED * dt
    const nx = this.clientX + (dx / dist) * step
    const nz = this.clientZ + (dz / dist) * step
    const ahead = this.healthAt(nx, nz)
    if (ahead >= ICE_GROUND_HEALTH) {
      const here = this.healthAt(this.clientX, this.clientZ)
      if (here >= ICE_GROUND_HEALTH) {
        this.grounded = true
      }
      return
    }
    this.clientX = nx
    this.clientZ = nz
    const total = Math.hypot(ICE_BERTH[0] - ICE_CLIENT_SPAWN[0], ICE_BERTH[2] - ICE_CLIENT_SPAWN[2])
    this.clientProgress = Math.max(0, Math.min(1, 1 - dist / total))
  }
}

export const iceFieldSystem = new IceFieldSystem()
