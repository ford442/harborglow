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
export const scratchDir = new THREE.Vector3(0, 0, -1)
