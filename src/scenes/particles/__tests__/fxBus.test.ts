import * as THREE from 'three'
import { afterEach, describe, expect, it } from 'vitest'
import {
  FX_QUEUE_SIZE,
  drainFxRequests,
  forEachContinuousEmitter,
  pendingFxRequests,
  resetFxBus,
  setContinuousEmitter,
  setFxBusEnabled,
  triggerEmitter,
  type FxRequest,
} from '../fxBus'
import {
  emitterAnchorCount,
  emitterAnchorKey,
  getEmitterAnchor,
  setEmitterAnchor,
} from '../emitterAnchors'

afterEach(() => resetFxBus())

describe('fxBus', () => {
  it('drops bursts while no engine is running', () => {
    triggerEmitter('spark', { position: [0, 0, 0] })
    expect(pendingFxRequests()).toBe(0)
  })

  it('queues and drains in order with defaults filled in', () => {
    setFxBusEnabled(true)
    triggerEmitter('spark', { position: [1, 2, 3] }, { color: '#fff', count: 10 })
    triggerEmitter('mist', { anchorKey: 'ship:mast' })
    const seen: Array<Pick<FxRequest, 'preset' | 'anchorKey' | 'hasPosition' | 'count' | 'color'>> = []
    drainFxRequests((r) => seen.push({ preset: r.preset, anchorKey: r.anchorKey, hasPosition: r.hasPosition, count: r.count, color: r.color }))
    expect(seen).toEqual([
      { preset: 'spark', anchorKey: null, hasPosition: true, count: 10, color: '#fff' },
      { preset: 'mist', anchorKey: 'ship:mast', hasPosition: false, count: -1, color: null },
    ])
    expect(pendingFxRequests()).toBe(0)
  })

  it('wraps by dropping the oldest request and reuses request objects', () => {
    setFxBusEnabled(true)
    for (let i = 0; i < FX_QUEUE_SIZE + 3; i++) triggerEmitter('spark', { position: [i, 0, 0] })
    expect(pendingFxRequests()).toBe(FX_QUEUE_SIZE)
    const xs: number[] = []
    const objs = new Set<FxRequest>()
    drainFxRequests((r) => { xs.push(r.px); objs.add(r) })
    expect(xs[0]).toBe(3)
    expect(xs[xs.length - 1]).toBe(FX_QUEUE_SIZE + 2)
    expect(objs.size).toBe(FX_QUEUE_SIZE)
  })

  it('disabling clears the queue; streams are kept until removed', () => {
    setFxBusEnabled(true)
    triggerEmitter('spark', { position: [0, 0, 0] })
    setContinuousEmitter('a', { preset: 'glitter', position: [0, 0, 0] })
    setFxBusEnabled(false)
    expect(pendingFxRequests()).toBe(0)
    const keys: string[] = []
    forEachContinuousEmitter((k) => keys.push(k))
    expect(keys).toEqual(['a'])
    setContinuousEmitter('a', null)
    keys.length = 0
    forEachContinuousEmitter((k) => keys.push(k))
    expect(keys).toEqual([])
  })
})

describe('emitterAnchors', () => {
  it('registers and unregisters by ship:part key', () => {
    const key = emitterAnchorKey('ship-1', 'funnel_top')
    expect(key).toBe('ship-1:funnel_top')
    setEmitterAnchor(key, {
      key, shipId: 'ship-1', shipType: 'cruise', partName: 'funnel_top',
      rigType: 'rgb_matrix', group: 'funnel', installed: true,
      position: new THREE.Vector3(1, 2, 3), quaternion: new THREE.Quaternion(),
    })
    expect(getEmitterAnchor(key)?.position.y).toBe(2)
    expect(emitterAnchorCount()).toBe(1)
    setEmitterAnchor(key, null)
    expect(getEmitterAnchor(key)).toBeUndefined()
  })
})
