import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

async function test() {
  const { EffectPass, SSREffect } = await import('postprocessing')
  
  const renderer = new THREE.WebGLRenderer()
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  
  const ssrEffect = new SSREffect(scene, camera)
  const ssrPass = new EffectPass(camera, ssrEffect)
  
  try {
    composer.addPass(ssrPass)
    console.log("SUCCESS added EffectPass to JSM EffectComposer")
  } catch(e) {
    console.log("FAILED", e.message)
  }
}

test()
