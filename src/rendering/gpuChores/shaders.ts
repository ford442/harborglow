/** WGSL compute helpers. Image jobs use (8,8); reduce uses (64). */

export const LUMA_HISTOGRAM_BT709_WGSL = /* wgsl */ `
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> bins: array<atomic<u32>>;

const LUMA = vec3<f32>(0.2126, 0.7152, 0.0722);

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dims = textureDimensions(src);
  if (gid.x >= dims.x || gid.y >= dims.y) { return; }
  let color = textureLoad(src, vec2<i32>(gid.xy), 0).rgb;
  let y = clamp(dot(color, LUMA), 0.0, 1.0);
  let bin = u32(y * 255.0);
  atomicAdd(&bins[bin], 1u);
}
`

export const DOWNSAMPLE_2D_WGSL = /* wgsl */ `
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let outDims = textureDimensions(dst);
  if (gid.x >= outDims.x || gid.y >= outDims.y) { return; }
  let srcDims = textureDimensions(src);
  let x0 = i32(gid.x * srcDims.x / outDims.x);
  let y0 = i32(gid.y * srcDims.y / outDims.y);
  let x1 = max(x0 + 1, i32((gid.x + 1u) * srcDims.x / outDims.x));
  let y1 = max(y0 + 1, i32((gid.y + 1u) * srcDims.y / outDims.y));
  var acc = vec4<f32>(0.0);
  var n = 0.0;
  for (var y = y0; y < y1; y = y + 1) {
    for (var x = x0; x < x1; x = x + 1) {
      acc = acc + textureLoad(src, vec2<i32>(x, y), 0);
      n = n + 1.0;
    }
  }
  textureStore(dst, vec2<i32>(gid.xy), acc / max(n, 1.0));
}
`

export const SEPARABLE_BLUR_WGSL = /* wgsl */ `
struct BlurParams {
  dir: vec2<i32>,
}

@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var<uniform> params: BlurParams;

const WEIGHTS = array<f32, 5>(0.0625, 0.25, 0.375, 0.25, 0.0625);

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dims = textureDimensions(dst);
  if (gid.x >= dims.x || gid.y >= dims.y) { return; }
  let srcDims = vec2<i32>(textureDimensions(src));
  var acc = vec4<f32>(0.0);
  for (var t = -2; t <= 2; t = t + 1) {
    let sx = clamp(i32(gid.x) + t * params.dir.x, 0, srcDims.x - 1);
    let sy = clamp(i32(gid.y) + t * params.dir.y, 0, srcDims.y - 1);
    acc = acc + textureLoad(src, vec2<i32>(sx, sy), 0) * WEIGHTS[t + 2];
  }
  textureStore(dst, vec2<i32>(gid.xy), acc);
}
`

export const REDUCE_WGSL = /* wgsl */ `
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> out_vals: array<atomic<u32>>;

const LUMA = vec3<f32>(0.2126, 0.7152, 0.0722);

@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dims = textureDimensions(src);
  let n = dims.x * dims.y;
  if (gid.x >= n) { return; }
  let x = gid.x % dims.x;
  let y = gid.x / dims.x;
  let color = textureLoad(src, vec2<i32>(i32(x), i32(y)), 0).rgb;
  let y709 = clamp(dot(color, LUMA), 0.0, 1.0);
  atomicAdd(&out_vals[0], u32(y709 * 1000.0));
  atomicMax(&out_vals[1], u32(y709 * 1000.0));
  atomicAdd(&out_vals[2], 1u);
}
`
