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
  cameraMode?: 'orbit' | 'crane-cockpit' | 'crane-shoulder' | 'crane-top' | 'ship-low' | 'ship-aerial' | 'ship-water' | 'ship-rig' | 'spectator' | 'transition' | 'crane' | 'booth' | 'onFoot';
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
  operationMode?: 'crane' | 'tugboat' | 'walking';
  tugboatState?: {
    position: [number, number, number];
    velocity: [number, number, number];
    throttle: number;
    steering: number;
    heading: number;
  };
  tugboatDockedCount?: number;
  tugboatWinTriggered?: boolean;
  tugboatFirstTimeViewed?: boolean;
  salvageContracts?: any[];
  salvageSuccessfulTows?: number;
  tugboatCareerStats?: {
    totalTonsAssisted?: number;
    cleanTows?: number;
    nightRescues?: number;
  };
  tugboatUpgrades?: {
    heavy_tow_winch?: boolean;
    cavitation_suppression_jets?: boolean;
    searchlight_rig?: boolean;
    dynamic_positioning_assist?: boolean;
  };
  waveParams?: { amplitude: number; speed: number; chaos: number };
  isStormActive?: boolean;
  windDirection?: number;
  windStrength?: number;
  /** Single wallet (Harbor Credits) — v4+. */
  harborCredits?: number;
  unlockedShopItems?: string[];
  /** @deprecated v3 wallet field; read only by the v3→v4 migration. */
  money?: number;
  economyData?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  wildlifeDensity?: number;
  enableMarineLife?: boolean;
  // add more as needed
};

/**
 * What lands here is decided by `getSerializableState()` in
 * `src/store/gameStoreTypes.ts` — that projection is the authoritative list of
 * persisted fields. Everything it omits (crane kinematics, camera transforms,
 * live wildlife/events, in-flight missions and install queues) is ephemeral by
 * design. See docs/STORE.md.
 *
 * Writes are always driven by the single save subscription in `useGameStore.ts`;
 * nothing else should call `saveGameState` during normal play.
 */
const STORAGE_KEY = 'harborglow-save-v4';
const VERSION = '4.0';

/** v3 saves are read once and migrated forward (money → harborCredits). */
const LEGACY_V3_KEY = 'harborglow-save-v3';
const LEGACY_V3_VERSION = '3.0';

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

/**
 * v3 → v4: the two ledgers became one. `money` was the persisted wallet and
 * `economyData.state.harborCredits` was a second, in-memory one; the migrated
 * balance is their sum so no player loses credits they had earned.
 */
export const migrateV3 = (parsed: GameState & { economyData?: string }): GameState => {
  let legacyEconomyCredits = 0;
  if (parsed.economyData) {
    try {
      const economy = JSON.parse(parsed.economyData);
      const credits = economy?.state?.harborCredits;
      if (typeof credits === 'number' && Number.isFinite(credits)) {
        legacyEconomyCredits = credits;
      }
    } catch {
      // Unreadable economy blob — fall back to the money field alone.
    }
  }

  const migrated: GameState = {
    ...parsed,
    harborCredits: (parsed.money ?? 0) + legacyEconomyCredits,
    unlockedShopItems: parsed.unlockedShopItems ?? [],
  };
  delete migrated.money;
  console.log(`🔀 Migrated v3 save → v4 (${migrated.harborCredits} HC)`);
  return migrated;
};

export const loadGameState = (): GameState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
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
  }

  // No v4 save: try to bring a v3 one forward rather than dropping the player's
  // progress on the floor.
  const legacyRaw = localStorage.getItem(LEGACY_V3_KEY);
  if (!legacyRaw) return null;
  try {
    const parsed = JSON.parse(legacyRaw);
    if (parsed._meta?.version !== LEGACY_V3_VERSION) return null;
    return migrateV3(parsed);
  } catch {
    return null;
  }
};

export const clearSave = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_V3_KEY);
};
