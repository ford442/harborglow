export type CameraPresetId =
  | 'orbit-overview'
  | 'gantry-top-down'
  | 'cable-tip-follow'
  | 'dock-level'
  | 'drone-chase'
  | 'ship-interior'
  | 'tug-helm'
  | 'tug-deck'
  | 'tug-chase'
  | 'tug-prop'
  | 'tug-towline'

export type CameraPresetMode =
  | 'ship-relative'
  | 'crane-relative'
  | 'spreader-relative'
  | 'drone-orbit'
  | 'world-static'
  | 'tug-relative'

export interface CameraPreset {
  id: CameraPresetId
  label: string
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  mode: CameraPresetMode
}

export type DashboardViewportId = 'crane' | 'hook' | 'drone' | 'underwater'
export type TugboatViewportId = 'tug-helm' | 'tug-deck' | 'tug-chase' | 'tug-prop'
export type DashboardPresets = Record<DashboardViewportId, CameraPresetId>
export type TugboatDashboardPresets = Record<TugboatViewportId, CameraPresetId>

export const CAMERA_PRESET_IDS: CameraPresetId[] = [
  'orbit-overview',
  'gantry-top-down',
  'cable-tip-follow',
  'dock-level',
  'drone-chase',
  'ship-interior',
  'tug-helm',
  'tug-deck',
  'tug-chase',
  'tug-prop',
  'tug-towline'
]

export const isCameraPresetId = (value: unknown): value is CameraPresetId =>
  typeof value === 'string' && CAMERA_PRESET_IDS.includes(value as CameraPresetId)
