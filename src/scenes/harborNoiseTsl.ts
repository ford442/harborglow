import { mx_noise_float, vec2, vec3 } from 'three/tsl'

export function harborSnoise(p: ReturnType<typeof vec2>) {
  return mx_noise_float(vec3(p.x, p.y, 0))
}

export function harborFbm(p: ReturnType<typeof vec2>) {
  const p2 = vec2(p.x.mul(2), p.y.mul(2))
  const p4 = vec2(p.x.mul(4), p.y.mul(4))
  const p8 = vec2(p.x.mul(8), p.y.mul(8))
  return harborSnoise(p)
    .mul(0.5)
    .add(harborSnoise(p2).mul(0.25))
    .add(harborSnoise(p4).mul(0.125))
    .add(harborSnoise(p8).mul(0.0625))
}
