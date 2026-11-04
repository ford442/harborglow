import { useControls } from 'leva'
import { setPerformTuning, type PerformQuantize } from '../../systems/lightShows/perform'

/** Timing-accuracy and variety bonus for performed cues. */
export function usePerformLevaControls(): void {
  useControls('Light Show Perform', {
    Quantize: {
      value: '1/8',
      options: { '1/8': '1/8', '1/16': '1/16' },
      onChange: (value: PerformQuantize) => setPerformTuning({ quantize: value }),
    },
    'Accuracy weight': {
      value: 1,
      min: 0,
      max: 4,
      step: 0.1,
      onChange: (value: number) => setPerformTuning({ accuracyWeight: value }),
    },
    'Variety weight': {
      value: 1,
      min: 0,
      max: 4,
      step: 0.1,
      onChange: (value: number) => setPerformTuning({ varietyWeight: value }),
    },
    'Credit scale': {
      value: 40,
      min: 0,
      max: 200,
      step: 1,
      onChange: (value: number) => setPerformTuning({ creditScale: value }),
    },
    'Reputation scale': {
      value: 8,
      min: 0,
      max: 40,
      step: 1,
      onChange: (value: number) => setPerformTuning({ reputationScale: value }),
    },
  })
}
