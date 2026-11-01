// =============================================================================
// CRANE KINEMATICS — per-frame pose, outside useGameStore
//
// spreaderPos, spreaderRotation, cableDepth, trolleyPosition and loadTension
// change every sim tick while the crane moves. They live in this vanilla
// Zustand store so a tick does not notify useGameStore subscribers and does
// not re-render React. The global store holds only state that survives a frame.
//
//   - Hot writers (stepCrane, autopilot, magnet) call the set* mutators.
//   - Per-frame 3D reads getCraneKinematics() inside useFrame / update().
//   - HUD uses useSampledCraneKinematics (≤ 10 Hz). Do not call the raw
//     useCraneKinematics hook from a component: it re-renders on every set.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createStore } from 'zustand/vanilla'

export interface CranePose {
    x: number
    y: number
    z: number
}

export interface CraneKinematics {
    spreaderPos: CranePose
    spreaderRotation: number
    cableDepth: number
    trolleyPosition: number
    loadTension: number
}

export interface CraneKinematicsState extends CraneKinematics {
    setSpreaderPos: (pos: CranePose) => void
    setSpreaderRotation: (rotation: number) => void
    setCableDepth: (depth: number) => void
    setTrolleyPosition: (position: number) => void
    setLoadTension: (tension: number) => void
    reset: (seed?: Partial<CraneKinematics>) => void
}

/** HUD sample rate. One React update per 100 ms at most. */
export const CRANE_KINEMATICS_SAMPLE_HZ = 10
const SAMPLE_MS = 1000 / CRANE_KINEMATICS_SAMPLE_HZ

export const CRANE_KINEMATICS_HOME: CraneKinematics = {
    spreaderPos: { x: 0, y: 10, z: 0 },
    spreaderRotation: 0,
    cableDepth: 15,
    trolleyPosition: 0.5,
    loadTension: 0,
}

function copyPose(pos: CranePose): CranePose {
    return { x: pos.x, y: pos.y, z: pos.z }
}

function kinematicsFrom(seed?: Partial<CraneKinematics>): CraneKinematics {
    return {
        spreaderPos: copyPose(seed?.spreaderPos ?? CRANE_KINEMATICS_HOME.spreaderPos),
        spreaderRotation: seed?.spreaderRotation ?? CRANE_KINEMATICS_HOME.spreaderRotation,
        cableDepth: seed?.cableDepth ?? CRANE_KINEMATICS_HOME.cableDepth,
        trolleyPosition: seed?.trolleyPosition ?? CRANE_KINEMATICS_HOME.trolleyPosition,
        loadTension: seed?.loadTension ?? CRANE_KINEMATICS_HOME.loadTension,
    }
}

export const craneKinematics = createStore<CraneKinematicsState>()(
    subscribeWithSelector((set) => ({
        ...kinematicsFrom(),
        setSpreaderPos: (pos) => set({ spreaderPos: copyPose(pos) }),
        setSpreaderRotation: (rotation) => set({ spreaderRotation: rotation }),
        setCableDepth: (depth) => set({ cableDepth: depth }),
        setTrolleyPosition: (position) => set({ trolleyPosition: position }),
        setLoadTension: (tension) => set({ loadTension: tension }),
        reset: (seed) => set(kinematicsFrom(seed)),
    })),
)

/** Live kinematics for sim steps and useFrame. Does not subscribe React. */
export function getCraneKinematics(): CraneKinematicsState {
    return craneKinematics.getState()
}

/** World-space hoist cable endpoints. Matches Crane.tsx's trolley/hook placement. */
export function craneCableWorldEndpoints(k: CraneKinematics = getCraneKinematics()): {
    start: [number, number, number]
    end: [number, number, number]
    tension: number
} {
    const trolleyX = (k.trolleyPosition - 0.5) * 40
    return {
        start: [trolleyX, 9.2, 0],
        end: [
            trolleyX + Math.sin(k.spreaderRotation) * 0.5,
            k.spreaderPos.y - 4,
            Math.cos(k.spreaderRotation) * 0.5,
        ],
        tension: Math.min(1, k.loadTension / 50),
    }
}

/**
 * Raw store hook. Re-renders on every kinematics write. Tests and one-shot
 * reads only — UI uses useSampledCraneKinematics.
 */
export function useCraneKinematics<T>(
    selector: (state: CraneKinematicsState) => T,
    equalityFn?: (a: T, b: T) => boolean,
): T {
    return useStore(craneKinematics, selector, equalityFn)
}

/**
 * UI subscription at CRANE_KINEMATICS_SAMPLE_HZ. The first change in a quiet
 * period schedules one publish SAMPLE_MS later, and that publish reads the
 * latest pose, so a burst keeps the last value and never renders faster than
 * 10 Hz. Shallow-equal snapshots do not setState.
 */
export function useSampledCraneKinematics<T>(
    selector: (state: CraneKinematicsState) => T,
    equalityFn: (a: T, b: T) => boolean = shallow,
): T {
    const selectorRef = useRef(selector)
    const equalityRef = useRef(equalityFn)
    selectorRef.current = selector
    equalityRef.current = equalityFn

    const [value, setValue] = useState(() => selector(craneKinematics.getState()))

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined
        let queued = false

        const publish = () => {
            queued = false
            timer = undefined
            const next = selectorRef.current(craneKinematics.getState())
            setValue((prev) => (equalityRef.current(prev, next) ? prev : next))
        }

        const unsub = craneKinematics.subscribe(
            (state) => selectorRef.current(state),
            () => {
                if (queued) return
                queued = true
                timer = setTimeout(publish, SAMPLE_MS)
            },
        )

        return () => {
            unsub()
            if (timer !== undefined) clearTimeout(timer)
        }
    }, [])

    return value
}
