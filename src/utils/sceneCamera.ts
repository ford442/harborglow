import * as THREE from 'three'

let sceneCamera: THREE.Camera | null = null

export function setSceneCamera(camera: THREE.Camera | null) {
  sceneCamera = camera
}

export function getSceneCamera() {
  return sceneCamera
}

