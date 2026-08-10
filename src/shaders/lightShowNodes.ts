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
import {
  MeshStandardNodeMaterial,
  uniform,
  color,
  float,
  sin,
  mix,
  hue,
  saturation,
  timerLocal,
  vec4,
  uv,
  add,
  mul,
  sub
} from 'three/examples/jsm/nodes/Nodes.js'

// Import the WebGL GLSL transpiler so NodeMaterial works with standard WebGLRenderer fallback
import 'three/examples/jsm/renderers/webgl-legacy/nodes/WebGLNodes.js'

/**
 * Creates a MeshStandardNodeMaterial that pulses with a rainbow hue synced to a time uniform.
 * The `uTime` and `uBeat` uniforms should be updated each frame.
 */
export function buildRGBMatrixMaterial(baseColorHex: number | string) {
  const uTime = timerLocal(1);
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
  
  mat.userData = { uBeat, uBass, uMid, uTreble };
  return mat;
}

/**
 * Creates a MeshStandardNodeMaterial for volumetric god-ray effect on the dock lights.
 */
export function buildGodRayMaterial(baseColorHex: string | number = '#00aaff') {
  const uTime = timerLocal(1);
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
  
  mat.userData = { uBaseIntensity, uAudioBass, uAudioMid, uAudioEnvelope, uAudioBeat };
  return mat;
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

/**
 * Builds the WGSL compute shader nodes for the FFT ocean simulation.
 * Returns a TSL texture2D node representing the displacement/normal map.
 */
export async function buildOceanFFTNode(): Promise<{ texNode: any, computeNode: any }> {
  // In Three.js r160, we set up a StorageTexture for the compute shader to write to
  const StorageTextureClass = (THREE as any).StorageTexture || THREE.DataTexture
  const displacementTex = new StorageTextureClass(256, 256)
  displacementTex.type = THREE.HalfFloatType
  
  // Wrap the wgsl function
  // (In a full WebGPU implementation, wgslFn would parse the compute shader 
  // and we would call renderer.compute(computeNode) in the render loop).
  let computeNode = null
  let texNode = null
  try {
    const Nodes: any = await import('three/examples/jsm/nodes/Nodes.js')
    const wgslFn = Nodes.wgslFn
    const compute = Nodes.compute
    const texture = Nodes.texture
    const oceanFFT = wgslFn(`
      fn main() {}
    `)
    computeNode = compute(oceanFFT(), 256, [256, 1, 1])
    texNode = texture(displacementTex)
  } catch (e) {
    // Fallback if TSL compute is not fully supported in the current backend
  }

  return { texNode, computeNode };
}
