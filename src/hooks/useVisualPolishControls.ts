// =============================================================================
// VISUAL POLISH — centralized Leva folder for live look-dev tuning
// =============================================================================

import { useState } from 'react'
import { useControls, button } from 'leva'
import {
  getLookDevSettings,
  setLookDevSettings,
  resetLookDevSettings,
  type LookDevSettings,
} from '../utils/lookDevControls'

type ControlKey = keyof LookDevSettings

function bind<K extends ControlKey>(
  key: K,
  folder: string,
  schema: Record<string, unknown>
): Record<string, unknown> {
  const initial = getLookDevSettings()[key]
  return {
    [key]: {
      ...schema,
      value: initial,
      folder,
      onChange: (v: LookDevSettings[K]) => setLookDevSettings({ [key]: v }),
    },
  }
}

/**
 * Mount once in MainScene (or App during game). Folder opens uncollapsed in Leva.
 * Tweaks persist to localStorage; Reset restores defaults and refreshes control bindings.
 */
export function useVisualPolishControls(): void {
  const [resetToken, setResetToken] = useState(0)

  useControls(
    'Visual Polish',
    {
      ...bind('surfaceWetness', 'Surfaces', {
        label: 'Surface Wetness',
        min: 0,
        max: 2,
        step: 0.05,
      }),
      ...bind('dockWoodRoughness', 'Surfaces', {
        label: 'Dock Wood Roughness',
        min: 0.5,
        max: 1.5,
        step: 0.05,
      }),
      ...bind('metalScuff', 'Surfaces', {
        label: 'Metal Scuff / Rust',
        min: 0,
        max: 2,
        step: 0.05,
      }),
      ...bind('puddleStrength', 'Surfaces', {
        label: 'Puddle Strength',
        min: 0,
        max: 2,
        step: 0.05,
      }),

      ...bind('flaresEnabled', 'Flares & Glow', { label: 'Flares Enabled' }),
      ...bind('flareIntensity', 'Flares & Glow', {
        label: 'Flare Intensity',
        min: 0,
        max: 2,
        step: 0.05,
      }),
      ...bind('flareSize', 'Flares & Glow', {
        label: 'Flare Size',
        min: 0.3,
        max: 2.5,
        step: 0.05,
      }),
      ...bind('flareThreshold', 'Flares & Glow', {
        label: 'Flare Axis Threshold',
        min: 0.5,
        max: 8,
        step: 0.1,
      }),
      ...bind('flareDirt', 'Flares & Glow', { label: 'Lens Dirt' }),
      ...bind('flareAnamorphic', 'Flares & Glow', { label: 'Anamorphic Streaks' }),
      ...bind('bloomExtra', 'Flares & Glow', {
        label: 'Bloom Extra',
        min: 0,
        max: 1.5,
        step: 0.05,
      }),
      ...bind('rigEmissiveBoost', 'Flares & Glow', {
        label: 'Rig Emissive Boost',
        min: 0,
        max: 2.5,
        step: 0.05,
      }),

      ...bind('sparkDensity', 'Light Rigs', {
        label: 'Spark Density',
        min: 0,
        max: 2,
        step: 0.05,
      }),
      ...bind('rigPulseAmount', 'Light Rigs', {
        label: 'Rig Pulse Amount',
        min: 0,
        max: 2,
        step: 0.05,
      }),
      ...bind('rigColorTempShift', 'Light Rigs', {
        label: 'Color Temp Shift',
        min: -1,
        max: 1,
        step: 0.05,
      }),

      ...bind('craneSheen', 'Crane & Cable', {
        label: 'Crane Light Sheen',
        min: 0,
        max: 2,
        step: 0.05,
      }),
      ...bind('craneWear', 'Crane & Cable', {
        label: 'Crane Metal Wear',
        min: 0.5,
        max: 2,
        step: 0.05,
      }),
      ...bind('cableTensionHighlight', 'Crane & Cable', {
        label: 'Cable Tension Highlight',
        min: 0,
        max: 2,
        step: 0.05,
      }),

      ...bind('envMapIntensity', 'Global', {
        label: 'Env Map Intensity',
        min: 0,
        max: 2,
        step: 0.05,
      }),
      ...bind('filmGrainScale', 'Global', {
        label: 'Film Grain Scale',
        min: 0,
        max: 2,
        step: 0.05,
      }),
      ...bind('godRayDensity', 'Global', {
        label: 'God Ray Density',
        min: 0,
        max: 2,
        step: 0.05,
      }),

      'Reset Visual Polish': button(() => {
        resetLookDevSettings()
        setResetToken((t) => t + 1)
      }),
    },
    { collapsed: false },
    [resetToken]
  )
}
