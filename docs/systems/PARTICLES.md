# GPU Particles & Laser Beams

Slice 2 of the Light Show Director epic (#236), issue #248. Compute-shader particles
(TSL `compute` + `instancedArray`) and volumetric laser beams, both bound to ship
attachment points and driven by the active light cue and the beat.

## Files

| File | Role |
|---|---|
| `src/rendering/particles/particleBudget.ts` | `PARTICLE_BUDGET` per tier (low 30k / medium 100k / high 250k), `LASER_BUDGET`, workgroup rounding |
| `src/rendering/particles/emitterPresets.ts` | `EmitterPresetId`, the five presets, `packPresetTable()` (GPU table) |
| `src/rendering/particles/spawnBatches.ts` | `SpawnBatchPacker` (CPU side of the spawn kernel), `PaletteAllocator` |
| `src/rendering/particles/GpuParticleSystem.ts` | The engine: storage buffers, init / update / spawn kernels, sprite draw |
| `src/rendering/particles/fxFrameUniforms.ts` | Shared beat/cue uniforms, written once per frame |
| `src/rendering/particles/laserBeamMaterial.ts` | Additive beam material with depth fade |
| `src/rendering/particles/particleGate.ts` | `canUseGpuParticles()`, `?particles=0` |
| `src/scenes/particles/fxBus.ts` | **Public API**: `triggerEmitter`, `setContinuousEmitter` |
| `src/scenes/particles/emitterAnchors.ts` / `EmitterAnchors.tsx` | World poses of attachment points, keyed `shipId:partName` |
| `src/scenes/particles/showEmitterDriver.ts` | Active cue → sparks / fireworks / glitter |
| `src/scenes/particles/laserBeams.ts` / `LaserBeamLayer.tsx` | Beam poses and gating from the cue pattern |
| `src/scenes/particles/GpuParticleLayer.tsx` | Lazy-mounted layer (own chunk); hosts particles + lasers |
| `src/scenes/particles/particleBench.ts` | `?particleBench=1` stress fixture |

Only `fxBus`, `emitterAnchors`, `EmitterAnchors.tsx` and the pure preset/budget tables
are eager; everything that imports `three/tsl` lives in the lazy `GpuParticleLayer`
chunk (budgeted in `bundle-budget.json`).

## Engine

**Storage** — two `instancedArray(N, 'vec4')` buffers, 32 B per particle (8 MB at 250k):

| Buffer | xyz | w |
|---|---|---|
| `posAge` | world position | normalised age; `>= 1` is dead |
| `velCode` | velocity | `presetIndex*16 + paletteSlot + 0.005 + 0.99*rand` |

**No CPU per-particle state.** The CPU keeps one ring cursor. Each frame:

1. **update** kernel, N threads: integrates every slot (gravity, drag, sin-field turbulence,
   age). Dead slots stay frozen via `mix(…, alive)`.
2. **spawn** kernel, one thread per new particle. Up to 32 *batches* per frame are packed
   into a vec4 uniform array (`SpawnBatchPacker`, layout in its header comment). Thread `k`
   finds its batch by prefix range with a fixed, unrolled 32-step `step()` mask, then
   overwrites ring slot `(cursor + k) % N`. The spawn count is padded to whole workgroups;
   padding threads write *dead* particles into the next (oldest) slots, so no bounds branch
   is needed. When the ring wraps, the oldest particles are overwritten: that is the budget
   policy.
3. **draw**: one instanced `Sprite` (`SpriteNodeMaterial`, `count = N`), reading both buffers
   as per-instance attributes. Colour and fade are computed per vertex (`varying`), size is
   0 for dead slots (no fragments), additive blending, no depth write.

Per-frame spawn is capped at `capacity / 20` (12.5k at high).

**Presets** (two vec4 rows each in a GPU uniform table: `[gravity, drag, life, size]`,
`[turbulence, bassGain, trebleGain, sizeEnd]`; spawn shape — speed, cone, jitter — is applied
at pack time):

| Preset | Look | Default trigger |
|---|---|---|
| `spark` | fast, heavy, short-lived | strobe cues, beat bursts |
| `firework` | isotropic shell, slow fall | snap cues on downbeats (22 m above mast/funnel rigs) |
| `mist` | large, rising, long-lived | fireboat water cannon (slice 7) |
| `glitter` | small, floating, treble-bright | breathe/sweep cues; icebreaker aurora (slice 7) |
| `installBurst` | warm upward fountain | every rig install (replaced `ParticleBurst3D`) |

## Public API (slices 3 and 7 bind here)

```ts
import { triggerEmitter, setContinuousEmitter } from 'src/scenes/particles/fxBus'
import { emitterAnchorKey } from 'src/scenes/particles/emitterAnchors'

// One-shot burst at an attachment point (world-pose aware), or a world position.
triggerEmitter('firework', { anchorKey: emitterAnchorKey(ship.id, 'funnel') }, { color: '#ff66cc' })
triggerEmitter('spark', { position: [x, y, z] }, { count: 400, direction: [0, 1, 0] })

// Named stream; `gain` can be modulated every frame. `null` removes it.
setContinuousEmitter('fireboat:cannon-1', { preset: 'mist', anchorKey, gain: 0.8 })
setContinuousEmitter('fireboat:cannon-1', null)
```

- Bursts are a fixed 64-slot ring (drop-oldest, no allocation), drained once per frame.
- They are **dropped while no engine runs** (compute gate off, `?particles=0`, layer not
  mounted yet). Streams are state and persist until removed.
- Counts default to the preset's `burstCount` / `ratePerS`, scaled by
  `capacity / 250k`, so low tier spawns about 12% as many particles.
- A future cue `fx?: EmitterPresetId` field (slice 3/7) maps directly onto these calls; see
  [LIGHT_SHOWS.md](./LIGHT_SHOWS.md#fx-hooks).

## Show driver

While `lightingSystem` has an active show, `ShowEmitterDriver` emits from **installed**
attachment points on the show's ship, filtered by the active cue's rig-group `target`:

| Cue pattern | Particles | Lasers |
|---|---|---|
| `strobe` | spark burst per non-projector rig on each beat | fixed fan, on for the first 15% of each beat |
| `snap` | firework shells over up to 3 mast/funnel rigs every 4th beat | fixed fan, on for the first 30% of each beat |
| `breathe` | glitter streams from matrix/strip rigs, rate × (0.5 + bass) | slow drift, tilt breathes with beat phase |
| `sweep` | as breathe | yaw sweeps a full turn every 4 beats |
| `blackout` | none | off |

Projector rigs host two laser beams each instead of particles.

## Anchors

`EmitterAnchors` is mounted per ship **inside `ProceduralShip`**, so poses include
blueprint scale and bob. It sits **outside** the `showPoints && lod < 2` attachment-visual
gate, so emitters work in tugboat mode and with points hidden. It reads last frame's
`matrixWorld`, which means a one-frame lag and no allocation. Ships at LOD 3 (impostors)
unmount their anchors; bursts aimed at them fall back to the request's `position`.

## Beat-reactive uniforms

`writeFxFrameUniforms(delta, state.clock.elapsedTime)` reads
`getAudioAnalysisData()` (bass/mid/treble, beat phase), `lightingSystem.getBeatPulse()` and
the cue colour/intensity into one set of TSL uniforms (`fxUniforms`).

- It is idempotent per frame key, so particles and lasers can both call it and only one
  write lands.
- `dt` is clamped to 1/20 s, so a hitch doesn't explode bursts.

## Laser beams

- Each beam is an open cylinder along local +Y with radius 0.25 → 1, scaled to 0.35 m × 70 m
  per instance. They are drawn as one `InstancedMesh` (`LASER_BUDGET`: 8 / 16 / 24 beams).
- **Material terms:**
  - a view-angle core falloff;
  - a length fade;
  - audio and cue-intensity drive;
  - a CPU-written pattern gate.
- Lasers need no compute, so they mount on any WebGPU device.

**Depth fade.** `saturate((positionView.z − sceneViewZ) / 1.5 m)`, where `sceneViewZ` comes
from `viewportDepthTexture()`:

- **Why not the god-rays depth.** Beams render *inside* PostProcessing's `scenePass`, so
  that pass's `getTextureNode('depth')` is the attachment being written and can't be
  sampled.
- **What `viewportDepthTexture()` gives instead.** It copies the opaque depth drawn so far.
  Under MSAA, three 0.183 binds it as `texture_depth_multisampled_2d` with a `textureLoad`.
- **Bloom and god rays.** Beams still feed both through colour. Because they don't write
  depth, they never occlude the rays.
- **`low` tier.** Depth fade is off there (no depth copy), leaving hard depth-tested beams
  with the view-angle softening.

## Gating and three.js caveats

- `canUseGpuParticles(renderer)` requires all of:
  - the boot probe's compute dispatch `passed`;
  - a WebGPU backend;
  - `renderer.compute`.
- It is false under `?no_gpu_compute=1` or `?particles=0`.
- When it is false, no particles render and `MagicalInstallFlash` remains the install
  feedback.
- **three #33650** (0.183): TSL `select` inside loops emits divergent `if/else` that kills
  Lavapipe-class devices. The kernels are arithmetic only (`step` / `mix` masks, unrolled
  batch loop). `gpuParticleSystem.test.ts` compiles every kernel to WGSL under Node and
  fails on any `if` / `select` / loop.
- **three #33147** (0.183): a FloatType `StorageTexture` fails without
  `float32-filterable`. The engine uses only storage *buffers*. If a texture-backed field is
  added, keep it HalfFloat or AND `hasGpuFeature('float32-filterable')`
  (`webgpuProbe.ts`) into the gate.
- Storage buffers have no public dispose in 0.183. `GpuParticleSystem.dispose(renderer)`
  releases them through the renderer's attribute cache when it can.

## Determinism

Particles are cosmetic and never feed the sim hash. GPU randomness comes from PCG `hash()`
over the thread index, a per-frame serial and the batch seed. There is no `Math.random`
anywhere in the engine, so a replayed show produces the same spawn stream given the same
frame cadence.

## Tests

| Test | Covers |
|---|---|
| `src/rendering/particles/__tests__/gpuParticleSystem.test.ts` | Kernels and sprite material compile to WGSL (Node, via the backend's node builder: `wgslTestCompiler.ts`), branch-free; dispatch sizes, cursor wrap, init gating |
| `src/rendering/particles/__tests__/laserBeams.test.ts` | Laser material with and without depth fade; beam layout, target filter, budget, gating |
| `src/rendering/particles/__tests__/particleTables.test.ts`, `particleGate.test.ts` | Budget, presets, packer, palette, gate truth table |
| `src/scenes/particles/__tests__/*.test.ts` | fxBus ring, anchors, show driver, bench |
| `e2e/gpu-particles-smoke.spec.ts` | On SwiftShader WebGPU, checks that the kernels run, a burst rises, the ring wraps with no NaNs, particles age out, and the sprite and depth-faded laser (MSAA) draws validate. Skips without an adapter |

## Acceptance: 250k at `high` ≥ 60 fps on the reference GPU

CI has no GPU (ADR 0002), so this is measured by hand:

1. `npm run build && npm run preview`. Use Chrome stable, window 1920×1080, on a 60 Hz display.
2. Record the GPU and driver from `chrome://gpu`.
3. Open `/?particleBench=1&frameBudget=1`. The bench pins the ring to 250k and keeps it
   full, using four glitter and four firework streams around the first docked ship.
4. Set quality to `high` and time to night. The overlay must show `particles 250,000`.
5. Warm up for 10 s, then wait 30 s. Read `window.__particleBench` in DevTools: `frameMsAvg`
   and `frameMsP95` cover the last 30 s, plus `spawnedPerSec`.
6. **Pass:** `frameMsAvg ≤ 16.7` (60 fps).
7. Repeat with `/?particles=0&frameBudget=1` for the baseline. That run has no bench, so use
   the overlay's p95 line instead.

### Reference GPU results

| Date | GPU / driver | Browser | Resolution | Bench avg / p95 (ms) | Baseline avg (ms) | Result |
|---|---|---|---|---|---|---|
| _pending_ | _maintainer's machine (#248)_ | Chrome stable | 1920×1080 | – | – | not yet measured |
