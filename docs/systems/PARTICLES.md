# GPU particles and lasers

Slice 2 of the Light Show Director epic (#236 / #248). WebGPU compute only.
There is no CPU particle fallback.

## Budget

Drawn counts come from the store quality preset (`src/rendering/particles/particleBudget.ts`):

| Preset | Drawn particles |
|---|---|
| `high` | 250_000 |
| `medium` | 80_000 |
| `low` | 30_000 |

The compute dispatch is rounded up to a workgroup of 64. The sprite's `count` stays the drawn budget. Lasers are a separate instanced mesh, capped at 32, and are not part of that pool.

A preset change rebuilds the buffers once. The frame path does not.

## State

Particle position (xyz + life), velocity, and color live in `instancedArray` storage buffers. The kernel is one thread per particle (`Fn` + `instanceIndex`), dispatched with `renderer.compute` after a one-time `computeAsync` clear.

Emitters are a fixed 64-row table (`src/scenes/particles/fxBus.ts`), not particles. Each row is world position, direction, color, kind (`firework` = 0, `laser` = 1), and intensity. Fireworks are packed in front so the kernel can modulo that count. Kinds 2 and 3 are reserved for mist and ice glitter.

The table is copied into a storage buffer once per frame. Beat uniforms (`bass`, `mid`, `treble`, `beatPhase`) are written once per frame from `getAudioAnalysisData()` — the layer does not call `analyze()` again. Bass scales firework speed and size. Mid adds a small spawn drift. Treble and beat phase scale laser intensity.

## Binding

While `lightingSystem.getCurrentShow()` is active, the layer reads that ship's attachment points with `useGameStore.getState()` (no per-frame subscription). World position is the ship origin plus the point's local offset. Cue `target` keeps matching rig groups; `'all'` keeps every point. Mast, gantry, and part names containing `searchlight` are lasers. Everything else is a firework.

`spawnBurst(position, color)` parks an install spark in an 8-slot ring (2 seconds). It does not allocate.

## Lasers

Additive TSL cylinders (`src/rendering/particles/laserMaterial.ts`). The fragment fades with `linearDepth(viewportDepthTexture())` against the fragment's linear depth — the scene depth the god-ray pass reads later via `scenePass.getTextureNode('depth')`. The mesh cannot sample that post-pass node. The viewport depth copy is not a storage texture.

## Device gate

`canUseGpuParticles()` matches the ocean gate: probe `compute === 'passed'`, `computeAsync` present, adopted device, and `?no_gpu_compute=1` disables the layer. `probe.grantedFeatures` is read. `float32-filterable` is not required, because this path does not allocate a float storage texture (three #33147 on 0.183). When the gate is false the layer renders nothing.

The kernel does not use TSL `Loop` or `select` (three #33650 diverges on Lavapipe). Respawn weights with `step`. The sprite count drops to 0 when nothing is emitting, so an idle harbor does not draw the pool. A running show draws the full budget.

## 60 fps check

CI cannot time this. On an RTX 3060-class GPU, with quality `high` and a show running, `?frameBudget=1` should hold `frameMs` ≤ 16.6 at the 250k pool.
