import { RigidBody as RapierRigidBodyComponent, type RigidBodyProps } from '@react-three/rapier'
import { omitUndefined } from './omitUndefined'

/**
 * `RigidBody` that never hands rapier an `undefined`-valued prop.
 *
 * @react-three/rapier 2.2 `setRigidBodyOptions` runs every mutable handler whose
 * key is `in` props, so `enabledRotations={undefined}` throws
 * `undefined is not iterable` on bodies mounted after the world exists (PR #273),
 * and other keys get garbage written. Import `RigidBody` from here, not rapier
 * (enforced by `no-restricted-imports` in eslint.config.js).
 *
 * Limitation: a prop that changes from a value to `undefined` keeps its old
 * value in rapier (the key is dropped, not reset).
 */
export function RigidBody(props: RigidBodyProps) {
  return <RapierRigidBodyComponent {...omitUndefined(props)} />
}
