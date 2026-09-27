import * as THREE from 'three'

/**
 * In-place equivalent of `new THREE.TubeGeometry(path, tubularSegments, radius, radialSegments, false)`.
 *
 * CraneCable used to dispose + rebuild two TubeGeometry objects every frame. This writes the same
 * positions/normals into an existing geometry's buffers (topology, uv and index never change for a
 * given segment count). Mirrors three's TubeGeometry + Curve.computeFrenetFrames for the open case;
 * the parity test compares against the real class. Scratch vectors are module-scope.
 */
const MAX_SEGMENTS = 64
const tangents: THREE.Vector3[] = []
const normals: THREE.Vector3[] = []
const binormals: THREE.Vector3[] = []
for (let i = 0; i <= MAX_SEGMENTS; i++) {
  tangents.push(new THREE.Vector3())
  normals.push(new THREE.Vector3())
  binormals.push(new THREE.Vector3())
}
const _P = new THREE.Vector3()
const _vec = new THREE.Vector3()
const _normal = new THREE.Vector3()
const _mat = new THREE.Matrix4()

export function updateTubeGeometryInPlace(
  geometry: THREE.BufferGeometry,
  path: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  radius: number,
  radialSegments: number,
): void {
  const segs = Math.min(tubularSegments, MAX_SEGMENTS)

  // --- Frenet frames (open curve) ---
  for (let i = 0; i <= segs; i++) {
    path.getTangentAt(i / segs, tangents[i]).normalize()
  }
  let min = Number.MAX_VALUE
  const tx = Math.abs(tangents[0].x)
  const ty = Math.abs(tangents[0].y)
  const tz = Math.abs(tangents[0].z)
  _vec.set(0, 0, 0)
  if (tx <= min) { min = tx; _vec.set(1, 0, 0) }
  if (ty <= min) { min = ty; _vec.set(0, 1, 0) }
  if (tz <= min) { _vec.set(0, 0, 1) }
  _normal.crossVectors(tangents[0], _vec).normalize()
  normals[0].crossVectors(tangents[0], _normal)
  binormals[0].crossVectors(tangents[0], normals[0])
  for (let i = 1; i <= segs; i++) {
    normals[i].copy(normals[i - 1])
    binormals[i].copy(binormals[i - 1])
    _vec.crossVectors(tangents[i - 1], tangents[i])
    if (_vec.length() > Number.EPSILON) {
      _vec.normalize()
      const theta = Math.acos(THREE.MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1))
      normals[i].applyMatrix4(_mat.makeRotationAxis(_vec, theta))
    }
    binormals[i].crossVectors(tangents[i], normals[i])
  }

  // --- Vertices ---
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  const normal = geometry.getAttribute('normal') as THREE.BufferAttribute
  let k = 0
  for (let i = 0; i <= segs; i++) {
    path.getPointAt(i / segs, _P)
    const N = normals[i]
    const B = binormals[i]
    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2
      const sin = Math.sin(v)
      const cos = -Math.cos(v)
      _normal.set(cos * N.x + sin * B.x, cos * N.y + sin * B.y, cos * N.z + sin * B.z).normalize()
      normal.setXYZ(k, _normal.x, _normal.y, _normal.z)
      position.setXYZ(k, _P.x + radius * _normal.x, _P.y + radius * _normal.y, _P.z + radius * _normal.z)
      k++
    }
  }
  position.needsUpdate = true
  normal.needsUpdate = true
  // Frustum culling reads the cached bounding sphere; keep it current (allocation-free after first call).
  geometry.computeBoundingSphere()
}
