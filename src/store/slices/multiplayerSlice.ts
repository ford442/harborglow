// =============================================================================
// MULTIPLAYER SLICE — WebRTC shared-harbor role, connection, and network patches.
// =============================================================================

import type { StateCreator } from 'zustand';
import type { MultiplayerSlice } from '../sliceTypes';
import type { GameState, NetworkSyncState } from '../gameStoreTypes';
import { economySystem } from '../../systems/economySystem';

const MAX_CHAT_MESSAGES = 100;

export const createMultiplayerSlice: StateCreator<GameState, [], [], MultiplayerSlice> = (set) => ({
    setMultiplayerRole: (role) => set({ multiplayerRole: role }),

    setMultiplayerEnabled: (enabled) => set({ multiplayerEnabled: enabled }),

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    setRoomId: (roomId) => set({ roomId }),

    setSpectatorCount: (count) => set({ spectatorCount: count }),

    setNetworkLatency: (ms) => set({ networkLatencyMs: ms }),

    applyNetworkPatch: (patch) => set((state) => {
        const next: Partial<GameState> = {
            isApplyingNetworkPatch: true,
        };

        if (patch.ships !== undefined) next.ships = patch.ships;
        if (patch.craneUpgrades !== undefined) {
            next.craneUpgrades = patch.craneUpgrades;
            next.installedUpgrades = patch.craneUpgrades;
        }
        if (patch.musicEnabled !== undefined) next.musicEnabled = patch.musicEnabled;
        if (patch.currentSong !== undefined) next.currentSong = patch.currentSong;
        if (patch.bpm !== undefined) next.bpm = patch.bpm;
        if (patch.lyricsSize !== undefined) next.lyricsSize = patch.lyricsSize;
        if (patch.lightIntensity !== undefined) next.lightIntensity = patch.lightIntensity;
        if (patch.timeOfDay !== undefined) next.timeOfDay = patch.timeOfDay;
        if (patch.shipVersions !== undefined) next.shipVersions = patch.shipVersions;
        if (patch.shipSailTimes !== undefined) next.shipSailTimes = patch.shipSailTimes;
        if (patch.shipDockedStatus !== undefined) next.shipDockedStatus = patch.shipDockedStatus;
        if (patch.weather !== undefined) next.weather = patch.weather;
        if (patch.weatherIntensity !== undefined) next.weatherIntensity = patch.weatherIntensity;
        if (patch.operationMode !== undefined) next.operationMode = patch.operationMode;
        if (patch.tugboatState !== undefined) next.tugboatState = patch.tugboatState;
        if (patch.tugboatDockedCount !== undefined) next.tugboatDockedCount = patch.tugboatDockedCount;
        if (patch.tugboatWinTriggered !== undefined) next.tugboatWinTriggered = patch.tugboatWinTriggered;
        if (patch.tugboatFirstTimeViewed !== undefined) next.tugboatFirstTimeViewed = patch.tugboatFirstTimeViewed;
        if (patch.salvageContracts !== undefined) next.salvageContracts = patch.salvageContracts;
        if (patch.salvageSuccessfulTows !== undefined) next.salvageSuccessfulTows = patch.salvageSuccessfulTows;
        if (patch.tugboatCareerStats !== undefined) next.tugboatCareerStats = patch.tugboatCareerStats;
        if (patch.tugboatUpgrades !== undefined) next.tugboatUpgrades = patch.tugboatUpgrades;
        if (patch.waveParams !== undefined) next.waveParams = patch.waveParams;
        if (patch.harborCredits !== undefined) next.harborCredits = patch.harborCredits;
        if (patch.unlockedShopItems !== undefined) next.unlockedShopItems = patch.unlockedShopItems;
        if (patch.season !== undefined) next.season = patch.season;
        if (patch.wildlifeDensity !== undefined) next.wildlifeDensity = patch.wildlifeDensity;
        if (patch.enableMarineLife !== undefined) next.enableMarineLife = patch.enableMarineLife;

        if (patch.economyData !== undefined) {
            economySystem.deserialize(patch.economyData);
        }

        if (patch.spreaderPos !== undefined) next.spreaderPos = patch.spreaderPos;
        if (patch.spreaderRotation !== undefined) next.spreaderRotation = patch.spreaderRotation;
        if (patch.cableDepth !== undefined) next.cableDepth = patch.cableDepth;
        if (patch.loadTension !== undefined) next.loadTension = patch.loadTension;
        if (patch.trolleyPosition !== undefined) next.trolleyPosition = patch.trolleyPosition;
        if (patch.winchSpeed !== undefined) next.winchSpeed = patch.winchSpeed;
        if (patch.twistlockEngaged !== undefined) next.twistlockEngaged = patch.twistlockEngaged;
        if (patch.craneHeight !== undefined) next.craneHeight = patch.craneHeight;
        if (patch.craneRotation !== undefined) next.craneRotation = patch.craneRotation;
        if (patch.isMoving !== undefined) next.isMoving = patch.isMoving;
        if (patch.heaterActive !== undefined) next.heaterActive = patch.heaterActive;
        if (patch.iceBuildup !== undefined) next.iceBuildup = patch.iceBuildup;
        if (patch.joystickLeft !== undefined) next.joystickLeft = patch.joystickLeft;
        if (patch.joystickRight !== undefined) next.joystickRight = patch.joystickRight;

        if (patch.currentShipId !== undefined) next.currentShipId = patch.currentShipId;
        if (patch.spectatorState !== undefined) next.spectatorState = patch.spectatorState;
        if (patch.tugSpectatorActive !== undefined) next.tugSpectatorActive = patch.tugSpectatorActive;
        if (patch.lastInstallation !== undefined) next.lastInstallation = patch.lastInstallation;

        if (patch.musicPlaying !== undefined) {
            const newMap = new Map(state.musicPlaying);
            for (const [shipId, playing] of Object.entries(patch.musicPlaying)) {
                newMap.set(shipId, playing);
            }
            next.musicPlaying = newMap;
        }

        if (patch.gameTime !== undefined) next.gameTime = patch.gameTime;
        if (patch.isNight !== undefined) next.isNight = patch.isNight;
        if (patch.wildlife !== undefined) next.wildlife = patch.wildlife;
        if (patch.activeSeaEvent !== undefined) next.activeSeaEvent = patch.activeSeaEvent;
        if (patch.activeHarborEvents !== undefined) next.activeHarborEvents = patch.activeHarborEvents;
        if (patch.walkingPosition !== undefined) next.walkingPosition = patch.walkingPosition;
        if (patch.stormIntensity !== undefined) next.stormIntensity = patch.stormIntensity;
        if (patch.stormTimeRemaining !== undefined) next.stormTimeRemaining = patch.stormTimeRemaining;
        if (patch.isStormActive !== undefined) next.isStormActive = patch.isStormActive;
        if (patch.windDirection !== undefined) next.windDirection = patch.windDirection;
        if (patch.windStrength !== undefined) next.windStrength = patch.windStrength;
        if (patch.rainDensity !== undefined) next.rainDensity = patch.rainDensity;

        return next;
    }),

    addChatMessage: (message) => set((state) => {
        const chatMessages = [...state.chatMessages, message].slice(-MAX_CHAT_MESSAGES);
        return { chatMessages };
    }),
});
