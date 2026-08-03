// harborglow God Rays — WGSL Compute Pipeline Variant
// Volumetric light shaft post-process compatible with image_video_effects pipeline
// Based on dock light god-ray effect from lightShowNodes.ts
//
// extraBuffer layout:
// 0: lightPosX (0-1)     1: lightPosY (0-1)   2: colorR
// 3: colorG              4: colorB            5: intensity (0-1)
// 6: shaftLength         7: decay             8: exposure
// 9: shimmerSpeed

// --- STANDARD image_video_effects HEADER ---
@group(0) @binding(0) var u_sampler: sampler;
@group(0) @binding(1) var readTexture: texture_2d<f32>;
@group(0) @binding(2) var writeTexture: texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var<uniform> u: Uniforms;
@group(0) @binding(4) var readDepthTexture: texture_2d<f32>;
@group(0) @binding(5) var non_filtering_sampler: sampler;
@group(0) @binding(6) var writeDepthTexture: texture_storage_2d<r32float, write>;
@group(0) @binding(7) var dataTextureA: texture_storage_2d<rgba32float, write>;
@group(0) @binding(8) var dataTextureB: texture_storage_2d<rgba32float, write>;
@group(0) @binding(9) var dataTextureC: texture_2d<f32>;
@group(0) @binding(10) var<storage, read_write> extraBuffer: array<f32>;
@group(0) @binding(11) var comparison_sampler: sampler_comparison;
@group(0) @binding(12) var<storage, read> plasmaBuffer: array<vec4<f32>>;
// ---------------------------------------------

struct Uniforms {
  config: vec4<f32>,       // x=Time, y=Generic1, z=ResX, w=ResY
  zoom_config: vec4<f32>,  // x=ZoomTime, y=MouseX, z=MouseY, w=Generic2
  zoom_params: vec4<f32>,  // x=Param1, y=Param2, z=Param3, w=Param4
  ripples: array<vec4<f32>, 50>,
};

fn hash12(p: vec2<f32>) -> f32 {
    var p3 = fract(vec3<f32>(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

fn noise2D(p: vec2<f32>) -> f32 {
    let i = floor(p);
    var f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    let a = hash12(i);
    let b = hash12(i + vec2<f32>(1.0, 0.0));
    let c = hash12(i + vec2<f32>(0.0, 1.0));
    let d = hash12(i + vec2<f32>(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Radial light shaft sampling
fn sampleShaft(uv: vec2<f32>, lightPos: vec2<f32>, samples: i32, decay: f32) -> f32 {
    let delta = uv - lightPos;
    var illum = 0.0;
    var weight = 1.0;
    var pos = lightPos;
    for (var i: i32 = 0; i < samples; i = i + 1) {
        pos = pos + delta;
        let sampleCol = textureSampleLevel(readTexture, u_sampler, pos, 0.0).rgb;
        let brightness = dot(sampleCol, vec3<f32>(0.299, 0.587, 0.114));
        illum = illum + brightness * weight;
        weight = weight * decay;
    }
    return illum / f32(samples);
}

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let resolution = u.config.zw;
    if (global_id.x >= u32(resolution.x) || global_id.y >= u32(resolution.y)) { return; }
    let uv = vec2<f32>(global_id.xy) / resolution;
    let time = u.config.x;

    let lightPos = vec2<f32>(extraBuffer[0], extraBuffer[1]);
    let lightColor = vec3<f32>(extraBuffer[2], extraBuffer[3], extraBuffer[4]);
    let intensity = extraBuffer[5];
    let shaftLength = extraBuffer[6];
    let decay = extraBuffer[7];
    let exposure = extraBuffer[8];
    let shimmerSpeed = extraBuffer[9];

    if (intensity < 0.001) {
        textureStore(writeTexture, vec2<i32>(global_id.xy), vec4<f32>(0.0));
        return;
    }

    // Distance from light source
    let distFromLight = length(uv - lightPos);
    let direction = normalize(uv - lightPos);

    // Sample light shafts
    let shaftSamples = 32;
    let shaftIllum = sampleShaft(uv, lightPos, shaftSamples, decay);

    // Base cone falloff (brighter near light, fades with distance)
    let coneFalloff = exp(-distFromLight * shaftLength * 3.0);

    // Animated shimmer
    let shimmer = 0.8 + 0.2 * sin(time * shimmerSpeed + distFromLight * 8.0);

    // Noise-based volumetric dust
    let dustUV = uv * 20.0 + vec2<f32>(time * 0.1, time * 0.05);
    let dust = noise2D(dustUV) * noise2D(dustUV * 2.0 + 50.0);
    let dustIllum = pow(dust, 2.0) * 2.0 * coneFalloff;

    // Combine
    var finalIllum = shaftIllum * coneFalloff * shimmer + dustIllum * 0.3;
    finalIllum = finalIllum * exposure;

    let col = lightColor * finalIllum * intensity;
    let alpha = clamp(finalIllum * intensity, 0.0, 1.0);

    textureStore(writeTexture, vec2<i32>(global_id.xy), vec4<f32>(col, alpha));
}
