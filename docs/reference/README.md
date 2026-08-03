# harborglow WGSL Compute Shaders (reference material)

> **Relocated 2026-08-02** from the repo-root `shaders/` directory to `docs/reference/` during a
> pipeline-hygiene pass. These files are **not part of the build or import graph** — `god-rays-compute.wgsl`
> is referenced nowhere in `src/` (the live god-rays path is the GLSL `ShaderPass` in
> `src/shaders/GodRaysShader.ts`, wired into `PostProcessing.tsx`). They are kept as design reference for the
> future WebGPU-compute path tracked in issue #165 (WebGPU TSL materials + FFT ocean compute). The old
> top-level `shaders/` directory was removed to avoid confusion with `src/shaders/` (the actual render path).

These shaders are WebGPU compute-pipeline variants of the existing GLSL/TSL shaders in `src/shaders/lightShowNodes.ts`. They are designed to be compatible with the `image_video_effects` WGSL compute pipeline and use the standard 13-binding header.

## Files

| File | Description | extraBuffer Layout |
|------|-------------|-------------------|
| `god-rays-compute.wgsl` | Volumetric light shaft post-process | `[lightPosX, lightPosY, colorR, colorG, colorB, intensity, shaftLength, decay, exposure, shimmerSpeed]` |

## Usage

This shader is intended for future WebGPU support. The existing GLSL in `src/shaders/lightShowNodes.ts` remains the primary render path for WebGL/Three.js.

All shaders use the standard `image_video_effects` binding layout:
```wgsl
@group(0) @binding(0) var u_sampler: sampler;
@group(0) @binding(1) var readTexture: texture_2d<f32>;
@group(0) @binding(2) var writeTexture: texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var<uniform> u: Uniforms;
// ... bindings 4-12
```

Project-specific parameters are passed via `extraBuffer` (`@binding(10)`) to maintain cross-shader compatibility.
