/**
 * Dev-only frame budget overlay — frame time, draw calls, triangles, heap delta.
 * Enable with import.meta.env.DEV or ?frameBudget=1
 */

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { WebGLRenderer } from 'three'
import { getGpuChoresBreadcrumb } from './gpuChores'

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

    const times = frameTimesRef.current
    times.push(delta * 1000)
    if (times.length > 120) times.shift()

    const now = performance.now()
    if (now - lastUiRef.current < 500) return
    lastUiRef.current = now

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

    overlayRef.current.textContent =
      `frame ${avgMs.toFixed(1)}ms (peak ${maxMs.toFixed(1)}ms)\n` +
      `draws ${calls}  tris ${triangles}\n` +
      `heap Δ ${heapDeltaMb >= 0 ? '+' : ''}${heapDeltaMb.toFixed(2)} MB\n` +
      `chores ${chores.backend}${meterLine}`
  })

  return null
}
