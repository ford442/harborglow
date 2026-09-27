/**
 * Rolling frame-time / GPU stats for dev overlay.
 */

export interface FrameBudgetSnapshot {
  frameMs: number
  frameMsMax: number
  drawCalls: number
  triangles: number
  heapDeltaMb: number
  /** JS heap bytes allocated per second (sum of positive heap growth between samples; approximate). */
  allocMbPerSec: number
  /** Heap drops >= the tracker threshold per second (proxy for GC cycles). */
  gcPerSec: number
  /** React commits per second per <CommitProfiler id>. Only fires in dev / profiling React builds. */
  commitsPerSec: Record<string, number>
}

const empty: FrameBudgetSnapshot = {
  frameMs: 0,
  frameMsMax: 0,
  drawCalls: 0,
  triangles: 0,
  heapDeltaMb: 0,
  allocMbPerSec: 0,
  gcPerSec: 0,
  commitsPerSec: {},
}

let snapshot: FrameBudgetSnapshot = { ...empty }
const listeners = new Set<() => void>()

export function getFrameBudgetSnapshot(): Readonly<FrameBudgetSnapshot> {
  return snapshot
}

export function updateFrameBudgetSnapshot(partial: Partial<FrameBudgetSnapshot>): void {
  snapshot = { ...snapshot, ...partial }
  listeners.forEach((fn) => fn())
}

export function subscribeFrameBudget(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function resetFrameBudgetSnapshot(): void {
  snapshot = { ...empty }
  listeners.forEach((fn) => fn())
}

/**
 * Heap churn from successive `performance.memory.usedJSHeapSize` samples: growth is treated as
 * allocation, a drop of at least `gcThresholdBytes` as a GC. Chrome quantises this counter, so
 * treat the numbers as relative (before/after), not absolute.
 */
export function createHeapChurnTracker(gcThresholdBytes = 256 * 1024) {
  let last: number | null = null
  let allocatedBytes = 0
  let gcEvents = 0
  return {
    sample(heapBytes: number | undefined): void {
      if (heapBytes == null) return
      if (last != null) {
        const d = heapBytes - last
        if (d > 0) allocatedBytes += d
        else if (-d >= gcThresholdBytes) gcEvents++
      }
      last = heapBytes
    },
    /** Returns totals since the previous drain and resets them. */
    drain(): { allocatedBytes: number; gcEvents: number } {
      const out = { allocatedBytes, gcEvents }
      allocatedBytes = 0
      gcEvents = 0
      return out
    },
  }
}

const commitCounts = new Map<string, number>()

export function recordCommit(id: string): void {
  commitCounts.set(id, (commitCounts.get(id) ?? 0) + 1)
}

export function getCommitCounts(): ReadonlyMap<string, number> {
  return commitCounts
}

export function resetCommitCounts(): void {
  commitCounts.clear()
}
