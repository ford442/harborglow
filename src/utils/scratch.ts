import * as THREE from 'three'

/**
 * Module-scope temporaries for per-frame Three.js math.
 * Safe inside single-threaded useFrame callbacks; do not use across nested
 * re-entrant calls or overlapping async work that might share the same scratch.
 */
export const scratchVec3a = new THREE.Vector3()
export const scratchVec3b = new THREE.Vector3()
export const scratchVec3c = new THREE.Vector3()
export const scratchVec3d = new THREE.Vector3()
export const scratchQuat = new THREE.Quaternion()
export const scratchEuler = new THREE.Euler()

/** Buoyancy probe scratch (tug = 4 probes, target ship = 6). */
export const MAX_HULL_PROBES = 16
export const hullScratchXs = new Float32Array(MAX_HULL_PROBES)
export const hullScratchZs = new Float32Array(MAX_HULL_PROBES)
export const hullScratchYs = new Float32Array(MAX_HULL_PROBES)
export const hullScratchHeights = new Float32Array(MAX_HULL_PROBES)
export const hullScratchNormals = new Float32Array(MAX_HULL_PROBES * 3)
export const scratchDir = new THREE.Vector3(0, 0, -1)
