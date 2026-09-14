import { ShipType } from '../../store/useGameStore'
import type { EffectsOptions } from '../audio/AudioRuntime'
import { Instrument, InstrumentOptions } from '../audio/voices'

// =============================================================================
// SYNTH CREATION AND BUS EFFECTS PER SHIP
// Each ship gets its instruments (waveform + envelope + level) and the bus
// effects its track wants while it plays. The WASM engine has one effects bus,
// so these are applied by MusicSystem when that ship's music starts.
// =============================================================================

/** Bus effects for a track. Delay is in beats so it follows the ship's BPM. */
export interface MusicBusEffects extends Omit<EffectsOptions, 'delaySeconds' | 'room'> {
    delayBeats?: number
}

export interface SynthChainConfig {
    instruments: Instrument[]
    bus: MusicBusEffects
}

const chain = (bus: MusicBusEffects, ...instruments: InstrumentOptions[]): SynthChainConfig => ({
    bus,
    instruments: instruments.map((options) => new Instrument(options)),
})

// -------------------------------------------------------------------------
// CRUISE SHIP - "Ocean Symphony"
// Orchestral + choir synth with lush reverb
// -------------------------------------------------------------------------
export const createCruiseSynths = (): SynthChainConfig => chain(
    { roomMix: 0.4, chorusDepth: 0.5 },
    { waveform: 'sawtooth', envelope: { attack: 0.3, decay: 0.2, sustain: 0.6, release: 1.5 }, volumeDb: -8 },  // lead
    { waveform: 'triangle', envelope: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 2 }, volumeDb: -12 },   // pad
    { waveform: 'sine', envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.8 }, volumeDb: -6 },      // bass
)

// -------------------------------------------------------------------------
// CONTAINER SHIP - "Neon Stack"
// Heavy techno / future bass with FM synth + membrane
// -------------------------------------------------------------------------
export const createContainerSynths = (): SynthChainConfig => chain(
    { delayBeats: 0.5, delayFeedback: 0.4 },
    { waveform: 'fm', envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 }, volumeDb: -10 },
    { waveform: 'membrane', envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }, volumeDb: -4 },
    { waveform: 'metal', envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.01 }, volumeDb: -15 },
)

// -------------------------------------------------------------------------
// TANKER SHIP - "Flame Runner"
// Gritty industrial / dubstep with Metal synth + noise
// -------------------------------------------------------------------------
export const createTankerSynths = (): SynthChainConfig => chain(
    { roomMix: 0.25, bitDepth: 8 },
    { waveform: 'metal', envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 }, volumeDb: -8 },
    { waveform: 'noise', envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.2 }, volumeDb: -18 },
    { waveform: 'sawtooth', envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 }, volumeDb: -2 },  // sub
)

// -------------------------------------------------------------------------
// BULK CARRIER - "Iron Mountain"
// -------------------------------------------------------------------------
export const createBulkSynths = (): SynthChainConfig => chain(
    { roomMix: 0.25, distortion: 0.12 },
    { waveform: 'sawtooth', envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 }, volumeDb: -10 }, // guitar
    { waveform: 'square', envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.4 }, volumeDb: -6 },    // bass
    { waveform: 'metal', envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.01 }, volumeDb: -12 },
)

// -------------------------------------------------------------------------
// LNG CARRIER - "Cryo Titan"
// -------------------------------------------------------------------------
export const createLngSynths = (): SynthChainConfig => chain(
    { roomMix: 0.6, chorusDepth: 0.7 },
    { waveform: 'sine', envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 }, volumeDb: -14 },     // pad
    { waveform: 'fm', envelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 2 }, volumeDb: -16 },
    { waveform: 'sine', envelope: { attack: 1, decay: 0.5, sustain: 0.9, release: 3 }, volumeDb: -8 },    // sub
)

// -------------------------------------------------------------------------
// RO-RO FERRY - "Vehicle Voyager"
// -------------------------------------------------------------------------
export const createRoroSynths = (): SynthChainConfig => chain(
    { chorusDepth: 0.5, delayBeats: 0.5, delayFeedback: 0.3 },
    { waveform: 'sawtooth', envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 }, volumeDb: -10 }, // lead
    { waveform: 'pulse', envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 }, volumeDb: -8 },     // bass
    { waveform: 'membrane', envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }, volumeDb: -10 },
)

// -------------------------------------------------------------------------
// RESEARCH VESSEL - "Deep Discoverer"
// -------------------------------------------------------------------------
export const createResearchSynths = (): SynthChainConfig => chain(
    { roomMix: 0.5, delayBeats: 1, delayFeedback: 0.2 },
    { waveform: 'sine', envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 1 }, volumeDb: -12 },  // sonar
    { waveform: 'triangle', envelope: { attack: 1, decay: 1, sustain: 0.7, release: 5 }, volumeDb: -18 },  // pad
    { waveform: 'sine', envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 3 }, volumeDb: -14 },  // bass
)

// -------------------------------------------------------------------------
// DRONE SHIP - "Of Course I Still Love You"
// -------------------------------------------------------------------------
export const createDroneshipSynths = (): SynthChainConfig => chain(
    { roomMix: 0.7, delayBeats: 2, delayFeedback: 0.5 },
    { waveform: 'supersaw', envelope: { attack: 2, decay: 1, sustain: 0.8, release: 8 }, volumeDb: -16 }, // pad
    { waveform: 'square', envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.2 }, volumeDb: -20 }, // blip
    { waveform: 'fm', envelope: { attack: 3, decay: 1, sustain: 1, release: 10 }, volumeDb: -20 },         // drone
)

// -------------------------------------------------------------------------
// FERRY - "Island Crossings"
// -------------------------------------------------------------------------
export const createFerrySynths = (): SynthChainConfig => chain(
    { roomMix: 0.25 },
    { waveform: 'triangle', envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 1.5 }, volumeDb: -12 }, // pad
    { waveform: 'sawtooth', envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8 }, volumeDb: -10 }, // bass
)

// -------------------------------------------------------------------------
// TRAWLER - "The Saltwater Crew"
// -------------------------------------------------------------------------
export const createTrawlerSynths = (): SynthChainConfig => chain(
    { roomMix: 0.35 },
    { waveform: 'sawtooth', envelope: { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.5 }, volumeDb: -10 }, // accordion
    { waveform: 'square', envelope: { attack: 0.001, decay: 0.3, sustain: 0.4, release: 0.5 }, volumeDb: -12 }, // bass
)

// -------------------------------------------------------------------------
// HORIZON DEEP - "Deep Meridian"
// -------------------------------------------------------------------------
export const createHorizonSynths = (): SynthChainConfig => chain(
    { roomMix: 0.55, delayBeats: 1, delayFeedback: 0.15 },
    { waveform: 'sine', envelope: { attack: 1.5, decay: 1, sustain: 0.7, release: 6 }, volumeDb: -14 },   // pad
    { waveform: 'sine', envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 1.5 }, volumeDb: -20 }, // blip
)

// -------------------------------------------------------------------------
// FIREBOAT - "Emergency Pulse"
// -------------------------------------------------------------------------
export const createFireboatSynths = (): SynthChainConfig => chain(
    { roomMix: 0.2 },
    { waveform: 'sawtooth', envelope: { attack: 0.001, decay: 0.1, sustain: 0.8, release: 0.15 }, volumeDb: -8 }, // siren
    { waveform: 'square', envelope: { attack: 0.001, decay: 0.15, sustain: 0.3, release: 0.2 }, volumeDb: -10 },  // pulse bass
    { waveform: 'pulse', envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.1 }, volumeDb: -14 },     // strobe
)

// -------------------------------------------------------------------------
// ICEBREAKER - "Polar Steel"
// -------------------------------------------------------------------------
export const createIcebreakerSynths = (): SynthChainConfig => chain(
    { roomMix: 0.45 },
    { waveform: 'sawtooth', envelope: { attack: 0.08, decay: 0.4, sustain: 0.5, release: 1.2 }, volumeDb: -10 }, // ice lead
    { waveform: 'square', envelope: { attack: 0.05, decay: 0.3, sustain: 0.7, release: 0.8 }, volumeDb: -12 },   // reactor bass
    { waveform: 'sine', envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 2.5 }, volumeDb: -16 },      // ice ping
)

// Factory function to create synth chains by ship type
export const createSynthChain = (shipType: ShipType): SynthChainConfig => {
    const creators: Record<ShipType, () => SynthChainConfig> = {
        cruise: createCruiseSynths,
        container: createContainerSynths,
        tanker: createTankerSynths,
        bulk: createBulkSynths,
        lng: createLngSynths,
        roro: createRoroSynths,
        research: createResearchSynths,
        droneship: createDroneshipSynths,
        ferry: createFerrySynths,
        trawler: createTrawlerSynths,
        horizon: createHorizonSynths,
        fireboat: createFireboatSynths,
        icebreaker: createIcebreakerSynths,
    }

    const creator = creators[shipType]
    return creator ? creator() : { instruments: [], bus: {} }
}
