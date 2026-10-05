// =============================================================================
// LaserBeamLayer — volumetric laser beams from projector rigs (#248)
//
// One InstancedMesh (LASER_BUDGET per tier). No compute, so it mounts on any
// WebGPU device even when the particle gate is off. Depth fade is skipped on
// `low` (no viewport depth copy).
// =============================================================================

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { writeFxFrameUniforms } from '../../rendering/particles/fxFrameUniforms'
import { createLaserBeamGeometry, createLaserBeamMaterial, type LaserBeamUserData } from '../../rendering/particles/laserBeamMaterial'
import { LASER_BUDGET } from '../../rendering/particles/particleBudget'
import { getAudioAnalysisData } from '../../systems/audioVisualSync'
import { lightingSystem } from '../../systems/lightingSystem'
import type { QualityPreset } from '../../store/gameStoreDomainTypes'
import { emitterAnchors } from './emitterAnchors'
import { laserGate, layoutLaserBeams, type LaserFrame } from './laserBeams'

export default function LaserBeamLayer({ quality }: { quality: QualityPreset }) {
  const capacity = LASER_BUDGET[quality]
  const depthFade = quality !== 'low'

  const { mesh, matrices, userData } = useMemo(() => {
    const material = createLaserBeamMaterial({ depthFade })
    const m = new THREE.InstancedMesh(createLaserBeamGeometry(), material as unknown as THREE.Material, capacity)
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    m.frustumCulled = false
    m.count = 0
    m.visible = false
    m.raycast = () => {}
    m.name = 'LaserBeams'
    return {
      mesh: m,
      matrices: Array.from({ length: capacity }, () => new THREE.Matrix4()),
      userData: material.userData as unknown as LaserBeamUserData,
    }
  }, [capacity, depthFade])

  useEffect(() => () => {
    mesh.geometry.dispose()
    ;(mesh.material as THREE.Material).dispose()
  }, [mesh])

  const frame = useMemo<LaserFrame>(() => ({
    shipId: null, pattern: 'blackout', target: 'all', beatPhase: 0, beats: 0, time: 0,
  }), [])

  useFrame((state, delta) => {
    writeFxFrameUniforms(delta, state.clock.elapsedTime)
    const show = lightingSystem.getCurrentShow()
    const cue = show.isActive ? lightingSystem.getCueState() : null
    if (!cue) {
      if (mesh.visible) { mesh.visible = false; mesh.count = 0 }
      return
    }
    const audio = getAudioAnalysisData()
    const dt = Math.min(delta, 0.05)
    frame.shipId = show.shipId
    frame.pattern = cue.pattern
    frame.target = lightingSystem.getActiveCue()?.target ?? 'all'
    frame.beatPhase = audio.beatPhase
    frame.beats += dt * (show.bpm / 60)
    frame.time += dt
    const n = layoutLaserBeams(frame, emitterAnchors(), matrices)
    for (let i = 0; i < n; i++) mesh.setMatrixAt(i, matrices[i])
    mesh.count = n
    mesh.visible = n > 0
    if (n > 0) mesh.instanceMatrix.needsUpdate = true
    userData.uGate.value = laserGate(cue.pattern, audio.beatPhase)
  })

  return <primitive object={mesh} />
}
