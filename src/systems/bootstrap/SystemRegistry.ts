import type { FrameContext, SystemGroup, SystemTick } from './types'

// =============================================================================
// SYSTEM REGISTRY — single tick entry point for MainScene useFrame
// =============================================================================

export class SystemRegistry {
    private systems: SystemTick[] = []
    private startedIds = new Set<string>()
    private pausedGroups = new Set<SystemGroup>()
    private globallyPaused = false

    register(system: SystemTick): void {
        if (this.systems.some((s) => s.id === system.id)) {
            throw new Error(`SystemRegistry: duplicate id "${system.id}"`)
        }
        this.systems.push(system)
        this.systems.sort((a, b) => a.order - b.order)
    }

    unregister(id: string): void {
        const index = this.systems.findIndex((s) => s.id === id)
        if (index === -1) return
        if (this.startedIds.has(id)) {
            this.systems[index].stop?.()
            this.startedIds.delete(id)
        }
        this.systems.splice(index, 1)
    }

    clear(): void {
        this.stopAll()
        this.systems = []
        this.pausedGroups.clear()
        this.globallyPaused = false
    }

    getRegisteredIds(): string[] {
        return this.systems.map((s) => s.id)
    }

    getPausedGroups(): SystemGroup[] {
        return [...this.pausedGroups]
    }

    isStarted(id: string): boolean {
        return this.startedIds.has(id)
    }

    startAll(): void {
        for (const system of this.systems) {
            this.startSystem(system)
        }
    }

    stopAll(): void {
        for (const system of this.systems) {
            this.stopSystem(system)
        }
    }

    startSystemById(id: string): void {
        const system = this.systems.find((s) => s.id === id)
        if (system) this.startSystem(system)
    }

    stopSystemById(id: string): void {
        const system = this.systems.find((s) => s.id === id)
        if (system) this.stopSystem(system)
    }

    pauseAll(): void {
        this.globallyPaused = true
    }

    resumeAll(): void {
        this.globallyPaused = false
    }

    pauseGroup(group: SystemGroup): void {
        this.pausedGroups.add(group)
    }

    resumeGroup(group: SystemGroup): void {
        this.pausedGroups.delete(group)
    }

    isGroupPaused(group: SystemGroup): boolean {
        return this.pausedGroups.has(group)
    }

    tick(dt: number, ctx: FrameContext): void {
        if (this.globallyPaused) return

        for (const system of this.systems) {
            if (!this.isSystemActive(system, ctx)) continue
            system.update(dt, ctx)
        }
    }

    private startSystem(system: SystemTick): void {
        if (this.startedIds.has(system.id)) return
        system.start?.()
        this.startedIds.add(system.id)
    }

    private stopSystem(system: SystemTick): void {
        if (!this.startedIds.has(system.id)) return
        system.stop?.()
        this.startedIds.delete(system.id)
    }

    private isSystemActive(system: SystemTick, ctx: FrameContext): boolean {
        if (system.shouldTick && !system.shouldTick(ctx)) return false
        if (!system.groups || system.groups.length === 0) return true
        return !system.groups.some((group) => this.pausedGroups.has(group))
    }
}

/** Process-wide singleton used by MainScene. */
export const systemRegistry = new SystemRegistry()
