import type { CSSProperties } from 'react'
import { GLASSMORPHISM, TYPOGRAPHY } from './DesignSystem'
import type { WebgpuProbePublic } from '../rendering/webgpuProbe'

interface WebGPUFatalOverlayProps {
  /** Null while the boot probe is still running. */
  probe: WebgpuProbePublic | null
}

/**
 * Blocking boot UI. Shown instead of the R3F canvas when WebGPU is missing
 * or the boot probe failed. There is no WebGL scene rescue this phase.
 */
export default function WebGPUFatalOverlay({ probe }: WebGPUFatalOverlayProps) {
  if (!probe) {
    return (
      <div style={containerStyle} data-testid="webgpu-boot-checking">
        <div style={contentStyle}>
          <h1 style={titleStyle}>Checking WebGPU</h1>
          <p style={descriptionStyle}>Probing adapter, device, and canvas configure.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle} data-testid="webgpu-fatal-overlay">
      <div style={contentStyle}>
        <div style={iconContainerStyle}>
          <span style={iconStyle} aria-hidden>
            !
          </span>
        </div>
        <h1 style={titleStyle}>WebGPU required</h1>
        <p style={descriptionStyle}>
          HarborGlow will not start a WebGL scene. Use Chrome or Edge with WebGPU
          enabled. Force-GL URL flags are disabled this phase.
        </p>
        <p style={metaStyle}>
          Browser: {probe.browser.brand}
          {probe.browser.version ? ` ${probe.browser.version}` : ''}
        </p>
        <p style={metaStyle}>Reason: {probe.reason ?? 'unknown'}</p>
        <pre style={preStyle} data-testid="webgpu-probe-json">
          {JSON.stringify(probe, null, 2)}
        </pre>
        <button type="button" onClick={() => window.location.reload()} style={buttonStyle}>
          Reload
        </button>
      </div>
    </div>
  )
}

const containerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'linear-gradient(135deg, #0a0f14 0%, #0a0a15 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 99999,
  padding: '24px',
  overflow: 'auto',
  pointerEvents: 'auto',
}

const contentStyle: CSSProperties = {
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  WebkitBackdropFilter: GLASSMORPHISM.backdropFilter,
  borderRadius: GLASSMORPHISM.borderRadius,
  border: GLASSMORPHISM.border,
  boxShadow: GLASSMORPHISM.boxShadowGlow('#00d4aa'),
  padding: '32px',
  maxWidth: '640px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '16px',
}

const iconContainerStyle: CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  background: 'rgba(0, 212, 170, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid rgba(0, 212, 170, 0.35)',
}

const iconStyle: CSSProperties = {
  fontSize: '36px',
  color: '#00d4aa',
  fontWeight: 700,
  fontFamily: TYPOGRAPHY.fontFamily,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 700,
  color: '#00d4aa',
  fontFamily: TYPOGRAPHY.fontFamily,
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: 'rgba(255,255,255,0.75)',
  lineHeight: 1.6,
}

const metaStyle: CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
  fontFamily: TYPOGRAPHY.fontFamilyMono,
}

const preStyle: CSSProperties = {
  margin: 0,
  width: '100%',
  textAlign: 'left',
  padding: '16px',
  background: 'rgba(0,0,0,0.5)',
  color: '#9effe6',
  fontSize: '11px',
  fontFamily: TYPOGRAPHY.fontFamilyMono,
  overflow: 'auto',
  maxHeight: '280px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
}

const buttonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '14px 24px',
  background: 'linear-gradient(135deg, #00d4aa, #00ffb8)',
  border: 'none',
  borderRadius: '10px',
  color: '#000',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
}
