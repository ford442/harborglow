# harborglow WGSL Compute Shaders

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
