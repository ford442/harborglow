// =============================================================================
// ECONOMY SLICE — Money, reputation, salvage contracts, and tugboat upgrade purchases.
// =============================================================================

import type { StateCreator } from 'zustand';
import type { EconomySlice } from '../sliceTypes';
import {
    type GameState,
    type TugboatObjective,
    type Mission,
    type TugboatUpgradeId,
    createSalvageContracts,
    buildHandshakeSequence,
} from '../gameStoreTypes';

export const createEconomySlice: StateCreator<GameState, [], [], EconomySlice> = (set, get, _api) => ({
    addReputation: (amount: number) => set((state) => {
        const newReputation = Math.max(0, state.reputation + amount)
        if (amount > 0) {
            console.log(`🏆 Reputation +${amount} (Total: ${newReputation})`)
        } else if (amount < 0) {
            console.log(`📉 Reputation ${amount} (Total: ${newReputation})`)
        }
        return { reputation: newReputation }
    }),

    // Tugboat mode actions

    refreshSalvageContracts: () => set(() => ({
        salvageContracts: createSalvageContracts(),
    })),

    acceptSalvageContract: (contractId: string) => set((state) => {
        const contract = state.salvageContracts.find((item) => item.id === contractId)
        if (!contract || state.activeMission?.status === 'active') return state

        const updatedMoney = Math.max(0, state.money - contract.acceptedFee)
        const objectiveId = `salvage-objective-${contract.id}`
        const mission: Mission = {
            id: `salvage-mission-${contract.id}`,
            type: 'salvage',
            targetShipType: contract.vesselType,
            targetShipId: objectiveId,
            timeLimit: contract.seaState === 'severe' ? 150 : 180,
            timeRemaining: contract.seaState === 'severe' ? 150 : 180,
            damage: 0,
            maxDamage: 100,
            reward: contract.rewardEstimate,
            status: 'active',
            berthCenter: contract.berthCenter,
            berthRadius: contract.berthRadius,
            distressPosition: contract.distressPosition,
            factionLabel: contract.factionLabel,
            vesselLabel: contract.vesselLabel,
            briefing: contract.briefing,
            acceptedFee: contract.acceptedFee,
            reputationReward: contract.seaState === 'severe' ? 120 : contract.seaState === 'rough' ? 90 : 70,
            failurePenalty: Math.max(180, Math.round(contract.rewardEstimate * 0.2)),
        }

        const seed = `${contract.id}|${contract.vesselLabel}|${contract.factionLabel}`
        const handshakeTargetSequence = buildHandshakeSequence(seed)
        const tugboatObjectives: TugboatObjective[] = [
            {
                id: objectiveId,
                label: `${contract.vesselLabel} → Repair Berth`,
                berthCenter: contract.berthCenter,
                berthRadius: contract.berthRadius,
                completed: false,
                shipType: contract.vesselType,
            },
        ]

        const replacementPool = createSalvageContracts().filter((item) => item.id !== contractId)
        const salvageContracts = [...state.salvageContracts.filter((item) => item.id !== contractId), ...replacementPool]
            .slice(0, 3)

        const nextState = {
            money: updatedMoney,
            activeMission: mission,
            tugboatObjectives,
            tugboatDockedCount: 0,
            tugboatWinTriggered: false,
            handshakeTargetSequence,
            handshakeInputSequence: [],
            handshakeComplete: false,
            towingUnlocked: false,
            towLineAttached: false,
            activeTowedShipId: null,
            salvageContracts,
        }
        console.log(`🛟 Salvage dispatch accepted: ${contract.vesselLabel}`)
        return nextState
    }),

    purchaseTugboatUpgrade: (id: TugboatUpgradeId) => {
        const state = get()
        if (state.tugboatUpgrades[id]) return false

        const upgradeConfig: Record<TugboatUpgradeId, { cost: number; minReputation: number; minBoothTier?: 1 | 2 | 3 }> = {
            heavy_tow_winch: { cost: 0, minReputation: 0 },
            cavitation_suppression_jets: { cost: 0, minReputation: 0 },
            searchlight_rig: { cost: 600, minReputation: 550 },
            dynamic_positioning_assist: { cost: 900, minReputation: 1100, minBoothTier: 2 },
        }
        const config = upgradeConfig[id]
        if (!config) return false
        if (state.reputation < config.minReputation) return false
        if (config.minBoothTier && state.boothTier < config.minBoothTier) return false
        if (config.cost > 0 && state.money < config.cost) return false

        const patch = {
            money: config.cost > 0 ? state.money - config.cost : state.money,
            tugboatUpgrades: {
                ...state.tugboatUpgrades,
                [id]: true,
            },
        }
        set(patch)
        return true
    },

    addMoney: (amount: number) => set((state) => {
        const newMoney = Math.max(0, state.money + amount)
        const newState = { money: newMoney }
        return newState
    }),

    deductMoney: (amount: number) => set((state) => {
        const newMoney = Math.max(0, state.money - amount)
        const newState = { money: newMoney }
        return newState
    }),
});
