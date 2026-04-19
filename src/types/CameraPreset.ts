export type CameraPresetId =
  | 'orbit-overview'
  | 'gantry-top-down'
  | 'cable-tip-follow'
  | 'dock-level'
  | 'drone-chase'
  | 'ship-interior'

export type CameraPresetMode =
  | 'ship-relative'
  | 'crane-relative'
  | 'spreader-relative'
  | 'drone-orbit'
  | 'world-static'

export interface CameraPreset {
  id: CameraPresetId
  label: string
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  mode: CameraPresetMode
}

export type DashboardViewportId = 'crane' | 'hook' | 'drone' | 'underwater'
export type DashboardPresets = Record<DashboardViewportId, CameraPresetId>

export const CAMERA_PRESET_IDS: CameraPresetId[] = [
  'orbit-overview',
  'gantry-top-down',
  'cable-tip-follow',
  'dock-level',
  'drone-chase',
  'ship-interior'
]

export const isCameraPresetId = (value: unknown): value is CameraPresetId =>
  typeof value === 'string' && CAMERA_PRESET_IDS.includes(value as CameraPresetId)
