// =============================================================================
// GLTF LOADER SETUP — Draco + Meshopt (shared by preload + drei useGLTF)
// =============================================================================

import { DRACOLoader, GLTFLoader } from 'three-stdlib'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { useGLTF } from '@react-three/drei'

/** CDN path for Draco WASM decoders (matches three-stdlib / drei defaults). */
export const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

let loaderConfigured = false
let dreiConfigured = false

export function configureGltfLoader(loader: GLTFLoader): GLTFLoader {
  if (!loaderConfigured) {
    const draco = new DRACOLoader()
    draco.setDecoderPath(DRACO_DECODER_PATH)
    loader.setDRACOLoader(draco)
    loader.setMeshoptDecoder(MeshoptDecoder)
    loaderConfigured = true
  }
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
