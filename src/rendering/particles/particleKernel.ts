// =============================================================================
// TSL COMPUTE PARTICLES — instancedArray storage buffers, one thread each
//
// No per-particle CPU state. Emitter rows are a small storage buffer the
// frame loop fills. Respawn is branchless step weights: no TSL Loop and no
// select, which diverges on Lavapipe (three #33650).
// =============================================================================

import * as THREE from 'three'
import { NodeUpdateType, SpriteNodeMaterial } from 'three/webgpu'
import {
  Fn,
  attributeArray,
  compute,
  cos,
  float,
  hash,
  instancedArray,
  instanceIndex,
  max,
  sin,
  step,
  uniform,
  vec4,
} from 'three/tsl'
import { EMITTER_STRIDE, MAX_EMITTERS, PARTICLE_WORKGROUP, dispatchCountFor } from './particleBudget'
import { createLaserMaterial } from './laserMaterial'

const EMITTER_VEC4S = EMITTER_STRIDE / 4

export interface ParticleSystem {
  drawnCount: number
  sprite: THREE.Sprite
  laserMaterial: THREE.Material
  laserGeometry: THREE.CylinderGeometry
  isReady: boolean
  init: (renderer: unknown) => Promise<void>
  uploadEmitters: (table: Float32Array, fireworkCount: number) => void
  writeAudio: (
    bass: number,
    mid: number,
    treble: number,
    beatPhase: number,
    dt: number,
    seed: number,
  ) => void
  dispatch: (renderer: unknown) => void
  dispose: () => void
}

export function createParticleSystem(drawnCount: number): ParticleSystem {
  const dispatchCount = dispatchCountFor(drawnCount)
  const positionBuffer = instancedArray(dispatchCount, 'vec4')
  const velocityBuffer = instancedArray(dispatchCount, 'vec4')
  const colorBuffer = instancedArray(dispatchCount, 'vec4')
  const emitterBuffer = attributeArray(MAX_EMITTERS * EMITTER_VEC4S, 'vec4')

  const uBass = uniform(0)
  const uMid = uniform(0)
  const uTreble = uniform(0)
  const uBeatPhase = uniform(0)
  const uDelta = uniform(0)
  const uSeed = uniform(1)
  const uEmitterCount = uniform(0)

  const initNode = compute(
    Fn(() => {
      positionBuffer.element(instanceIndex).assign(vec4(0, -100, 0, 0))
      velocityBuffer.element(instanceIndex).assign(vec4(0, 0, 0, 0))
      colorBuffer.element(instanceIndex).assign(vec4(1, 1, 1, 0))
    })(),
    dispatchCount,
    [PARTICLE_WORKGROUP],
  )
  initNode.updateBeforeType = NodeUpdateType.NONE

  const updateNode = compute(
    Fn(() => {
      const position = positionBuffer.element(instanceIndex)
      const velocity = velocityBuffer.element(instanceIndex)
      const color = colorBuffer.element(instanceIndex)

      const life = position.w
      const alive = step(float(0.001), life)
      const safeCount = max(uEmitterCount, float(1))
      const emitterIndex = float(instanceIndex).mod(safeCount)
      const base = emitterIndex.mul(EMITTER_VEC4S)
      const e0 = emitterBuffer.element(base)
      const e1 = emitterBuffer.element(base.add(1))
      const e2 = emitterBuffer.element(base.add(2))

      const emitterActive = step(float(0.5), e0.w)
      const isFirework = step(e1.w, float(0.5))
      const hasEmitters = step(float(0.5), uEmitterCount)
      const canSpawn = float(1).sub(alive).mul(emitterActive).mul(isFirework).mul(hasEmitters)
      const wAlive = alive
      const wSpawn = canSpawn
      const wDead = float(1).sub(alive).mul(float(1).sub(canSpawn))

      const h1 = hash(float(instanceIndex).add(uSeed))
      const h2 = hash(float(instanceIndex).add(uSeed).add(17.13))
      const h3 = hash(float(instanceIndex).add(uSeed).add(41.77))
      const bassBoost = float(0.55).add(uBass)
      const theta = h1.mul(6.2831853)
      const speed = float(2.5).add(h2.mul(6)).mul(bassBoost).mul(max(e2.w, float(0.15)))
      const spawnVel = vec4(
        cos(theta).mul(speed).add(uMid.mul(0.5)),
        float(2).add(h3.mul(5)).mul(bassBoost),
        sin(theta).mul(speed),
        0,
      )
      const integratedVel = vec4(
        velocity.x,
        velocity.y.add(float(-4.5).mul(uDelta).mul(wAlive)),
        velocity.z,
        0,
      )
      const usedVel = integratedVel.mul(wAlive).add(spawnVel.mul(wSpawn))

      const integratedPos = vec4(
        position.x.add(usedVel.x.mul(uDelta)),
        position.y.add(usedVel.y.mul(uDelta)),
        position.z.add(usedVel.z.mul(uDelta)),
        life.sub(uDelta),
      )
      const spawnPos = vec4(e0.x, e0.y, e0.z, float(0.7).add(h2.mul(0.9)))
      const deadPos = vec4(0, -100, 0, 0)
      const outPos = integratedPos.mul(wAlive).add(spawnPos.mul(wSpawn)).add(deadPos.mul(wDead))
      const outVel = usedVel

      const spawnColor = vec4(
        e2.x,
        e2.y,
        e2.z,
        float(0.12).add(h3.mul(0.22)).mul(bassBoost),
      )
      const outColor = spawnColor.mul(wSpawn).add(color.mul(wAlive))

      position.assign(outPos)
      velocity.assign(outVel)
      color.assign(outColor)
    })(),
    dispatchCount,
    [PARTICLE_WORKGROUP],
  )
  updateNode.updateBeforeType = NodeUpdateType.NONE

  const posAttr = positionBuffer.toAttribute()
  const colAttr = colorBuffer.toAttribute()
  const material = new SpriteNodeMaterial()
  material.transparent = true
  material.depthWrite = false
  material.depthTest = true
  material.blending = THREE.AdditiveBlending
  material.toneMapped = false
  material.positionNode = posAttr.xyz
  material.scaleNode = max(posAttr.w, float(0)).mul(colAttr.w).mul(float(0.45).add(uBass))
  material.colorNode = vec4(colAttr.xyz.mul(max(posAttr.w, float(0))), max(posAttr.w, float(0)))
  material.opacityNode = max(posAttr.w, float(0))

  const sprite = new THREE.Sprite(material)
  sprite.count = drawnCount
  sprite.frustumCulled = false
  sprite.renderOrder = 2

  const laserMaterial = createLaserMaterial(uTreble, uBeatPhase)
  const laserGeometry = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true)

  const emitterAttr = emitterBuffer.value
  let ready = false
  let initStarted = false

  return {
    drawnCount,
    sprite,
    laserMaterial,
    laserGeometry,
    get isReady() {
      return ready
    },
    async init(renderer) {
      if (ready || initStarted) return
      const gl = renderer as { computeAsync?: (node: unknown) => Promise<void> }
      if (typeof gl.computeAsync !== 'function') return
      initStarted = true
      try {
        await gl.computeAsync(initNode)
        ready = true
      } catch {
        ready = false
      }
    },
    uploadEmitters(table, fireworkCount) {
      const dst = emitterAttr.array as Float32Array
      dst.set(table.subarray(0, dst.length))
      emitterAttr.needsUpdate = true
      uEmitterCount.value = fireworkCount
    },
    writeAudio(bass, mid, treble, beatPhase, dt, seed) {
      uBass.value = bass
      uMid.value = mid
      uTreble.value = treble
      uBeatPhase.value = beatPhase
      uDelta.value = dt
      uSeed.value = seed
    },
    dispatch(renderer) {
      const gl = renderer as { compute?: (node: unknown) => void }
      if (!ready || typeof gl.compute !== 'function') return
      gl.compute(updateNode)
    },
    dispose() {
      ready = false
      initNode.dispose()
      updateNode.dispose()
      material.dispose()
      laserMaterial.dispose()
      laserGeometry.dispose()
    },
  }
}
