// =============================================================================
// SHIP MODEL BOUNDARY — one ship's broken GLB must never blank the harbor
//
// <Suspense> only covers the *pending* case. A GLB that 404s mid-session, fails
// to parse, or throws during decode surfaces as a render error, which without a
// boundary unmounts the whole R3F tree. This catches it per-ship and renders the
// procedural hull instead.
// =============================================================================

import { Component, type ReactNode } from 'react'

export interface ShipModelBoundaryProps {
  /** Ship type — used for the one-time console warning. */
  shipType: string
  /** Procedural hull rendered when the GLB fails. */
  fallback: ReactNode
  /** Notified once per failure so callers can mark the model unavailable. */
  onError?: (error: Error) => void
  children: ReactNode
}

interface ShipModelBoundaryState {
  failed: boolean
}

export class ShipModelBoundary extends Component<ShipModelBoundaryProps, ShipModelBoundaryState> {
  state: ShipModelBoundaryState = { failed: false }

  static getDerivedStateFromError(): ShipModelBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.warn(`🚢 GLB hull failed for "${this.props.shipType}" — using procedural fallback`, error)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

export default ShipModelBoundary
