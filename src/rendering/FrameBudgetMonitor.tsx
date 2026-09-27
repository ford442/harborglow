/**
 * Dev-only frame budget overlay — frame time, draw calls, triangles, heap delta,
 * heap churn (alloc MB/s, GC/s) and React commits/sec (see CommitProfiler).
 * Enable with import.meta.env.DEV or ?frameBudget=1
 */

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { WebGLRenderer } from 'three'
import { getGpuChoresBreadcrumb } from './gpuChores'
import { createHeapChurnTracker, getCommitCounts, updateFrameBudgetSnapshot } from './frameBudgetState'

function isFrameBudgetEnabled(): boolean {
  const meta = import.meta as ImportMeta & { env?: { DEV?: boolean } }
  if (meta.env?.DEV) return true
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('frameBudget') === '1' || params.get('frameBudget') === 'true'
}

export default function FrameBudgetMonitor() {
  const { gl } = useThree()
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const frameTimesRef = useRef<number[]>([])
  const heapStartRef = useRef<number | null>(null)
  const lastUiRef = useRef(0)
  const churnRef = useRef(createHeapChurnTracker())
  const commitBaseRef = useRef<Map<string, number>>(new Map())
  const enabled = isFrameBudgetEnabled()

  useEffect(() => {
    if (!enabled) return

    const el = document.createElement('div')
    el.style.cssText =
      'position:fixed;bottom:8px;left:8px;z-index:99999;pointer-events:none;' +
      'font:11px/1.4 monospace;color:#0ff;background:rgba(0,0,0,0.72);' +
      'padding:6px 8px;border:1px solid #0aa;border-radius:4px;'
    document.body.appendChild(el)
    overlayRef.current = el
    heapStartRef.current = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize ?? null

    return () => {
      el.remove()
      overlayRef.current = null
    }
  }, [enabled])

  useFrame((_, delta) => {
    if (!enabled || !overlayRef.current) return

    // Sampled every frame so short allocation bursts / GC drops are not missed between UI refreshes
    churnRef.current.sample((performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize)

    const times = frameTimesRef.current
    times.push(delta * 1000)
    if (times.length > 120) times.shift()

    const now = performance.now()
    const windowMs = now - lastUiRef.current
    if (windowMs < 500) return
    const windowSec = lastUiRef.current === 0 ? 0 : windowMs / 1000
    lastUiRef.current = now

    // First refresh only primes the baselines (its window is unbounded)
    const churn = churnRef.current.drain()
    const allocMbPerSec = windowSec > 0 ? churn.allocatedBytes / (1024 * 1024) / windowSec : 0
    const gcPerSec = windowSec > 0 ? churn.gcEvents / windowSec : 0
    const commitsPerSec: Record<string, number> = {}
    let commitLine = ''
    getCommitCounts().forEach((total, id) => {
      const rate = windowSec > 0 ? (total - (commitBaseRef.current.get(id) ?? 0)) / windowSec : 0
      commitBaseRef.current.set(id, total)
      commitsPerSec[id] = rate
      commitLine += `${commitLine ? ' ' : ''}${id} ${rate.toFixed(0)}/s`
    })

    const avgMs = times.reduce((sum, t) => sum + t, 0) / times.length
    const maxMs = Math.max(...times)
    const renderer = gl as WebGLRenderer
    const info = renderer.info?.render
    const calls = info?.calls ?? 0
    const triangles = info?.triangles ?? 0
    const heapNow = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize
    const heapStart = heapStartRef.current
    const heapDeltaMb =
      heapNow != null && heapStart != null ? (heapNow - heapStart) / (1024 * 1024) : 0

    const chores = getGpuChoresBreadcrumb()
    const meters = chores.meters
    const meterLine =
      meters != null
        ? `  luma ${meters.mean.toFixed(2)}/${meters.max.toFixed(2)}`
        : ''

    updateFrameBudgetSnapshot({
      frameMs: avgMs,
      frameMsMax: maxMs,
      drawCalls: calls,
      triangles,
      heapDeltaMb,
      allocMbPerSec,
      gcPerSec,
      commitsPerSec,
    })

    overlayRef.current.textContent =
      `frame ${avgMs.toFixed(1)}ms (peak ${maxMs.toFixed(1)}ms)\n` +
      `draws ${calls}  tris ${triangles}\n` +
      `heap Δ ${heapDeltaMb >= 0 ? '+' : ''}${heapDeltaMb.toFixed(2)} MB  alloc ${allocMbPerSec.toFixed(2)} MB/s  gc ${gcPerSec.toFixed(1)}/s\n` +
      `commits ${commitLine || 'n/a (needs dev/profiling React build)'}\n` +
      `chores ${chores.backend}${meterLine}`
  })

  return null
}
