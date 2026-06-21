import { LightCue } from './types'

export const trawlerLightShow: LightCue[] = [
  // Sparse sea-shanty folk: slow amber/gold lantern breathing,
  // with one gentle sweep like a lamp swaying on a rolling deck.
  { beat: 0, pattern: 'breathe', color: '#ff9a2e', intensity: 0.35 },
  { beat: 12, pattern: 'breathe', color: '#ffb84d', intensity: 0.5 },
  { beat: 20, pattern: 'sweep', color: '#ffd280', intensity: 0.55 },
  { beat: 28, pattern: 'breathe', color: '#ff9a2e', intensity: 0.3 },
]
