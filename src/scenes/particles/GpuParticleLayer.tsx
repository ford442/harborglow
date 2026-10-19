// =============================================================================
// GpuParticleLayer — mounts the TSL compute particle engine + laser beams (#248)
//
// Lazy-loaded from MainScene (own chunk, outside the game-initial budget).
// Lasers need no compute and mount whenever the layer does; particles mount
// only when canUseGpuParticles passes.
// Each frame, in one useFrame at default priority (so R3F still owns the
// render): write the shared fx uniforms → drain fxBus bursts → continuous
// streams → show-driven emitters → bench → dispatch update + spawn compute.
// Show-driven emitters come from the factory show's emitter bindings
// (showBindingDriver) when the ship has them, else from the cue pattern.
// Remounts the engine (key = budget) when the quality tier changes.
// =============================================================================

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { setFrameBudgetParticles } from '../../rendering/frameBudgetState'
import { GpuParticleSystem, type ParticleRenderer } from '../../rendering/particles/GpuParticleSystem'
import { EMITTER_PRESETS } from '../../rendering/particles/emitterPresets'
import { writeFxFrameUniforms } from '../../rendering/particles/fxFrameUniforms'
import { PARTICLE_BUDGET } from '../../rendering/particles/particleBudget'
import { canUseGpuParticles } from '../../rendering/particles/particleGate'
import { getAudioAnalysisData } from '../../systems/audioVisualSync'
import { lightingSystem } from '../../systems/lightingSystem'
import { useGameStore } from '../../store/useGameStore'
import { AliveEstimator } from './aliveEstimate'
import { emitterAnchors, getEmitterAnchor } from './emitterAnchors'
import {
  drainFxRequests,
  forEachContinuousEmitter,
  setFxBusEnabled,
  type ContinuousEmitterSpec,
  type FxRequest,
} from './fxBus'
import LaserBeamLayer from './LaserBeamLayer'
import { ParticleBench, parseParticleBench } from './particleBench'
import { createBindingFrame, hasShowBindings, ShowBindingDriver } from './showBindingDriver'
import { ShowEmitterDriver, StreamAccumulator, type EmitSink, type ShowFrame } from './showEmitterDriver'
import { publishShowParticlesDebug, type ShowParticlesStats } from './showParticlesDebug'
import { readShowPlayhead } from './showPlayhead'

const UP = new THREE.Vector3(0, 1, 0)
const scratchDir = new THREE.Vector3()

export default function GpuParticleLayer() {
  const gl = useThree((s) => s.gl)
  const quality = useGameStore((s) => s.qualityPreset)
  const gpuOk = useMemo(() => canUseGpuParticles(gl), [gl])
  const bench = useMemo(() => parseParticleBench(), [])
  const budget = bench ? PARTICLE_BUDGET.high : PARTICLE_BUDGET[quality]
  return (
    <>
      {gpuOk && <ParticleEngine key={budget} budget={budget} bench={bench} />}
      <LaserBeamLayer quality={quality} />
    </>
  )
}

function ParticleEngine({ budget, bench }: { budget: number; bench: boolean }) {
  const gl = useThree((s) => s.gl) as unknown as ParticleRenderer
  const sys = useMemo(() => new GpuParticleSystem(budget), [budget])

  const { tick, stats } = useMemo(() => {
    const budgetScale = sys.capacity / PARTICLE_BUDGET.high
    const driver = new ShowEmitterDriver(budgetScale)
    const bindingDriver = new ShowBindingDriver(sys.capacity, sys.maxSpawn, getEmitterAnchor)
    const bindingFrame = createBindingFrame()
    const alive = new AliveEstimator()
    const stats: ShowParticlesStats = { budget: sys.capacity, alive: 0, emitters: 0 }
    let visualTime = 0
    let frameNo = 0
    const streams = new StreamAccumulator()
    const benchRig = bench ? new ParticleBench(sys.capacity) : null
    const frame: ShowFrame = {
      shipId: null, pattern: 'breathe', target: 'all', intensity: 0, color: null, beatPhase: 0, bass: 0, dt: 0,
    }
    let dt = 0

    // Every emit goes through here so the alive estimate sees what actually fit.
    const emit = (
      preset: Parameters<EmitSink>[0],
      ox: number, oy: number, oz: number,
      dx: number, dy: number, dz: number,
      count: number, color: string | null, seed: number,
    ): number => {
      const fit = sys.emit(preset, ox, oy, oz, dx, dy, dz, count, color, seed)
      alive.add(preset, visualTime, fit)
      return fit
    }

    const visitBurst = (r: FxRequest) => {
      const anchor = r.anchorKey ? getEmitterAnchor(r.anchorKey) : undefined
      if (!anchor && !r.hasPosition) return
      const p = anchor?.position
      if (r.hasDirection) scratchDir.set(r.dx, r.dy, r.dz)
      else if (anchor) scratchDir.copy(UP).applyQuaternion(anchor.quaternion)
      else scratchDir.copy(UP)
      const count = r.count >= 0 ? r.count : EMITTER_PRESETS[r.preset].burstCount * budgetScale
      emit(
        r.preset,
        p ? p.x : r.px, p ? p.y : r.py, p ? p.z : r.pz,
        scratchDir.x, scratchDir.y, scratchDir.z,
        count, r.color, r.seed,
      )
    }

    const visitStream = (key: string, spec: ContinuousEmitterSpec) => {
      const anchor = spec.anchorKey ? getEmitterAnchor(spec.anchorKey) : undefined
      if (!anchor && !spec.position) return
      const rate = (spec.ratePerS ?? EMITTER_PRESETS[spec.preset].ratePerS) * (spec.gain ?? 1) * budgetScale
      const n = streams.take(key, rate, dt)
      if (n <= 0) return
      const p = anchor ? anchor.position : null
      if (spec.direction) scratchDir.set(spec.direction[0], spec.direction[1], spec.direction[2])
      else if (anchor) scratchDir.copy(UP).applyQuaternion(anchor.quaternion)
      else scratchDir.copy(UP)
      emit(
        spec.preset,
        p ? p.x : spec.position![0], p ? p.y : spec.position![1], p ? p.z : spec.position![2],
        scratchDir.x, scratchDir.y, scratchDir.z,
        n, spec.color ?? null, (key.length * 0.173 + n * 0.031) % 1,
      )
    }

    const tick = (stepDt: number, rawDelta: number) => {
      dt = stepDt
      visualTime += stepDt
      benchRig?.recordFrame(rawDelta)
      drainFxRequests(visitBurst)
      forEachContinuousEmitter(visitStream)

      const show = lightingSystem.getCurrentShow()
      const cue = show.isActive ? lightingSystem.getCueState() : null
      const audio = getAudioAnalysisData()
      // A ship whose factory show has emitter bindings plays those instead of the cue-pattern look.
      readShowPlayhead(bindingFrame, dt)
      const bound = hasShowBindings(bindingFrame.shipType)
      bindingDriver.update(bindingFrame, emit)
      frame.shipId = cue && !bound ? show.shipId : null
      frame.pattern = cue ? cue.pattern : 'blackout'
      frame.target = lightingSystem.getActiveCue()?.target ?? 'all'
      frame.intensity = cue ? cue.intensity : 0
      frame.color = cue ? cue.color : null
      frame.beatPhase = audio.beatPhase
      frame.bass = audio.bass
      frame.dt = dt
      driver.update(frame, emitterAnchors(), emit)

      if (benchRig) {
        const ship = useGameStore.getState().ships[0]
        benchRig.step(dt, ship ? ship.position[0] : 0, ship ? ship.position[2] : 0, emit)
      }

      stats.alive = alive.estimate(visualTime, sys.capacity)
      stats.emitters = bindingDriver.activeCount
      // The shell can recreate harborglowDebug; re-attaching is a no-op while it is still set.
      if ((++frameNo & 63) === 0) publishShowParticlesDebug(stats)
    }
    return { tick, stats }
  }, [sys, bench])

  useEffect(() => {
    publishShowParticlesDebug(stats)
    return () => publishShowParticlesDebug(null)
  }, [stats])

  useEffect(() => {
    let cancelled = false
    sys.init(gl).then(
      () => {
        if (cancelled) return
        setFxBusEnabled(true)
        setFrameBudgetParticles(sys.capacity)
      },
      (err) => console.warn('✨ GPU particles disabled — init failed:', err),
    )
    return () => {
      cancelled = true
      setFxBusEnabled(false)
      setFrameBudgetParticles(0)
      sys.dispose(gl)
    }
  }, [sys, gl])

  useFrame((state, delta) => {
    const dt = writeFxFrameUniforms(delta, state.clock.elapsedTime)
    if (!sys.ready) return
    tick(dt, delta)
    sys.step(gl)
  })

  return <primitive object={sys.object3d} />
}
