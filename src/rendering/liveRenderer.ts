import type { Renderer as FiberRenderer } from '@react-three/fiber'

let live: FiberRenderer | null = null

export function setLiveRenderer(renderer: FiberRenderer | null): void {
  live = renderer
}

export function getLiveRenderer(): FiberRenderer | null {
  return live
}
