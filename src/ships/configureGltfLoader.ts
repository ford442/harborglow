// =============================================================================
// GLTF LOADER SETUP — Draco + Meshopt (shared by preload + drei useGLTF)
// =============================================================================

import { DRACOLoader, GLTFLoader } from 'three-stdlib'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { useGLTF } from '@react-three/drei'

/** CDN path for Draco WASM decoders (matches three-stdlib / drei defaults). */
export const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

let sharedDraco: DRACOLoader | null = null
let dreiConfigured = false

function getSharedDracoLoader(): DRACOLoader {
  if (!sharedDraco) {
    sharedDraco = new DRACOLoader()
    sharedDraco.setDecoderPath(DRACO_DECODER_PATH)
  }
  return sharedDraco
}

/**
 * Attach Draco + Meshopt to a GLTFLoader instance.
 * Must run on every new loader — a previous bug only configured the first
 * instance, so Draco-compressed hero hulls #2+ failed to preload.
 */
export function configureGltfLoader(loader: GLTFLoader): GLTFLoader {
  loader.setDRACOLoader(getSharedDracoLoader())
  loader.setMeshoptDecoder(MeshoptDecoder)
  return loader
}

/** Call once at app boot so useGLTF.preload() can decode Draco assets. */
export function configureDreiGltf(): void {
  if (dreiConfigured) return
  useGLTF.setDecoderPath(DRACO_DECODER_PATH)
  dreiConfigured = true
}

export function createConfiguredGltfLoader(): GLTFLoader {
  return configureGltfLoader(new GLTFLoader())
}
