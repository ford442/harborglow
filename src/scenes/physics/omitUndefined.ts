/**
 * Drop keys whose value is exactly `undefined`. `null`, `false` (e.g.
 * `colliders={false}`), `0` and objects pass through untouched.
 */
export function omitUndefined<T extends object>(props: T): T {
  const out = {} as T
  for (const key of Object.keys(props) as (keyof T)[]) {
    if (props[key] !== undefined) out[key] = props[key]
  }
  return out
}
