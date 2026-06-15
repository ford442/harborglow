import * as THREE from 'three';
import { ShipType } from '../../store/useGameStore';
import { GLASSMORPHISM, SHIP_COLORS } from '../DesignSystem';

export function drawCraneCabView(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  craneState: any,
  ship: any,
  audioData: any
) {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#0d1a2e')
  gradient.addColorStop(0.5, '#1a2a40')
  gradient.addColorStop(1, '#0d1520')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // Ship silhouette
  if (ship) {
    ctx.fillStyle = '#1a2a35'
    ctx.fillRect(w * 0.3, h * 0.6, w * 0.4, h * 0.2)

    // Ship lights pulsing to music
    const pulse = 1 + audioData.bass * 0.5
    ctx.fillStyle = `rgba(0, 212, 170, ${0.5 * pulse})`
    ctx.beginPath()
    ctx.arc(w * 0.35, h * 0.65, 4 * pulse, 0, Math.PI * 2)
    ctx.fill()
  }

  // Crane structure
  ctx.strokeStyle = '#2a3a45'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(w * 0.1, h)
  ctx.lineTo(w * 0.15, h * 0.3)
  ctx.lineTo(w * 0.85, h * 0.3)
  ctx.lineTo(w * 0.9, h)
  ctx.stroke()

  // Spreader position indicator
  const spreaderX = w * 0.5 + (craneState.spreaderPos.x / 30) * w * 0.3
  const spreaderY = h * 0.4 + ((15 - craneState.spreaderPos.y) / 15) * h * 0.3

  ctx.strokeStyle = '#00d4aa'
  ctx.lineWidth = 2
  ctx.strokeRect(spreaderX - 15, spreaderY - 10, 30, 20)

  // Cable line
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w * 0.5, h * 0.3)
  ctx.lineTo(spreaderX, spreaderY - 10)
  ctx.stroke()
}

export function drawHookView(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  craneState: any,
  audioData: any
) {
  // Dark background
  ctx.fillStyle = '#0a0a15'
  ctx.fillRect(0, 0, w, h)

  // Target area below
  const gradient = ctx.createLinearGradient(0, h * 0.5, 0, h)
  gradient.addColorStop(0, '#0d1520')
  gradient.addColorStop(1, '#1a2a35')
  ctx.fillStyle = gradient
  ctx.fillRect(0, h * 0.5, w, h * 0.5)

  // Spreader beam
  ctx.fillStyle = '#3a4a55'
  ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, 8)

  // Twistlock indicators
  const locked = craneState.twistlockEngaged
  ctx.fillStyle = locked ? '#00ff00' : '#ff4757'
  ctx.fillRect(w * 0.32, h * 0.22, 8, 12)
  ctx.fillRect(w * 0.66, h * 0.22, 8, 12)

  // Container corner guides
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'
  ctx.setLineDash([5, 5])
  ctx.strokeRect(w * 0.25, h * 0.6, w * 0.5, h * 0.25)
  ctx.setLineDash([])

  // Music reactivity - pulsing alignment guides
  const pulse = audioData.bass * 10
  ctx.strokeStyle = `rgba(0, 212, 170, ${0.3 + audioData.bass * 0.3})`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w * 0.5, h * 0.3 - pulse)
  ctx.lineTo(w * 0.5, h * 0.3 + pulse)
  ctx.stroke()
}

export function drawDroneView(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ships: any[],
  currentShip: any,
  audioData: any
) {
  // Aerial view background
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#0d1a2e')
  gradient.addColorStop(1, '#1a3a50')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // Water
  ctx.fillStyle = '#0d2535'
  ctx.fillRect(0, h * 0.4, w, h * 0.6)

  // Dock
  ctx.fillStyle = '#2a3a45'
  ctx.fillRect(w * 0.2, h * 0.35, w * 0.6, h * 0.1)

  // Ships
  ships.forEach((ship, i) => {
    const x = w * (0.3 + i * 0.2)
    const y = h * 0.45
    const color = SHIP_COLORS[ship.type as keyof typeof SHIP_COLORS]?.primary || '#00d4aa'

    // Ship body
    ctx.fillStyle = '#1a2a35'
    ctx.fillRect(x - 20, y - 8, 40, 16)

    // Ship glow
    const pulse = 1 + audioData.mid * 0.3
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 3 * pulse, 0, Math.PI * 2)
    ctx.fill()
  })

  // Drone flight path indicator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.5, w * 0.35, h * 0.3, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

export function drawUnderwaterView(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ship: any,
  audioData: any
) {
  // Deep blue gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#051525')
  gradient.addColorStop(1, '#0a2040')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // God rays from above
  for (let i = 0; i < 5; i++) {
    const rayGradient = ctx.createLinearGradient(w * (0.2 + i * 0.15), 0, w * (0.2 + i * 0.15), h * 0.6)
    rayGradient.addColorStop(0, 'rgba(0, 170, 255, 0.15)')
    rayGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = rayGradient
    ctx.fillRect(w * (0.15 + i * 0.15), 0, w * 0.08, h * 0.7)
  }

  // Ship hull glow from lights
  if (ship) {
    const pulse = 1 + audioData.bass * 0.4
    const shipGradient = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.3)
    shipGradient.addColorStop(0, `rgba(0, 212, 170, ${0.3 * pulse})`)
    shipGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = shipGradient
    ctx.fillRect(0, 0, w, h)
  }

  // Bubbles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  for (let i = 0; i < 20; i++) {
    const x = (i * 37) % w
    const y = (i * 23 + Date.now() * 0.02) % h
    ctx.beginPath()
    ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 2)
  }
}
