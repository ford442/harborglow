// =============================================================================
// OCEAN FFT WGSL — Stockham butterflies + centre-shift pack (in-tree radix-2)
//
// Algorithm matches `src/systems/ocean/stockham2d.ts`. Unnormalised inverse
// uses e^(+iθ). After both axes, pack applies the (−1)^(row+col) centre shift
// and amplitude/choppiness so the sampled texture agrees with OceanFFTField.
// =============================================================================

export const OCEAN_FFT_WORKGROUP = 8

export const OCEAN_FFT_BUTTERFLY_WGSL = /* wgsl */ `
struct Params {
  n: u32,
  stage: u32,
  axis: u32,
  inverse: u32,
};

@group(0) @binding(0) var<storage, read> src: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> dst: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> params: Params;

fn line_index(line: u32, pos: u32, n: u32, axis: u32) -> u32 {
  if (axis == 0u) {
    return line * n + pos;
  }
  return pos * n + line;
}

fn mul_complex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let n = params.n;
  if (gid.x >= n || gid.y >= n) { return; }

  let i = select(gid.x, gid.y, params.axis == 1u);
  let line = select(gid.y, gid.x, params.axis == 1u);

  let n1 = 1u << params.stage;
  let block = i >> (params.stage + 1u);
  let j = i & (n1 - 1u);
  let is_upper = (i & n1) != 0u;
  let src0 = block * n1 + j;
  let src1 = src0 + (n >> 1u);

  let a = src[line_index(line, src0, n, params.axis)];
  let b = src[line_index(line, src1, n, params.axis)];
  let span = f32(n1 << 1u);
  let sign = select(-1.0, 1.0, params.inverse != 0u);
  let theta = sign * 6.283185307179586 * f32(j) / span;
  let w = vec2<f32>(cos(theta), sin(theta));
  let tb = mul_complex(w, b);
  let out_val = select(a + tb, a - tb, is_upper);
  dst[line_index(line, i, n, params.axis)] = out_val;
}
`

export const OCEAN_FFT_PACK_WGSL = /* wgsl */ `
struct PackParams {
  n: u32,
  amplitude: f32,
  choppiness: f32,
  _pad: u32,
};

@group(0) @binding(0) var<storage, read> height: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> disp: array<vec2<f32>>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var<uniform> params: PackParams;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let n = params.n;
  if (gid.x >= n || gid.y >= n) { return; }
  let idx = gid.y * n + gid.x;
  let odd = ((gid.x + gid.y) & 1u) == 1u;
  let sign = select(1.0, -1.0, odd);
  let h = height[idx];
  let d = disp[idx];
  let scale_h = sign * params.amplitude;
  let scale_d = scale_h * params.choppiness;
  textureStore(
    dst,
    vec2<i32>(i32(gid.x), i32(gid.y)),
    vec4<f32>(d.x * scale_d, h.x * scale_h, d.y * scale_d, 1.0),
  );
}
`
