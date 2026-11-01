import type { CSSProperties } from 'react'

// Dark-glass styling shared by the cue editor; inline objects like the cabin UI.

export const ACCENT = '#5fd4ff'

export const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 300,
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(4,8,16,0.94)',
  color: '#d8e6f0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  pointerEvents: 'auto',
}

export const header: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 16px',
  borderBottom: '1px solid rgba(95,212,255,0.25)',
}

export const toolbar: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px 14px',
  padding: '8px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}

export const group: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }

export const label: CSSProperties = { color: '#7f93a3', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }

export const control: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: '#d8e6f0',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 4,
  padding: '3px 6px',
  font: 'inherit',
}

export function button(active = false, disabled = false): CSSProperties {
  return {
    ...control,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    padding: '4px 10px',
    borderColor: active ? ACCENT : 'rgba(255,255,255,0.18)',
    color: active ? ACCENT : '#d8e6f0',
    background: active ? 'rgba(95,212,255,0.12)' : 'rgba(255,255,255,0.06)',
  }
}

export const swatch = (color: string, active: boolean): CSSProperties => ({
  width: 18,
  height: 18,
  borderRadius: 4,
  background: color,
  border: active ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
  padding: 0,
  cursor: 'pointer',
})

export const canvasHost: CSSProperties = { flex: 1, minHeight: 0, position: 'relative', padding: 12 }

export const statusBar: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '6px 16px',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  color: '#7f93a3',
}
