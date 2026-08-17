/**
 * Rolling frame-time / GPU stats for dev overlay.
 */

export interface FrameBudgetSnapshot {
  frameMs: number
  frameMsMax: number
  drawCalls: number
  triangles: number
  heapDeltaMb: number
}

const empty: FrameBudgetSnapshot = {
  frameMs: 0,
  frameMsMax: 0,
  drawCalls: 0,
  triangles: 0,
  heapDeltaMb: 0,
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
