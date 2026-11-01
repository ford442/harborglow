import * as THREE from 'three/webgpu'
import { describe, expect, it } from 'vitest'
import { createLaserBeamGeometry, createLaserBeamMaterial, type LaserBeamUserData } from '../laserBeamMaterial'
import type { EmitterAnchor } from '../../../scenes/particles/emitterAnchors'
import { BEAMS_PER_RIG, LASER_LENGTH_M, beamDirection, laserGate, layoutLaserBeams, type LaserFrame } from '../../../scenes/particles/laserBeams'
import { wgslCompiler } from './wgslTestCompiler'

function beamMesh(depthFade: boolean) {
  const mat = createLaserBeamMaterial({ depthFade })
  return { mat, mesh: new THREE.InstancedMesh(createLaserBeamGeometry(), mat, 4) }
}

describe('laser beam material', () => {
  it('compiles with depth fade against a depth texture binding', () => {
    const { mat, mesh } = beamMesh(true)
    const { fragment } = wgslCompiler().material(mesh, mat)
    expect(fragment).toMatch(/texture_depth(_multisampled)?_2d/)
    expect((mat.userData as unknown as LaserBeamUserData).depthFade).toBe(true)
    expect(mat.blending).toBe(THREE.AdditiveBlending)
    expect(mat.depthWrite).toBe(false)
  })

  it('compiles without a depth binding when depth fade is off (low tier)', () => {
    const { mat, mesh } = beamMesh(false)
    const { fragment } = wgslCompiler().material(mesh, mat)
    expect(fragment).not.toMatch(/texture_depth/)
    expect((mat.userData as unknown as LaserBeamUserData).uGate.value).toBe(1)
  })

  it('unit geometry spans y 0..1 so instance scale.y is beam length', () => {
    const g = createLaserBeamGeometry()
    g.computeBoundingBox()
    expect(g.boundingBox!.min.y).toBeCloseTo(0)
    expect(g.boundingBox!.max.y).toBeCloseTo(1)
  })
})

function anchor(key: string, rigType: EmitterAnchor['rigType'], over: Partial<EmitterAnchor> = {}): EmitterAnchor {
  return {
    key, shipId: 'ship-1', shipType: 'cruise', partName: key, rigType, group: 'bridge', installed: true,
    position: new THREE.Vector3(5, 12, 0), quaternion: new THREE.Quaternion(), ...over,
  }
}

const frame = (over: Partial<LaserFrame> = {}): LaserFrame => ({
  shipId: 'ship-1', pattern: 'sweep', target: 'all', beatPhase: 0.2, beats: 0, time: 0, ...over,
})

describe('layoutLaserBeams', () => {
  const anchors = [
    anchor('bridge', 'projector'),
    anchor('deck', 'projector', { group: 'deck' }),
    anchor('funnel', 'rgb_matrix', { group: 'funnel' }),
    anchor('stack', 'projector', { installed: false }),
    anchor('other', 'projector', { shipId: 'ship-2' }),
  ]
  const out = () => Array.from({ length: 8 }, () => new THREE.Matrix4())

  it('places two upward beams per installed projector on the show ship', () => {
    const m = out()
    const n = layoutLaserBeams(frame(), anchors, m)
    expect(n).toBe(2 * BEAMS_PER_RIG)
    const p = new THREE.Vector3().setFromMatrixPosition(m[0])
    expect(p.toArray()).toEqual([5, 12, 0])
    expect(beamDirection(m[0]).y).toBeGreaterThan(0.7)
    const s = new THREE.Vector3().setFromMatrixScale(m[0])
    expect(s.y).toBeCloseTo(LASER_LENGTH_M)
  })

  it('honours the rig-group target and the instance budget', () => {
    expect(layoutLaserBeams(frame({ target: 'deck' }), anchors, out())).toBe(BEAMS_PER_RIG)
    expect(layoutLaserBeams(frame(), anchors, [new THREE.Matrix4()])).toBe(1)
    expect(layoutLaserBeams(frame({ pattern: 'blackout' }), anchors, out())).toBe(0)
    expect(layoutLaserBeams(frame({ shipId: null }), anchors, out())).toBe(0)
  })

  it('sweep rotates the beams with the beat count', () => {
    const a = out(); const b = out()
    layoutLaserBeams(frame({ beats: 0 }), anchors, a)
    layoutLaserBeams(frame({ beats: 1 }), anchors, b)
    expect(beamDirection(a[0]).angleTo(beamDirection(b[0]))).toBeGreaterThan(0.1)
  })

  it('gates strobe/snap to the start of each beat', () => {
    expect(laserGate('strobe', 0.05)).toBe(1)
    expect(laserGate('strobe', 0.5)).toBe(0)
    expect(laserGate('snap', 0.25)).toBe(1)
    expect(laserGate('blackout', 0)).toBe(0)
    expect(laserGate('breathe', 0.9)).toBe(1)
  })
})
