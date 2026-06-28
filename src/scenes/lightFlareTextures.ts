// =============================================================================
// LIGHT FLARE TEXTURES — procedural canvas sprites (no external assets)
// =============================================================================

import * as THREE from 'three'

export type FlareTextureSet = {
  core: THREE.Texture
  ring: THREE.Texture
  streak: THREE.Texture
  star: THREE.Texture
  dirt: THREE.Texture
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  draw(ctx)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  return tex
}

function radialCore(ctx: CanvasRenderingContext2D, w: number, h: number, inner: string, outer: string) {
  const cx = w / 2
  const cy = h / 2
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.48)
  g.addColorStop(0, inner)
  g.addColorStop(0.35, 'rgba(255,240,200,0.55)')
  g.addColorStop(0.7, 'rgba(255,180,80,0.15)')
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function drawRing(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  ctx.clearRect(0, 0, w, h)
  const g = ctx.createRadialGradient(cx, cy, w * 0.22, cx, cy, w * 0.48)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.55, 'rgba(255,220,160,0.35)')
  g.addColorStop(0.75, 'rgba(255,180,100,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, w * 0.46, 0, Math.PI * 2)
  ctx.fill()
}

function drawStreak(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  const g = ctx.createLinearGradient(0, cy, w, cy)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.35, 'rgba(255,230,180,0.08)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.65, 'rgba(255,230,180,0.08)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, cy - h * 0.08, w, h * 0.16)
  const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.12)
  vg.addColorStop(0, 'rgba(255,255,255,0.9)')
  vg.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

function drawStar(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  radialCore(ctx, w, h, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)')
  ctx.globalCompositeOperation = 'lighter'
  ctx.strokeStyle = 'rgba(255,245,220,0.75)'
  ctx.lineWidth = w * 0.018
  const rays = 8
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a) * w * 0.46, cy + Math.sin(a) * w * 0.46)
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'
}

function drawDirt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  for (let i = 0; i < 24; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = 2 + Math.random() * 8
    ctx.fillStyle = `rgba(40,30,20,${0.02 + Math.random() * 0.06})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

let cachedTextures: FlareTextureSet | null = null

export function getFlareTextures(): FlareTextureSet {
  if (cachedTextures) return cachedTextures
  cachedTextures = {
    core: canvasTexture(256, 256, (ctx) => radialCore(ctx, 256, 256, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)')),
    ring: canvasTexture(256, 256, (ctx) => drawRing(ctx, 256, 256)),
    streak: canvasTexture(512, 128, (ctx) => drawStreak(ctx, 512, 128)),
    star: canvasTexture(256, 256, (ctx) => drawStar(ctx, 256, 256)),
    dirt: canvasTexture(512, 512, (ctx) => drawDirt(ctx, 512, 512)),
  }
  return cachedTextures
}
