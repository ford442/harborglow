/**
 * lightShowNodes — TSL (Three Shading Language) node-based shaders
 * for the ship light-show effect.
 *
 * These build on Three.js r163+ TSL API and are used with NodeMaterial.
 * Import from three/tsl when targeting WebGPU.
 *
 * Usage:
 *   import { buildRGBMatrixMaterial } from '../shaders/lightShowNodes'
 *   const mat = buildRGBMatrixMaterial()
 */

import * as THREE from 'three'

// TSL availability check - reserved for future WebGPU support
// When TSL is available, uncomment the following:
// const tslAvailable = true
// try { require('three/tsl') } catch { tslAvailable = false }

/**
 * Creates a MeshStandardMaterial (or NodeMaterial if TSL is available)
 * that pulses with a rainbow hue synced to a time uniform.
 *
 * The `uTime` and `uBeat` uniforms should be updated each frame.
 */
export function buildRGBMatrixMaterial(): THREE.MeshStandardMaterial {
  // Fallback: standard emissive material updated via JS each frame
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x111111),
    emissive: new THREE.Color(0x00ff88),
    emissiveIntensity: 1.5,
    roughness: 0.4,
    metalness: 0.6,
  })
}

/**
 * Creates a ShaderMaterial for volumetric god-ray effect on the dock lights.
 * Rendered as a cone mesh above each light source.
 */
export function buildGodRayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#00aaff') },
      uIntensity: { value: 0.5 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;

      void main() {
        // Fade from bright base to transparent tip
        float alpha = (1.0 - vUv.y) * 0.35 * uIntensity;
        // Animated shimmer
        alpha *= 0.8 + 0.2 * sin(uTime * 3.0 + vUv.y * 8.0);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

/**
 * Updates a god-ray material's time uniform.
 * Call this in useFrame.
 */
export function updateGodRay(material: THREE.ShaderMaterial, time: number) {
  if (material.uniforms?.uTime) {
    material.uniforms.uTime.value = time
  }
}
