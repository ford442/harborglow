// =============================================================================
// CRANE B SYSTEM TESTS
// =============================================================================

import { beforeEach, describe, expect, it } from 'vitest'
import {
    craneBSystem,
    isSpreaderInSharedZone,
    SHARED_ZONE,
    CRANE_B_BASE,
    COLLISION_DISTANCE,
} from '../craneBSystem'
import { trainingSystem } from '../trainingSystem'
import { useGameStore } from '../../store/useGameStore'

describe('craneBSystem helpers', () => {
    it('detects shared-zone occupancy', () => {
        expect(isSpreaderInSharedZone(15, 0)).toBe(true)
        expect(isSpreaderInSharedZone(SHARED_ZONE.xMin, SHARED_ZONE.zMin)).toBe(true)
        expect(isSpreaderInSharedZone(0, 0)).toBe(false)
        expect(isSpreaderInSharedZone(40, 0)).toBe(false)
    })
})

describe('craneBSystem lifecycle', () => {
    beforeEach(() => {
        craneBSystem.stop()
        craneBSystem.reset()
        trainingSystem.resetRuntimeState()
        useGameStore.setState({
            gameMode: 'training',
            currentTrainingModule: 'multi-crane',
            spreaderPos: { x: 0, y: 10, z: 5 },
            ships: [],
        })
    })

    it('starts inactive and activates on start()', () => {
        expect(craneBSystem.isActive()).toBe(false)
        craneBSystem.start()
        expect(craneBSystem.isActive()).toBe(true)
        expect(craneBSystem.getState().phase).toBe('idle')
    })

    it('leaves idle into sweep after delay', () => {
        craneBSystem.start()
        // Idle wait is ~3.5s
        for (let i = 0; i < 40; i++) craneBSystem.update(0.1)
        expect(craneBSystem.getState().phase).toBe('sweep')
    })

    it('records coordination when player stays clear during hot zone', () => {
        trainingSystem.setTrainingShipIds('primary', 'secondary')
        craneBSystem.start()
        // Skip idle
        for (let i = 0; i < 40; i++) craneBSystem.update(0.1)
        expect(craneBSystem.getState().phase).toBe('sweep')

        // Player clear of shared zone (near Crane A)
        useGameStore.setState({ spreaderPos: { x: -5, y: 10, z: 5 } })

        // Advance through sweep dwell with player clear
        for (let i = 0; i < 80; i++) craneBSystem.update(0.1)

        expect(trainingSystem.getRuntimeState().craneBCoordinated).toBe(true)
    })

    it('records collision when spreaders are too close', () => {
        craneBSystem.start()
        // Force spreader near player by jumping state via updates to home
        const bSpreader = craneBSystem.getSpreaderWorld()
        useGameStore.setState({
            spreaderPos: {
                x: bSpreader[0],
                y: bSpreader[1],
                z: bSpreader[2],
            },
        })
        craneBSystem.update(0.016)
        expect(trainingSystem.getRuntimeState().craneCollisionCount).toBeGreaterThanOrEqual(1)
        expect(COLLISION_DISTANCE).toBeGreaterThan(0)
    })

    it('does not tick outside multi-crane training', () => {
        craneBSystem.start()
        useGameStore.setState({ gameMode: 'sandbox', currentTrainingModule: null })
        const phase = craneBSystem.getState().phase
        for (let i = 0; i < 50; i++) craneBSystem.update(0.1)
        expect(craneBSystem.getState().phase).toBe(phase)
    })

    it('NPC install credits secondary ship once', () => {
        trainingSystem.setTrainingShipIds('ship-a', 'ship-b')
        craneBSystem.start()
        // Fast-forward through a full cycle
        for (let i = 0; i < 400; i++) {
            useGameStore.setState({ spreaderPos: { x: -8, y: 12, z: 5 } })
            craneBSystem.update(0.1)
        }
        const runtime = trainingSystem.getRuntimeState()
        expect(runtime.shipsWithInstalls.has('ship-b')).toBe(true)
        expect(craneBSystem.getState().installsCompleted).toBe(1)
        expect(CRANE_B_BASE[0]).toBe(30)
    })
})

describe('evaluateCompletedObjectives multi-crane coordination gate', () => {
    it('coordinate-1 requires craneBCoordinated, not installs alone', async () => {
        const { evaluateCompletedObjectives, DEFAULT_TRAINING_RUNTIME } = await import(
            '../trainingObjectiveEvaluator'
        )
        const metrics = {
            timeElapsed: 60,
            maxSway: 0.1,
            totalDamage: 0,
            installationsCompleted: 2,
            installationsTarget: 2,
            accuracyScore: 90,
        }
        const withoutAck = {
            ...DEFAULT_TRAINING_RUNTIME,
            shipsWithInstalls: new Set(['a', 'b']),
            craneBCoordinated: false,
        }
        const withAck = { ...withoutAck, craneBCoordinated: true }

        expect(
            evaluateCompletedObjectives('multi-crane', ['coordinate-1'], metrics, withoutAck),
        ).not.toContain('coordinate-1')
        expect(
            evaluateCompletedObjectives('multi-crane', ['coordinate-1'], metrics, withAck),
        ).toContain('coordinate-1')
    })
})
