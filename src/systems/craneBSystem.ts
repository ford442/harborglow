// =============================================================================
// CRANE B SYSTEM — NPC gantry for Multi-Crane Coordination training (Module 5)
// Scripted trolley / spreader motion with shared-zone clearance detection.
// Local kinematics only — never writes the player crane store.
// =============================================================================

import { useGameStore } from '../store/useGameStore'
import { trainingSystem } from './trainingSystem'

/** World-space base of NPC Crane B (adjacent berth). */
export const CRANE_B_BASE: [number, number, number] = [30, 4, 5]

/** Jib travel span in world units (matches player Crane A). */
export const CRANE_B_JIB_SPAN = 40

/** Shared interference band in world X between Crane A and Crane B. */
export const SHARED_ZONE = {
    xMin: 8,
    xMax: 22,
    zMin: -8,
    zMax: 18,
} as const

/** Spreader proximity that counts as a crane-to-crane collision. */
export const COLLISION_DISTANCE = 6

export type CraneBPhase =
    | 'idle'
    | 'sweep'
    | 'approach'
    | 'lower'
    | 'install'
    | 'raise'
    | 'retreat'
    | 'hold'

export interface CraneBState {
    active: boolean
    phase: CraneBPhase
    /** Normalized trolley 0..1 along jib (0.5 = over tower). */
    trolleyPosition: number
    /** World Y of spreader tip. */
    spreaderY: number
    /** World-space spreader position. */
    spreaderWorld: [number, number, number]
    /** True while trolley/spreader occupies the shared interference zone. */
    zoneHot: boolean
    /** Seconds spent with player clear while zone was hot (coordination credit). */
    clearHoldSeconds: number
    installsCompleted: number
    beaconPulse: number
}

const TROLLEY_HOME = 0.62
/** Swing into shared interference band (world X ≈ 16). */
const TROLLEY_SWEEP = 0.15
/** Install position over secondary berth (world X ≈ 30). */
const TROLLEY_WORK = 0.5
const SPREADER_HIGH = 14
const SPREADER_LOW = 3.5
const CLEAR_HOLD_REQUIRED = 1.5
const APPROACH_SPEED = 0.18
const LOWER_SPEED = 4.5
const RAISE_SPEED = 5.5
const INSTALL_DURATION = 2.2
const HOLD_DURATION = 3.0
const IDLE_BEFORE_START = 3.5
/** Dwell at sweep apex so players have time to clear the shared zone. */
const SWEEP_DWELL = 2.0

const DEFAULT_STATE: CraneBState = {
    active: false,
    phase: 'idle',
    trolleyPosition: TROLLEY_HOME,
    spreaderY: SPREADER_HIGH,
    spreaderWorld: [CRANE_B_BASE[0], SPREADER_HIGH, CRANE_B_BASE[2]],
    zoneHot: false,
    clearHoldSeconds: 0,
    installsCompleted: 0,
    beaconPulse: 0,
}

function trolleyWorldX(trolleyPosition: number): number {
    return CRANE_B_BASE[0] + (trolleyPosition - 0.5) * CRANE_B_JIB_SPAN
}

function computeSpreaderWorld(trolleyPosition: number, spreaderY: number): [number, number, number] {
    return [trolleyWorldX(trolleyPosition), spreaderY, CRANE_B_BASE[2]]
}

function isInSharedZone(x: number, z: number): boolean {
    return (
        x >= SHARED_ZONE.xMin &&
        x <= SHARED_ZONE.xMax &&
        z >= SHARED_ZONE.zMin &&
        z <= SHARED_ZONE.zMax
    )
}

function dist3(
    a: { x: number; y: number; z: number } | [number, number, number],
    b: [number, number, number],
): number {
    const ax = Array.isArray(a) ? a[0] : a.x
    const ay = Array.isArray(a) ? a[1] : a.y
    const az = Array.isArray(a) ? a[2] : a.z
    const dx = ax - b[0]
    const dy = ay - b[1]
    const dz = az - b[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

class CraneBSystem {
    private state: CraneBState = { ...DEFAULT_STATE, spreaderWorld: [...DEFAULT_STATE.spreaderWorld] }
    private phaseTimer = 0
    private idleTimer = 0
    private collisionCooldown = 0
    private coordinatedThisCycle = false

    getState(): CraneBState {
        return this.state
    }

    /** World position helpers for HUD / tests. */
    getSpreaderWorld(): [number, number, number] {
        return [...this.state.spreaderWorld]
    }

    isActive(): boolean {
        return this.state.active
    }

    start(): void {
        this.reset()
        this.state.active = true
        this.state.phase = 'idle'
        this.idleTimer = 0
        console.log('🏗️ Crane B online — adjacent berth autopilot')
    }

    stop(): void {
        this.state.active = false
        this.state.phase = 'idle'
        this.state.zoneHot = false
        this.phaseTimer = 0
        this.idleTimer = 0
    }

    reset(): void {
        this.state = {
            ...DEFAULT_STATE,
            spreaderWorld: computeSpreaderWorld(TROLLEY_HOME, SPREADER_HIGH),
        }
        this.phaseTimer = 0
        this.idleTimer = 0
        this.collisionCooldown = 0
        this.coordinatedThisCycle = false
    }

    update(dt: number): void {
        if (!this.state.active) return

        const store = useGameStore.getState()
        if (
            store.gameMode !== 'training' ||
            store.currentTrainingModule !== 'multi-crane'
        ) {
            return
        }

        const elapsed = Math.min(dt, 0.1)
        this.state.beaconPulse = (this.state.beaconPulse + elapsed * 2.5) % (Math.PI * 2)
        if (this.collisionCooldown > 0) {
            this.collisionCooldown = Math.max(0, this.collisionCooldown - elapsed)
        }

        this.advancePhase(elapsed)
        this.state.spreaderWorld = computeSpreaderWorld(
            this.state.trolleyPosition,
            this.state.spreaderY,
        )

        const zoneHot =
            this.state.phase === 'sweep' ||
            isInSharedZone(this.state.spreaderWorld[0], this.state.spreaderWorld[2])
        this.state.zoneHot = zoneHot

        this.evaluateCoordination(elapsed, store.spreaderPos, zoneHot)
        this.evaluateCollision(store.spreaderPos)
    }

    private advancePhase(dt: number): void {
        switch (this.state.phase) {
        case 'idle': {
            this.idleTimer += dt
            if (this.idleTimer >= IDLE_BEFORE_START) {
                this.state.phase = 'sweep'
                this.phaseTimer = 0
                this.coordinatedThisCycle = false
                this.state.clearHoldSeconds = 0
            }
            break
        }
        case 'sweep': {
            // Swing toward shared zone — player must clear for coordination credit
            if (Math.abs(this.state.trolleyPosition - TROLLEY_SWEEP) >= 0.01) {
                const dir = Math.sign(TROLLEY_SWEEP - this.state.trolleyPosition)
                this.state.trolleyPosition += dir * APPROACH_SPEED * dt
                if (Math.abs(this.state.trolleyPosition - TROLLEY_SWEEP) < 0.01) {
                    this.state.trolleyPosition = TROLLEY_SWEEP
                    this.phaseTimer = 0
                }
            } else {
                this.phaseTimer += dt
                if (this.phaseTimer >= SWEEP_DWELL) {
                    this.state.phase = 'approach'
                    this.phaseTimer = 0
                }
            }
            break
        }
        case 'approach': {
            // Return to work position over secondary berth
            const dir = Math.sign(TROLLEY_WORK - this.state.trolleyPosition)
            this.state.trolleyPosition += dir * APPROACH_SPEED * dt
            if (Math.abs(this.state.trolleyPosition - TROLLEY_WORK) < 0.01) {
                this.state.trolleyPosition = TROLLEY_WORK
                this.state.phase = 'lower'
                this.phaseTimer = 0
            }
            break
        }
        case 'lower': {
            this.state.spreaderY = Math.max(SPREADER_LOW, this.state.spreaderY - LOWER_SPEED * dt)
            if (this.state.spreaderY <= SPREADER_LOW + 0.05) {
                this.state.spreaderY = SPREADER_LOW
                this.state.phase = 'install'
                this.phaseTimer = 0
            }
            break
        }
        case 'install': {
            this.phaseTimer += dt
            if (this.phaseTimer >= INSTALL_DURATION) {
                this.completeNpcInstall()
                this.state.phase = 'raise'
                this.phaseTimer = 0
            }
            break
        }
        case 'raise': {
            this.state.spreaderY = Math.min(SPREADER_HIGH, this.state.spreaderY + RAISE_SPEED * dt)
            if (this.state.spreaderY >= SPREADER_HIGH - 0.05) {
                this.state.spreaderY = SPREADER_HIGH
                this.state.phase = 'retreat'
                this.phaseTimer = 0
            }
            break
        }
        case 'retreat': {
            const dir = Math.sign(TROLLEY_HOME - this.state.trolleyPosition)
            this.state.trolleyPosition += dir * APPROACH_SPEED * dt
            if (Math.abs(this.state.trolleyPosition - TROLLEY_HOME) < 0.01) {
                this.state.trolleyPosition = TROLLEY_HOME
                this.state.phase = 'hold'
                this.phaseTimer = 0
            }
            break
        }
        case 'hold': {
            this.phaseTimer += dt
            if (this.phaseTimer >= HOLD_DURATION) {
                this.state.phase = 'sweep'
                this.phaseTimer = 0
                this.coordinatedThisCycle = false
                this.state.clearHoldSeconds = 0
            }
            break
        }
        }
    }

    private evaluateCoordination(
        dt: number,
        playerSpreader: { x: number; y: number; z: number },
        zoneHot: boolean,
    ): void {
        if (!zoneHot || this.coordinatedThisCycle) return

        const playerClear = !isInSharedZone(playerSpreader.x, playerSpreader.z)
        if (playerClear) {
            this.state.clearHoldSeconds += dt
            if (this.state.clearHoldSeconds >= CLEAR_HOLD_REQUIRED) {
                this.coordinatedThisCycle = true
                trainingSystem.recordCraneBCoordinated()
                console.log('🏗️ Crane B coordinated — player cleared shared zone')
            }
        } else {
            // Partial credit decays if player re-enters mid-hold
            this.state.clearHoldSeconds = Math.max(0, this.state.clearHoldSeconds - dt * 0.5)
        }
    }

    private evaluateCollision(playerSpreader: { x: number; y: number; z: number }): void {
        if (this.collisionCooldown > 0) return
        const d = dist3(playerSpreader, this.state.spreaderWorld)
        if (d < COLLISION_DISTANCE) {
            trainingSystem.recordCollision()
            this.collisionCooldown = 1.5
            console.log('🏗️ Crane collision — spreaders too close')
        }
    }

    private completeNpcInstall(): void {
        const runtime = trainingSystem.getRuntimeState()
        const secondaryId = runtime.secondaryShipId
        if (!secondaryId) return

        // Only credit one NPC install toward dual-install (player still needs primary)
        if (this.state.installsCompleted >= 1) return
        if (runtime.shipsWithInstalls.has(secondaryId)) return

        trainingSystem.recordInstallation(secondaryId)
        this.state.installsCompleted += 1
        console.log('🏗️ Crane B installed light rig on adjacent vessel')
    }
}

export const craneBSystem = new CraneBSystem()

/** Pure helper exported for unit tests. */
export function isSpreaderInSharedZone(x: number, z: number): boolean {
    return isInSharedZone(x, z)
}
