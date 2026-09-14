// =============================================================================
// GLTF LOADER SETUP — Meshopt only (shared by preload + drei useGLTF)
//
// No Draco. HarborGlow ships as static files (`base: './'`), and the Draco
// decoder is only distributable as a separate hosted WASM bundle — the previous
// `https://www.gstatic.com/...` decoder path made two hulls silently fall back
// to procedural anywhere gstatic was unreachable, and put a third-party request
// on the player's first load. The meshopt decoder is a plain module bundled with
// three, so nothing here reaches the network.
//
// Consequence for authoring: never commit a `KHR_draco_mesh_compression` GLB.
// `npm run models:verify` fails the build if one appears.
// =============================================================================

import { GLTFLoader } from 'three-stdlib'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/** Attach the meshopt decoder to a GLTFLoader instance (must run per instance). */
export function configureGltfLoader(loader: GLTFLoader): GLTFLoader {
  loader.setMeshoptDecoder(MeshoptDecoder)
  return loader
}

/**
 * Kept as a no-op call site so app boot keeps one obvious "loaders are ready"
 * step. drei's `useGLTF(url, false, true)` needs no global configuration now
 * that Draco is gone — setting a decoder path here would reintroduce the CDN.
 */
export function configureDreiGltf(): void {}

export function createConfiguredGltfLoader(): GLTFLoader {
  return configureGltfLoader(new GLTFLoader())
}
