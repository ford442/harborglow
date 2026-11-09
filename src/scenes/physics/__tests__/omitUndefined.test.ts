import { describe, expect, it } from 'vitest'
import { omitUndefined } from '../omitUndefined'

describe('omitUndefined', () => {
  it('drops only undefined-valued keys', () => {
    const nested = { a: { b: 1 } }
    const rot: [boolean, boolean, boolean] = [false, true, false]
    const out = omitUndefined({
      enabledRotations: undefined,
      mass: undefined,
      colliders: false,
      userData: null,
      gravityScale: 0,
      lockRotations: rot,
      nested,
    })
    expect(out).toEqual({ colliders: false, userData: null, gravityScale: 0, lockRotations: rot, nested })
    expect('enabledRotations' in out).toBe(false)
    expect('mass' in out).toBe(false)
    expect(out.lockRotations).toBe(rot)
    expect(out.nested).toBe(nested)
  })
})
