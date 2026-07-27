// =============================================================================
// ECONOMY SLICE — Harbor Credits, reputation, salvage contracts, shop purchases.
//
// `harborCredits` is the one player wallet. economySystem calculates *how much*
// is earned and owns the shop catalog; it does not hold a balance of its own.
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
import { SHOP_CATALOG, applyShopItemPurchase } from '../../systems/economySystem';

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

        const updatedCredits = Math.max(0, state.harborCredits - contract.acceptedFee)
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
            harborCredits: updatedCredits,
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
        // Same afford/spend helper the shop uses — one wallet, one code path.
        if (config.cost > 0 && !state.spendHarborCredits(config.cost, `tugboat_upgrade:${id}`)) {
            return false
        }

        set((current) => ({
            tugboatUpgrades: {
                ...current.tugboatUpgrades,
                [id]: true,
            },
        }))
        return true
    },

    addHarborCredits: (amount: number, source?: string) => set((state) => {
        if (!Number.isFinite(amount) || amount <= 0) return state
        const harborCredits = state.harborCredits + amount
        console.log(`💰 +${amount} HC${source ? ` (${source})` : ''} — total ${harborCredits}`)
        return { harborCredits }
    }),

    spendHarborCredits: (amount: number, reason?: string) => {
        if (!Number.isFinite(amount) || amount < 0) return false
        const { harborCredits } = get()
        if (harborCredits < amount) return false
        set({ harborCredits: harborCredits - amount })
        console.log(`🧾 -${amount} HC${reason ? ` (${reason})` : ''} — total ${harborCredits - amount}`)
        return true
    },

    purchaseShopItem: (itemId: string) => {
        const state = get()
        const item = SHOP_CATALOG.find((i) => i.id === itemId)
        if (!item) return false
        if (item.minReputation !== undefined && state.reputation < item.minReputation) return false

        const cost = item.cost
        if (!state.spendHarborCredits(cost, `shop:${itemId}`)) return false

        // Effects live in economySystem (upgrade levels, boosts); the unlock flag
        // lives on the store so it is persisted with the wallet that paid for it.
        applyShopItemPurchase(item)
        set((current) => ({
            unlockedShopItems: current.unlockedShopItems.includes(itemId)
                ? current.unlockedShopItems
                : [...current.unlockedShopItems, itemId],
        }))
        return true
    },

    /** @deprecated alias for addHarborCredits — remove after one release. */
    addMoney: (amount: number) => {
        get().addHarborCredits(amount, 'legacy:addMoney')
    },

    /** @deprecated clamping debit kept for callers that never checked affordability. */
    deductMoney: (amount: number) => set((state) => ({
        harborCredits: Math.max(0, state.harborCredits - amount),
    })),
});
