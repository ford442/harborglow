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

import * as THREE from 'three/webgpu'
import { MeshStandardNodeMaterial } from 'three/webgpu'
import {
  uniform,
  color,
  float,
  sin,
  mix,
  hue,
  saturation,
  vec4,
  uv,
  add,
  mul,
  sub,
  Fn,
  compute,
  texture,
  textureStore,
  instanceIndex,
  uvec2
} from 'three/tsl'

/**
 * Creates a MeshStandardNodeMaterial that pulses with a rainbow hue synced to a time uniform.
 * The `uTime` and `uBeat` uniforms should be updated each frame.
 */
export function buildRGBMatrixMaterial(baseColorHex: number | string) {
  const uTime = uniform(0);
  const uBeat = uniform(0);
  const uBass = uniform(0);
  const uMid = uniform(0);
  const uTreble = uniform(0);
  
  const baseColorNode = color(baseColorHex);
  
  // hue-rotate + saturation-boost on the emissive channel driven by bass RMS
  const hueShifted = hue(baseColorNode, mul(uBass, 2.0));
  const satBoosted = saturation(hueShifted, add(uBass, 1.0));
  
  // flicker node (sin-based noise) gated by beat flag
  const flicker = add(mul(sin(mul(uTime, 20.0)), 0.5), 0.5);
  const beatFlicker = mix(float(1.0), flicker, uBeat);
  
  const emissiveNode = mul(mul(satBoosted, beatFlicker), 1.5);
  
  const mat = new MeshStandardNodeMaterial();
  mat.colorNode = color(0x111111);
  mat.roughnessNode = float(0.4);
  mat.metalnessNode = float(0.6);
  mat.emissiveNode = emissiveNode;
  
  mat.userData = { uTime, uBeat, uBass, uMid, uTreble };
  return mat;
}

/**
 * Creates a MeshStandardNodeMaterial for volumetric god-ray effect on the dock lights.
 */
export function buildGodRayMaterial(baseColorHex: string | number = '#00aaff') {
  const uTime = uniform(0);
  const uBaseIntensity = uniform(0.5);
  const uAudioBass = uniform(0);
  const uAudioMid = uniform(0);
  const uAudioEnvelope = uniform(0);
  const uAudioBeat = uniform(0);
  const uColor = color(baseColorHex);
  
  const mat = new MeshStandardNodeMaterial();
  mat.transparent = true;
  mat.depthWrite = false;
  mat.blending = THREE.AdditiveBlending;
  mat.side = THREE.DoubleSide;
  
  const vUv = uv();
  
  // Fade from bright base to transparent tip
  let alpha = mul(mul(sub(float(1.0), vUv.y), 0.35), uBaseIntensity);
  
  // Animated shimmer
  const shimmer = add(mul(sin(add(mul(uTime, 3.0), mul(vUv.y, 8.0))), 0.2), 0.8);
  alpha = mul(alpha, shimmer);
  
  mat.colorNode = vec4(uColor, alpha);
  
  mat.userData = {
    uBaseIntensity,
    uIntensity: uBaseIntensity,
    uColor,
    uTime,
    uAudioBass,
    uAudioMid,
    uAudioEnvelope,
    uAudioBeat,
  };
  return mat;
}

/**
 * Updates a god-ray material's time uniform.
 * Call this in useFrame.
 */
export function updateGodRay(material: MeshStandardNodeMaterial, time: number) {
  const uTime = material.userData.uTime as { value: number } | undefined
  if (uTime) {
    uTime.value = time
  }
}

/**
 * Builds a minimal storage-texture compute pass: every texel is written with
 * its own normalised UV.
 *
 * This is a **device capability probe**, not an ocean. It exists so
 * `computeDiagnostics` can prove that this renderer really executes a compute
 * shader and really writes a StorageTexture, before anything else commits to
 * the GPU path. The ocean simulation itself lives in `src/systems/ocean/`
 * (CPU/WASM tier) and, once device features are negotiated (#199), in the
 * WGSL butterfly passes — neither of which goes through here.
 *
 * The renderer must execute the returned node explicitly with
 * `renderer.computeAsync(computeNode)`.
 */
export function buildStorageTextureProbeNode(width = 256, height = 256) {
  const displacementTex = new THREE.StorageTexture(width, height)
  displacementTex.type = THREE.HalfFloatType

  const writeDisplacement = Fn(() => {
    const posX = instanceIndex.mod(width)
    const posY = instanceIndex.div(width)
    const indexUV = uvec2(posX, posY)
    const normalizedX = float(posX).div(width)
    const normalizedY = float(posY).div(height)
    const value = vec4(normalizedX, normalizedY, 0, 1)

    return textureStore(displacementTex, indexUV, value).toWriteOnly()
  })

  return {
    displacementTex,
    texNode: texture(displacementTex),
    computeNode: compute(writeDisplacement(), width * height, [64]),
  }
}
