import { Profiler, type ReactNode } from 'react'
import { recordCommit } from './frameBudgetState'

const onRender = (id: string) => recordCommit(id)

/**
 * Counts React commits for a subtree; FrameBudgetMonitor reports them as commits/sec.
 * React only invokes Profiler callbacks in dev and profiling builds, so in a plain production
 * bundle this is inert (and costs nothing beyond the Profiler node).
 */
export function CommitProfiler({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  )
}
