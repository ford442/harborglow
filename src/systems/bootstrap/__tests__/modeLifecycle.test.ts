import { beforeEach, describe, expect, it } from 'vitest'

import { systemRegistry } from '../SystemRegistry'
import {
    ensureMainSceneSystemsRegistered,
    resetMainSceneSystemsRegistrationForTests,
} from '../mainSceneSystems'
import { syncSystemModeLifecycle } from '../modeLifecycle'

describe('syncSystemModeLifecycle', () => {
    beforeEach(() => {
        systemRegistry.clear()
        resetMainSceneSystemsRegistrationForTests()
        ensureMainSceneSystemsRegistered()
    })

    it('pauses crane group in tugboat operation mode', () => {
        syncSystemModeLifecycle({
            operationMode: 'tugboat',
            gameMode: 'sandbox',
            currentTrainingModule: null,
            activeMission: null,
        })

        expect(systemRegistry.isGroupPaused('crane')).toBe(true)
        expect(systemRegistry.isGroupPaused('storm')).toBe(false)
    })

    it('resumes crane group in crane operation mode', () => {
        syncSystemModeLifecycle({
            operationMode: 'crane',
            gameMode: 'sandbox',
            currentTrainingModule: null,
            activeMission: null,
        })

        expect(systemRegistry.isGroupPaused('crane')).toBe(false)
        expect(systemRegistry.isGroupPaused('storm')).toBe(true)
    })

    it('enables storm ticks for emergency training on crane', () => {
        syncSystemModeLifecycle({
            operationMode: 'crane',
            gameMode: 'training',
            currentTrainingModule: 'emergency',
            activeMission: null,
        })

        expect(systemRegistry.isGroupPaused('storm')).toBe(false)
        expect(systemRegistry.isGroupPaused('ambient')).toBe(true)
        expect(systemRegistry.isGroupPaused('harbor-events')).toBe(true)
        expect(systemRegistry.isGroupPaused('traffic')).toBe(true)
    })

    it('pauses harbor-events during an active mission', () => {
        syncSystemModeLifecycle({
            operationMode: 'tugboat',
            gameMode: 'sandbox',
            currentTrainingModule: null,
            activeMission: {
                id: 'mission-1',
                type: 'salvage',
                status: 'active',
                timeLimit: 300,
                maxDamage: 0.5,
            },
        })

        expect(systemRegistry.isGroupPaused('harbor-events')).toBe(true)
        expect(systemRegistry.isGroupPaused('ambient')).toBe(false)
    })
})

describe('ensureMainSceneSystemsRegistered', () => {
    beforeEach(() => {
        systemRegistry.clear()
        resetMainSceneSystemsRegistrationForTests()
    })

    it('registers MainScene systems in documented order', () => {
        ensureMainSceneSystemsRegistered()

        expect(systemRegistry.getRegisteredIds()).toEqual([
            'time',
            'traffic',
            'lighting',
            'weather',
            'sway',
            'wildlife',
            'ambient-marine-life',
            'sea-events',
            'harbor-events',
            'dynamic-events',
            'experimental-tech',
            'waves',
            'storm',
        ])
    })

    it('is idempotent', () => {
        ensureMainSceneSystemsRegistered()
        ensureMainSceneSystemsRegistered()

        expect(systemRegistry.getRegisteredIds()).toHaveLength(13)
    })
})
