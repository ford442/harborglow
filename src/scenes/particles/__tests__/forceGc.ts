import v8 from 'node:v8'
import vm from 'node:vm'

/**
 * Node's `gc()` without launching with --expose-gc, for the zero-allocation
 * checks: collect, run the frame path N times, and assert the heap barely grew.
 * Returns null if the runtime refuses the flag.
 */
export function forceGc(): (() => void) | null {
  try {
    v8.setFlagsFromString('--expose_gc')
    return vm.runInNewContext('gc') as () => void
  } catch {
    return null
  }
}
