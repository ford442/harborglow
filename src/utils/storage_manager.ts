// src/utils/storage_manager.ts - HarborGlow edition (inspired by ford442/storage_manager v2)
export type GameState = {
  ships: any[];
  craneUpgrades: any[];
  musicEnabled: boolean;
  currentSong?: string;
  bpm?: number;
  lyricsSize?: number;
  lightIntensity?: number;
  timeOfDay?: number;
  cameraMode?: 'orbit' | 'crane-cockpit' | 'crane-shoulder' | 'crane-top' | 'ship-low' | 'ship-aerial' | 'ship-water' | 'ship-rig' | 'spectator' | 'transition' | 'crane' | 'booth';
  // Ship tracking data
  shipVersions?: Record<string, string>;
  shipSailTimes?: Record<string, number>;
  shipDockedStatus?: Record<string, boolean>;
  // Weather system
  weather?: 'clear' | 'rain' | 'fog' | 'storm';
  weatherIntensity?: number;
  // Rendering quality
  qualityPreset?: 'low' | 'medium' | 'high';
  // Crane state
  twistlockEngaged?: boolean;
  craneHeight?: number;
  craneRotation?: number;
  // Booth tier (1=standard, 3=arctic)
  boothTier?: 1 | 2 | 3;
  // Per-viewport monitor camera presets
  dashboardPresets?: {
    crane?: string;
    hook?: string;
    drone?: string;
    underwater?: string;
  };
  // Tugboat mode state
  operationMode?: 'crane' | 'tugboat';
  tugboatState?: {
    position: [number, number, number];
    velocity: [number, number, number];
    throttle: number;
    steering: number;
    heading: number;
  };
  tugboatDockedCount?: number;
  tugboatWinTriggered?: boolean;
  waveParams?: { amplitude: number; speed: number; chaos: number };
  isStormActive?: boolean;
  windDirection?: number;
  windStrength?: number;
  // add more as needed
};

const STORAGE_KEY = 'harborglow-save-v3';
const VERSION = '3.0';

// STORAGE_MAP reserved for future cloud expansion
// const STORAGE_MAP = { game: { key: STORAGE_KEY, version: VERSION } };

export const saveGameState = (state: GameState): void => {
  const payload = {
    ...state,
    _meta: { version: VERSION, savedAt: new Date().toISOString(), type: 'game' }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  console.log('💾 Saved to storage_manager (v2)');
};

export const loadGameState = (): GameState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed._meta?.version !== VERSION) {
      console.warn('⚠️ Version mismatch — migrating later');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearSave = () => localStorage.removeItem(STORAGE_KEY);
