import type { RootState } from '@react-three/fiber'
import * as THREE from 'three'

import { useGameStore } from '../../store/useGameStore'
import { timeSystem } from '../timeSystem'
import { trafficSystem } from '../trafficSystem'
import { lightingSystem } from '../lightingSystem'
import { weatherSystem } from '../weatherSystem'
import { swaySystem } from '../swaySystem'
import { craneBSystem } from '../craneBSystem'
import { wildlifeSystem } from '../wildlifeSystem'
import { ambientMarineLifeSystem } from '../ambientMarineLifeSystem'
import { seaEventsSystem } from '../seaEventsSystem'
import { harborEventSystem } from '../eventSystem/HarborEventSystem'
import { dynamicEventSystem } from '../dynamicEventSystem'
import { experimentalTechSystem } from '../techSystem'
import { waveSystem } from '../WaveSystem'
import { stormSystem } from '../StormSystem'
import { systemRegistry } from './SystemRegistry'
import type { FrameContext } from './types'

// =============================================================================
// MAIN SCENE SYSTEM TABLE — explicit tick order (lower = earlier)
// =============================================================================
//
//  order  id                  groups
//  -----  ------------------  ---------------------------------
//   10    time                core
//   20    traffic             traffic
//   30    lighting            core
//   40    weather             core
//   50    sway                crane
//   55    crane-b             crane   (multi-crane training NPC)
//   60    wildlife            ambient
//   70    ambient-marine-life ambient
//   80    sea-events          ambient
//   90    harbor-events       harbor-events
//  100    dynamic-events      harbor-events
//  110    experimental-tech   harbor-events
//  120    waves               core
//  130    storm               storm
//
// =============================================================================

let registered = false

export function ensureMainSceneSystemsRegistered(): void {
    if (registered) return
    registered = true

    systemRegistry.register({
        id: 'time',
        order: 10,
        groups: ['core'],
        update: (dt) => timeSystem.update(dt),
    })

    systemRegistry.register({
        id: 'traffic',
        order: 20,
        groups: ['traffic'],
        update: (dt) => trafficSystem.update(dt),
    })

    systemRegistry.register({
        id: 'lighting',
        order: 30,
        groups: ['core'],
        update: (_dt, ctx) => lightingSystem.update(ctx.elapsedTime, ctx.bpm),
    })

    systemRegistry.register({
        id: 'weather',
        order: 40,
        groups: ['core'],
        update: (dt) => weatherSystem.update(dt),
    })

    systemRegistry.register({
        id: 'sway',
        order: 50,
        groups: ['crane'],
        update: (dt, ctx) => swaySystem.update(dt, ctx.swayTrolleyPosition),
    })

    systemRegistry.register({
        id: 'crane-b',
        order: 55,
        groups: ['crane'],
        update: (dt) => craneBSystem.update(dt),
        start: () => {
            // Deferred — start() is called when multi-crane scenario mounts
        },
        stop: () => craneBSystem.stop(),
        shouldTick: () => {
            const { gameMode, currentTrainingModule } = useGameStore.getState()
            return gameMode === 'training' && currentTrainingModule === 'multi-crane'
        },
    })

    systemRegistry.register({
        id: 'wildlife',
        order: 60,
        groups: ['ambient'],
        update: (dt) => wildlifeSystem.update(dt),
    })

    systemRegistry.register({
        id: 'ambient-marine-life',
        order: 70,
        groups: ['ambient'],
        update: (dt, ctx) => ambientMarineLifeSystem.update(dt, ctx.camera),
    })

    systemRegistry.register({
        id: 'sea-events',
        order: 80,
        groups: ['ambient'],
        update: (dt) => seaEventsSystem.update(dt),
    })

    systemRegistry.register({
        id: 'harbor-events',
        order: 90,
        groups: ['harbor-events'],
        update: (dt) => harborEventSystem.update(dt),
    })

    systemRegistry.register({
        id: 'dynamic-events',
        order: 100,
        groups: ['harbor-events'],
        update: (dt) => dynamicEventSystem.update(dt),
    })

    systemRegistry.register({
        id: 'experimental-tech',
        order: 110,
        groups: ['harbor-events'],
        update: (dt) => experimentalTechSystem.update(dt),
    })

    systemRegistry.register({
        id: 'waves',
        order: 120,
        groups: ['core'],
        update: (dt) => waveSystem.update(dt),
    })

    systemRegistry.register({
        id: 'storm',
        order: 130,
        groups: ['storm'],
        update: (dt) => stormSystem.update(dt),
        shouldTick: () => {
            const { operationMode, gameMode, currentTrainingModule } = useGameStore.getState()
            return (
                operationMode === 'tugboat' ||
                (gameMode === 'training' && currentTrainingModule === 'emergency')
            )
        },
    })
}

/** Reset registration flag — test helper only. */
export function resetMainSceneSystemsRegistrationForTests(): void {
    registered = false
}

export interface BuildFrameContextParams {
    state: RootState
    delta: number
    camera: THREE.Camera
    swayTrolleyPosition: THREE.Vector3
}

export function buildFrameContext({
    state,
    delta,
    camera,
    swayTrolleyPosition,
}: BuildFrameContextParams): FrameContext {
    return {
        delta,
        elapsedTime: state.clock.elapsedTime,
        camera,
        swayTrolleyPosition,
        bpm: useGameStore.getState().bpm,
    }
}
