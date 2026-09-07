// =============================================================================
// GAME STORE - Salvage Contracts & Acoustic Handshake
// Split out of gameStoreTypes.ts; re-exported there for backward compatibility.
// =============================================================================

import { ACOUSTIC_NOTE_LAYOUT, AcousticNote } from '../systems/commsSystem'
import { ShipType } from './gameStoreDomainTypes'

export interface SalvageContract {
    id: string
    vesselLabel: string
    vesselType: ShipType
    factionLabel: string
    distanceNm: number
    seaState: 'moderate' | 'rough' | 'severe'
    rewardEstimate: number
    techniqueNote: string
    distressPosition: [number, number, number]
    berthCenter: [number, number, number]
    berthRadius: number
    briefing: string
    acceptedFee: number
    expiresAt: number
}

export const DEFAULT_HANDSHAKE_SEQUENCE: AcousticNote[] = ['C1', 'G1', 'D#1', 'A#1']

export function buildHandshakeSequence(objectiveSeed: string): AcousticNote[] {
    if (!objectiveSeed) return DEFAULT_HANDSHAKE_SEQUENCE

    let hash = 0
    for (let i = 0; i < objectiveSeed.length; i++) {
        hash = (hash + objectiveSeed.charCodeAt(i) * (i + 1)) % 100000
    }

    return [0, 3, 7, 10].map(offset =>
        ACOUSTIC_NOTE_LAYOUT[(hash + offset) % ACOUSTIC_NOTE_LAYOUT.length]
    )
}

const LEGACY_VESSEL_POOL: Array<{
    vesselType: ShipType
    vesselLabel: string
    factionLabel: string
    techniqueNote: string
    baseReward: number
}> = [
    {
        vesselType: 'trawler',
        vesselLabel: 'Rustline Trawler 12',
        factionLabel: 'Legacy Co-op Trawler Guild',
        techniqueNote: 'Keep tow line soft — avoid hard rudder corrections in swell.',
        baseReward: 950,
    },
    {
        vesselType: 'ferry',
        vesselLabel: 'Old Harbor Ferry Cormorant',
        factionLabel: 'Independent Ferry Collective',
        techniqueNote: 'Maintain slow stern pull while crossing the breakwater wake.',
        baseReward: 1100,
    },
    {
        vesselType: 'horizon',
        vesselLabel: 'Horizon Utility Barge Atlas',
        factionLabel: 'Legacy Horizon Works',
        techniqueNote: 'Use differential thrust to counter crosscurrent shear.',
        baseReward: 1400,
    },
]

function computeSalvageRewardEstimate(baseReward: number, distanceNm: number, seaState: SalvageContract['seaState']): number {
    const seaMultiplier = seaState === 'severe' ? 1.35 : seaState === 'rough' ? 1.18 : 1.0
    return Math.round(baseReward * seaMultiplier + distanceNm * 110)
}

export function createSalvageContracts(now = Date.now()): SalvageContract[] {
    return [0, 1, 2].map((slot) => {
        const vessel = LEGACY_VESSEL_POOL[(slot + Math.floor(now / 1000)) % LEGACY_VESSEL_POOL.length]
        const distanceNm = 1.4 + slot * 0.9
        const seaState: SalvageContract['seaState'] = slot === 2 ? 'severe' : slot === 1 ? 'rough' : 'moderate'
        const distressPosition: [number, number, number] = [
            -55 + slot * 18,
            0,
            -95 - slot * 22,
        ]
        const berthCenter: [number, number, number] = slot === 0
            ? [-15, 0, -20]
            : slot === 1
                ? [0, 0, -25]
                : [15, 0, -20]
        return {
            id: `salvage-${now}-${slot}`,
            vesselType: vessel.vesselType,
            vesselLabel: vessel.vesselLabel,
            factionLabel: vessel.factionLabel,
            distanceNm,
            seaState,
            rewardEstimate: computeSalvageRewardEstimate(vessel.baseReward, distanceNm, seaState),
            techniqueNote: vessel.techniqueNote,
            distressPosition,
            berthCenter,
            berthRadius: 8,
            briefing: `${vessel.vesselLabel} reported dead in the water beyond the breakwater. Recover for ${vessel.factionLabel}.`,
            acceptedFee: 120 + slot * 30,
            expiresAt: now + (8 + slot * 2) * 60_000,
        }
    })
}
