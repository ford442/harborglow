import type * as THREE from 'three'

// =============================================================================
// FRAME CONTEXT — per-tick inputs shared by all registered systems
// =============================================================================

export interface FrameContext {
    delta: number
    elapsedTime: number
    camera: THREE.Camera
    /** World-space trolley position for crane sway physics. */
    swayTrolleyPosition: THREE.Vector3
    bpm: number
}

// =============================================================================
// SYSTEM GROUPS — used for pause/resume on mode transitions
// =============================================================================

/**
 * Logical buckets for living-harbor systems. Pause a group when its gameplay
 * context is inactive (e.g. crane sway while in tugboat helm mode).
 */
export type SystemGroup =
    | 'core'
    | 'traffic'
    | 'crane'
    | 'ambient'
    | 'harbor-events'
    | 'storm'

// =============================================================================
// SYSTEM TICK CONTRACT
// =============================================================================

export interface SystemTick {
    /** Unique stable id — used for logging and test assertions. */
    id: string
    /** Lower numbers tick first. Gaps (10, 20, …) leave room for insertions. */
    order: number
    /** Optional group membership for pause/resume. */
    groups?: SystemGroup[]
    update(dt: number, ctx: FrameContext): void
    start?(): void
    stop?(): void
    /** When false the system is skipped this frame (group pause still applies). */
    shouldTick?(ctx: FrameContext): boolean
}
