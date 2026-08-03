import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SystemRegistry } from '../SystemRegistry'
import type { FrameContext, SystemTick } from '../types'

function makeCtx(overrides: Partial<FrameContext> = {}): FrameContext {
    return {
        delta: 0.016,
        elapsedTime: 1,
        camera: {} as FrameContext['camera'],
        swayTrolleyPosition: { x: 0, y: 0, z: 0 } as FrameContext['swayTrolleyPosition'],
        bpm: 120,
        ...overrides,
    }
}

import type { Mock } from 'vitest'

type StubSystem = SystemTick & { update: Mock<(dt: number, ctx: FrameContext) => void> }

function stubSystem(
    id: string,
    order: number,
    extra: Partial<SystemTick> = {}
): StubSystem {
    return {
        id,
        order,
        update: vi.fn(),
        ...extra,
    } as StubSystem
}

describe('SystemRegistry', () => {
    let registry: SystemRegistry

    beforeEach(() => {
        registry = new SystemRegistry()
    })

    describe('registration order', () => {
        it('ticks systems in ascending order value', () => {
            const calls: string[] = []
            const a = stubSystem('a', 30)
            const b = stubSystem('b', 10)
            const c = stubSystem('c', 20)

            a.update.mockImplementation(() => calls.push('a'))
            b.update.mockImplementation(() => calls.push('b'))
            c.update.mockImplementation(() => calls.push('c'))

            registry.register(a)
            registry.register(b)
            registry.register(c)

            registry.tick(0.016, makeCtx())

            expect(calls).toEqual(['b', 'c', 'a'])
        })

        it('rejects duplicate ids', () => {
            registry.register(stubSystem('time', 10))
            expect(() => registry.register(stubSystem('time', 20))).toThrow(/duplicate id/)
        })
    })

    describe('start/stop idempotency', () => {
        it('calls start once per system even when startAll is invoked twice', () => {
            const start = vi.fn()
            registry.register(stubSystem('alpha', 10, { start }))

            registry.startAll()
            registry.startAll()

            expect(start).toHaveBeenCalledTimes(1)
            expect(registry.isStarted('alpha')).toBe(true)
        })

        it('calls stop once per system even when stopAll is invoked twice', () => {
            const stop = vi.fn()
            registry.register(stubSystem('beta', 10, { stop }))

            registry.startAll()
            registry.stopAll()
            registry.stopAll()

            expect(stop).toHaveBeenCalledTimes(1)
            expect(registry.isStarted('beta')).toBe(false)
        })

        it('does not call stop before start', () => {
            const stop = vi.fn()
            registry.register(stubSystem('gamma', 10, { stop }))

            registry.stopAll()

            expect(stop).not.toHaveBeenCalled()
        })
    })

    describe('group pause', () => {
        it('skips systems in a paused group', () => {
            const core = stubSystem('core', 10, { groups: ['core'] })
            const crane = stubSystem('crane', 20, { groups: ['crane'] })
            registry.register(core)
            registry.register(crane)

            registry.pauseGroup('crane')
            registry.tick(0.016, makeCtx())

            expect(core.update).toHaveBeenCalledTimes(1)
            expect(crane.update).not.toHaveBeenCalled()
        })

        it('resumes ticking after resumeGroup', () => {
            const crane = stubSystem('crane', 10, { groups: ['crane'] })
            registry.register(crane)

            registry.pauseGroup('crane')
            registry.tick(0.016, makeCtx())
            registry.resumeGroup('crane')
            registry.tick(0.016, makeCtx())

            expect(crane.update).toHaveBeenCalledTimes(1)
        })
    })

    describe('shouldTick', () => {
        it('skips update when shouldTick returns false', () => {
            const storm = stubSystem('storm', 10, {
                groups: ['storm'],
                shouldTick: () => false,
            })
            registry.register(storm)

            registry.tick(0.016, makeCtx())

            expect(storm.update).not.toHaveBeenCalled()
        })
    })

    describe('pauseAll', () => {
        it('skips every system while globally paused', () => {
            const sys = stubSystem('time', 10)
            registry.register(sys)

            registry.pauseAll()
            registry.tick(0.016, makeCtx())

            expect(sys.update).not.toHaveBeenCalled()
        })
    })

    describe('clear', () => {
        it('stops started systems and removes registrations', () => {
            const stop = vi.fn()
            registry.register(stubSystem('time', 10, { stop }))
            registry.startAll()

            registry.clear()

            expect(stop).toHaveBeenCalledTimes(1)
            expect(registry.getRegisteredIds()).toEqual([])
        })
    })
})
