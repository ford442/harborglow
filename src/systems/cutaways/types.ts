import { CameraMode } from '../../store/types'

export type CutawayAction =
  | { type: 'camera_mode'; mode: CameraMode }
  | { type: 'spectator_drone'; duration?: number }
  | { type: 'climax' }
  | { type: 'spotlight_pulse' }
  | { type: 'hide_band_name' }

export interface CutawayCue {
  /** Transport beat offset; keep total plan within the 32-beat envelope. */
  beat: number
  action: CutawayAction
  /** Beats this shot holds before the next camera cue (intent only; next cue beat is authoritative). */
  holdFor?: number
}

export type CutawayPlan = CutawayCue[]
