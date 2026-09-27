import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { updateTubeGeometryInPlace } from '../craneCableTube'

function curveFor(seed: number) {
  const pts = [] as THREE.Vector3[]
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    pts.push(new THREE.Vector3(seed + t * 12, 20 - t * 14 - Math.sin(t * Math.PI) * seed * 0.3, Math.cos(t * 3 + seed) * 0.4))
  }
  return new THREE.CatmullRomCurve3(pts)
}

describe('updateTubeGeometryInPlace', () => {
  it.each([0.3, 1.7, 4.2])('matches a freshly built TubeGeometry (seed %s)', (seed) => {
    const curve = curveFor(seed)
    const radius = 0.11 + seed * 0.01
    const ref = new THREE.TubeGeometry(curve, 20, radius, 8, false)
    // start from a geometry with different radius/curve, then update in place
    const geo = new THREE.TubeGeometry(curveFor(seed + 5), 20, 0.5, 8, false)
    updateTubeGeometryInPlace(geo, curve, 20, radius, 8)
    for (const name of ['position', 'normal'] as const) {
      const a = geo.getAttribute(name).array as Float32Array
      const b = ref.getAttribute(name).array as Float32Array
      expect(a.length).toBe(b.length)
      let maxDiff = 0
      for (let i = 0; i < a.length; i++) maxDiff = Math.max(maxDiff, Math.abs(a[i] - b[i]))
      expect(maxDiff).toBeLessThan(1e-5)
    }
    ref.computeBoundingSphere()
    expect(geo.boundingSphere!.radius).toBeCloseTo(ref.boundingSphere!.radius, 4)
  })
})
