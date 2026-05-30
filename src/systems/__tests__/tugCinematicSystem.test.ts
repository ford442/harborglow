import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// =============================================================================
// TUG CINEMATIC SYSTEM — smoke tests
// All Transport and store interactions are mocked.
// Uses globalThis for event dispatching (works in Node test environment).
// =============================================================================

// ---------------------------------------------------------------------------
// Polyfill CustomEvent + globalThis.dispatchEvent/addEventListener for Node
// ---------------------------------------------------------------------------
import { EventEmitter } from 'events'

const emitter = new EventEmitter()
emitter.setMaxListeners(50)

// Minimal CustomEvent polyfill
class CustomEventPolyfill extends Event {
  detail: unknown
  constructor(type: string, init?: CustomEventInit) {
    super(type)
    this.detail = init?.detail
  }
}

// Attach to globalThis so tugCinematicSystem.dispatch() can fire
;(globalThis as unknown as Record<string, unknown>).CustomEvent = CustomEventPolyfill
;(globalThis as unknown as Record<string, unknown>).dispatchEvent = (e: Event) => {
  emitter.emit(e.type, e)
  return true
}

/** Listen for a globalThis event in tests */
function onGlobal(type: string, cb: (e: Event) => void) {
  emitter.on(type, cb)
  return () => emitter.off(type, cb)
}

// ---------------------------------------------------------------------------
// Mock Tone.js (required by sequencerSystem)
// ---------------------------------------------------------------------------
vi.mock('tone', () => {
  let _seconds = 0
  const transport = {
    get seconds() { return _seconds },
    set seconds(v: number) { _seconds = v },
    get bpm() { return { value: 120 } },
    get state() { return 'started' as const },
    scheduleRepeat: vi.fn(),
    position: '0:0:0',
    stop: vi.fn(),
    start: vi.fn(),
    _setSeconds(v: number) { _seconds = v },
  }
  return { getTransport: () => transport }
})

// ---------------------------------------------------------------------------
// Mock useGameStore — only the actions used by tugCinematicSystem
// ---------------------------------------------------------------------------
const setTugSpectatorActive = vi.fn()

vi.mock('../../store/useGameStore', () => ({
  useGameStore: {
    getState: () => ({ setTugSpectatorActive }),
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import * as Tone from 'tone'
import { sequencerSystem } from '../sequencerSystem'
import {
  triggerTugObjectiveCinematic,
  triggerTugWinCinematic,
  triggerSalvageCinematic,
  TUG_CINEMATIC_START_EVENT,
  TUG_CINEMATIC_END_EVENT,
} from '../tugCinematicSystem'
import type { TugCinematicDetail } from '../tugCinematicSystem'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setTransportSeconds(v: number) {
  (Tone.getTransport() as unknown as { _setSeconds: (v: number) => void })._setSeconds(v)
}

const BPM = 120
const SPB = 60 / BPM // seconds per beat = 0.5 s

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('tugCinematicSystem', () => {
  beforeEach(() => {
    setTransportSeconds(0)
    sequencerSystem.clearAll()
    setTugSpectatorActive.mockClear()
    emitter.removeAllListeners()
  })

  afterEach(() => {
    emitter.removeAllListeners()
  })

  it('triggerTugObjectiveCinematic dispatches start event immediately', () => {
    const received: TugCinematicDetail[] = []
    const off = onGlobal(TUG_CINEMATIC_START_EVENT, (e) => {
      received.push((e as CustomEvent<TugCinematicDetail>).detail)
    })

    triggerTugObjectiveCinematic('container', 'Berth Alpha', { cleanTows: 1 })
    off()

    expect(received).toHaveLength(1)
    expect(received[0].type).toBe('objective')
    expect(received[0].label).toBe('Berth Alpha')
    expect(received[0].shipType).toBe('container')
    expect(received[0].careerStats?.cleanTows).toBe(1)
  })

  it('triggerTugObjectiveCinematic activates drone at beat 4', () => {
    triggerTugObjectiveCinematic('tanker', 'Berth Beta')

    // Before beat 4 — drone must not have fired
    setTransportSeconds(SPB * 4 - 0.01)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    expect(setTugSpectatorActive).not.toHaveBeenCalled()

    // At beat 4 — drone activates
    setTransportSeconds(SPB * 4)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    expect(setTugSpectatorActive).toHaveBeenCalledWith(true)
  })

  it('triggerTugObjectiveCinematic deactivates drone and fires end event at beat 32', () => {
    const endEvents: TugCinematicDetail[] = []
    const off = onGlobal(TUG_CINEMATIC_END_EVENT, (e) => {
      endEvents.push((e as CustomEvent<TugCinematicDetail>).detail)
    })

    triggerTugObjectiveCinematic('bulk', 'Berth Gamma')

    setTransportSeconds(SPB * 32)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    off()

    expect(setTugSpectatorActive).toHaveBeenCalledWith(false)
    expect(endEvents).toHaveLength(1)
    expect(endEvents[0].type).toBe('objective')
  })

  it('triggerTugWinCinematic fires with type=win and deactivates drone at beat 40', () => {
    const startEvents: TugCinematicDetail[] = []
    const endEvents: TugCinematicDetail[] = []
    const offStart = onGlobal(TUG_CINEMATIC_START_EVENT, (e) => {
      startEvents.push((e as CustomEvent<TugCinematicDetail>).detail)
    })
    const offEnd = onGlobal(TUG_CINEMATIC_END_EVENT, (e) => {
      endEvents.push((e as CustomEvent<TugCinematicDetail>).detail)
    })

    triggerTugWinCinematic({ totalTonsAssisted: 400, cleanTows: 3, nightRescues: 1 })

    // Immediate start event
    expect(startEvents).toHaveLength(1)
    expect(startEvents[0].type).toBe('win')
    expect(startEvents[0].careerStats?.totalTonsAssisted).toBe(400)

    // Drone activates at beat 4
    setTransportSeconds(SPB * 4)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    expect(setTugSpectatorActive).toHaveBeenCalledWith(true)

    // Drone deactivates at beat 40
    setTransportSeconds(SPB * 40)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    expect(setTugSpectatorActive).toHaveBeenCalledWith(false)
    expect(endEvents).toHaveLength(1)
    offStart()
    offEnd()
  })

  it('triggerSalvageCinematic fires with type=salvage', () => {
    const received: TugCinematicDetail[] = []
    const off = onGlobal(TUG_CINEMATIC_START_EVENT, (e) => {
      received.push((e as CustomEvent<TugCinematicDetail>).detail)
    })

    triggerSalvageCinematic('Rustline Trawler 12', 'trawler', { cleanTows: 2 })
    off()

    expect(received).toHaveLength(1)
    expect(received[0].type).toBe('salvage')
    expect(received[0].label).toBe('Rustline Trawler 12')
    expect(received[0].shipType).toBe('trawler')
  })
})
