import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { useGameStore } from '../../../store/useGameStore'
import { getNetworkSyncState } from '../../../store/gameStoreTypes'
import { hashSimSnapshot } from '../../sim/hashState'
import { SIM_DT } from '../../sim/SimContext'
import { IDLE_CRANE_AXES, stepCrane, type CraneAxes } from '../../cranePhysics'
import {
    CRANE_KINEMATICS_HOME,
    craneKinematics,
    getCraneKinematics,
} from '../craneKinematics'

const MOVING: CraneAxes = {
    ...IDLE_CRANE_AXES,
    leftActive: true,
    leftX: 1,
    leftY: 0,
}

function round(value: number, digits = 4): number {
    const scale = 10 ** digits
    return Math.round(value * scale) / scale
}

/** Same crane block captureSimSnapshot hashes, isolated so the pin is the pose. */
function craneBlockHash(): string {
    const k = getCraneKinematics()
    return hashSimSnapshot({
        crane: {
            x: round(k.spreaderPos.x, 4),
            y: round(k.spreaderPos.y, 4),
            z: round(k.spreaderPos.z, 4),
            rot: round(k.spreaderRotation, 4),
            depth: round(k.cableDepth, 4),
            trolley: round(k.trolleyPosition, 4),
            twistlock: useGameStore.getState().twistlockEngaged,
        },
    })
}

describe('craneKinematics', () => {
    it('does not notify useGameStore across 600 moving stepCrane ticks', () => {
        craneKinematics.getState().reset()
        useGameStore.setState({
            isMoving: true,
            twistlockEngaged: false,
            joystickLeft: { x: MOVING.leftX, y: MOVING.leftY },
            joystickRight: { x: 0, y: 0 },
        })
        const x0 = getCraneKinematics().spreaderPos.x
        let notifications = 0
        const unsub = useGameStore.subscribe(() => {
            notifications += 1
        })
        for (let i = 0; i < 600; i++) stepCrane(SIM_DT, MOVING)
        unsub()
        expect(notifications).toBe(0)
        expect(getCraneKinematics().spreaderPos.x).toBeGreaterThan(x0)
        expect(useGameStore.getState()).not.toHaveProperty('spreaderPos')
    })

    it('pins the crane-block hash for a fixed seeded stepCrane run', () => {
        craneKinematics.getState().reset({ ...CRANE_KINEMATICS_HOME, spreaderPos: { ...CRANE_KINEMATICS_HOME.spreaderPos } })
        useGameStore.setState({ twistlockEngaged: false })
        const axes: CraneAxes = {
            ...IDLE_CRANE_AXES,
            leftActive: true,
            leftX: 0.5,
            leftY: -0.25,
        }
        for (let i = 0; i < 120; i++) stepCrane(SIM_DT, axes)
        expect(craneBlockHash()).toBe('74a35997')
    })

    it('round-trips a multiplayer crane patch through the kinematics store', () => {
        craneKinematics.getState().reset()
        getCraneKinematics().setSpreaderPos({ x: 1, y: 2, z: 3 })
        getCraneKinematics().setSpreaderRotation(0.4)
        getCraneKinematics().setCableDepth(8)
        getCraneKinematics().setLoadTension(11)
        getCraneKinematics().setTrolleyPosition(0.2)
        const sync = getNetworkSyncState(useGameStore.getState())
        craneKinematics.getState().reset()
        useGameStore.getState().applyNetworkPatch({
            spreaderPos: sync.spreaderPos,
            spreaderRotation: sync.spreaderRotation,
            cableDepth: sync.cableDepth,
            loadTension: sync.loadTension,
            trolleyPosition: sync.trolleyPosition,
        })
        const after = getCraneKinematics()
        expect(after.spreaderPos).toEqual({ x: 1, y: 2, z: 3 })
        expect(after.spreaderRotation).toBe(0.4)
        expect(after.cableDepth).toBe(8)
        expect(after.loadTension).toBe(11)
        expect(after.trolleyPosition).toBe(0.2)
        expect(useGameStore.getState()).not.toHaveProperty('spreaderPos')
    })

    it('Crane.tsx does not subscribe to kinematics through useGameStore', () => {
        const src = readFileSync(join(__dirname, '../../../scenes/Crane.tsx'), 'utf8')
        expect(src).not.toMatch(/state\.spreaderPos/)
        expect(src).not.toMatch(/state\.spreaderRotation/)
        expect(src).not.toMatch(/state\.cableDepth/)
        expect(src).not.toMatch(/state\.loadTension/)
        expect(src).not.toMatch(/state\.trolleyPosition/)
        expect(src).toMatch(/getCraneKinematics\(\)/)
    })
})
