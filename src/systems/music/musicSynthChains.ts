import * as Tone from 'tone'
import { ShipType } from '../../store/useGameStore'

// =============================================================================
// SYNTH CREATION AND EFFECT CHAIN INITIALIZATION
// =============================================================================

export interface SynthChainConfig {
    synths: any[]
    effects: any[]
}

const synthChains: Map<ShipType, SynthChainConfig> = new Map()

// -------------------------------------------------------------------------
// CRUISE SHIP - "Ocean Symphony"
// Orchestral + choir synth with lush reverb
// -------------------------------------------------------------------------
export const createCruiseSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const reverb = new Tone.Reverb({
        decay: 4,
        preDelay: 0.2,
        wet: 0.4
    }).toDestination()
    effects.push(reverb)

    const chorus = new Tone.Chorus({
        frequency: 2,
        delayTime: 3.5,
        depth: 0.5,
        wet: 0.3
    }).connect(reverb)
    effects.push(chorus)

    const leadSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.3, decay: 0.2, sustain: 0.6, release: 1.5 }
    }).connect(chorus)
    leadSynth.volume.value = -8
    synths.push(leadSynth)

    const padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 2 }
    }).connect(reverb)
    padSynth.volume.value = -12
    synths.push(padSynth)

    const bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.8 }
    }).connect(reverb)
    bassSynth.volume.value = -6
    synths.push(bassSynth)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// CONTAINER SHIP - "Neon Stack"
// Heavy techno / future bass with FM synth + membrane
// -------------------------------------------------------------------------
export const createContainerSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const limiter = new Tone.Limiter(-2).toDestination()
    
    const pingPong = new Tone.PingPongDelay({
        delayTime: '8n',
        feedback: 0.4,
        wet: 0.2
    }).connect(limiter)
    effects.push(pingPong)

    const fmSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 }
    }).connect(pingPong)
    fmSynth.volume.value = -10
    synths.push(fmSynth)

    const membrane = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).connect(limiter)
    membrane.volume.value = -4
    synths.push(membrane)

    const metalSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).connect(pingPong)
    metalSynth.volume.value = -15
    synths.push(metalSynth)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// TANKER SHIP - "Flame Runner"
// Gritty industrial / dubstep with Metal synth + noise
// -------------------------------------------------------------------------
export const createTankerSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const reverb = new Tone.Reverb({
        decay: 3,
        preDelay: 0.1,
        wet: 0.25
    }).toDestination()
    effects.push(reverb)

    const bitcrusher = new Tone.BitCrusher(8).connect(reverb)
    effects.push(bitcrusher)

    const filter = new Tone.Filter({
        frequency: 800,
        type: 'lowpass',
        rolloff: -24
    }).connect(bitcrusher)
    effects.push(filter)

    const metalSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.3, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).connect(filter)
    metalSynth.volume.value = -8
    synths.push(metalSynth)

    const noiseSynth = new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.2 }
    }).connect(reverb)
    noiseSynth.volume.value = -18
    synths.push(noiseSynth)

    const subSynth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 },
        filter: { Q: 2, type: 'lowpass', rolloff: -24 }
    }).connect(filter)
    subSynth.volume.value = -2
    synths.push(subSynth)

    const lfo = new Tone.LFO('4n', 200, 1000)
    lfo.connect(filter.frequency)
    effects.push(lfo)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// BULK CARRIER - "Iron Mountain"
// -------------------------------------------------------------------------
export const createBulkSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const distortion = new Tone.Distortion({ distortion: 0.4, wet: 0.3 }).toDestination()
    effects.push(distortion)

    const reverb = new Tone.Reverb({ decay: 3, preDelay: 0.1, wet: 0.25 }).connect(distortion)
    effects.push(reverb)

    const guitarSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 }
    }).connect(distortion)
    guitarSynth.volume.value = -10
    synths.push(guitarSynth)

    const bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.4 },
        filter: { Q: 4, type: 'lowpass', rolloff: -24 }
    }).connect(reverb)
    bassSynth.volume.value = -6
    synths.push(bassSynth)

    const metalSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).connect(distortion)
    metalSynth.volume.value = -12
    synths.push(metalSynth)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// LNG CARRIER - "Cryo Titan"
// -------------------------------------------------------------------------
export const createLngSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const reverb = new Tone.Reverb({ decay: 8, preDelay: 0.5, wet: 0.6 }).toDestination()
    effects.push(reverb)

    const chorus = new Tone.Chorus({ frequency: 0.5, delayTime: 3, depth: 0.7, wet: 0.4 }).connect(reverb)
    effects.push(chorus)

    const padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 }
    }).connect(chorus)
    padSynth.volume.value = -14
    synths.push(padSynth)

    const fmSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 4,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 2 },
        modulation: { type: 'triangle' }
    }).connect(reverb)
    fmSynth.volume.value = -16
    synths.push(fmSynth)

    const subSynth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 1, decay: 0.5, sustain: 0.9, release: 3 }
    }).connect(reverb)
    subSynth.volume.value = -8
    synths.push(subSynth)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// RO-RO FERRY - "Vehicle Voyager"
// -------------------------------------------------------------------------
export const createRoroSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const chorus = new Tone.Chorus({ frequency: 2, delayTime: 3.5, depth: 0.5, wet: 0.3 }).toDestination()
    effects.push(chorus)

    const feedbackDelay = new Tone.FeedbackDelay('8n', 0.3).connect(chorus)
    effects.push(feedbackDelay)

    const leadSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 }
    }).connect(feedbackDelay)
    leadSynth.volume.value = -10
    synths.push(leadSynth)

    const bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'pulse' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
        filter: { Q: 2, type: 'lowpass', rolloff: -24 }
    }).connect(chorus)
    bassSynth.volume.value = -8
    synths.push(bassSynth)

    const membrane = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).connect(chorus)
    membrane.volume.value = -10
    synths.push(membrane)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// RESEARCH VESSEL - "Deep Discoverer"
// -------------------------------------------------------------------------
export const createResearchSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const reverb = new Tone.Reverb({ decay: 10, preDelay: 0.3, wet: 0.5 }).toDestination()
    effects.push(reverb)

    const pingPong = new Tone.PingPongDelay('4n', 0.2).connect(reverb)
    effects.push(pingPong)

    const sonarSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 1 }
    }).connect(pingPong)
    sonarSynth.volume.value = -12
    synths.push(sonarSynth)

    const padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 1, decay: 1, sustain: 0.7, release: 5 }
    }).connect(reverb)
    padSynth.volume.value = -18
    synths.push(padSynth)

    const bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 3 }
    }).connect(reverb)
    bassSynth.volume.value = -14
    synths.push(bassSynth)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// DRONE SHIP - "Of Course I Still Love You"
// -------------------------------------------------------------------------
export const createDroneshipSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const reverb = new Tone.Reverb({ decay: 12, preDelay: 0.8, wet: 0.7 }).toDestination()
    effects.push(reverb)

    const feedbackDelay = new Tone.FeedbackDelay('2n', 0.5).connect(reverb)
    effects.push(feedbackDelay)

    const padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
        envelope: { attack: 2, decay: 1, sustain: 0.8, release: 8 }
    }).connect(feedbackDelay)
    padSynth.volume.value = -16
    synths.push(padSynth)

    const blipSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.2 }
    }).connect(reverb)
    blipSynth.volume.value = -20
    synths.push(blipSynth)

    const droneSynth = new Tone.MonoSynth({
        oscillator: { type: 'fmsine' },
        envelope: { attack: 3, decay: 1, sustain: 1, release: 10 }
    }).connect(reverb)
    droneSynth.volume.value = -20
    synths.push(droneSynth)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// FERRY - "Island Crossings"
// -------------------------------------------------------------------------
export const createFerrySynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const reverb = new Tone.Reverb({ decay: 2, preDelay: 0.05, wet: 0.25 }).toDestination()
    effects.push(reverb)

    const padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 1.5 }
    }).connect(reverb)
    padSynth.volume.value = -12
    synths.push(padSynth)

    const bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8 }
    }).connect(reverb)
    bassSynth.volume.value = -10
    synths.push(bassSynth)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// TRAWLER - "The Saltwater Crew"
// -------------------------------------------------------------------------
export const createTrawlerSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const reverb = new Tone.Reverb({ decay: 3, preDelay: 0.1, wet: 0.35 }).toDestination()
    effects.push(reverb)

    const accordionSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.5 }
    }).connect(reverb)
    accordionSynth.volume.value = -10
    synths.push(accordionSynth)

    const bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.3, sustain: 0.4, release: 0.5 }
    }).connect(reverb)
    bassSynth.volume.value = -12
    synths.push(bassSynth)

    return { synths, effects }
}

// -------------------------------------------------------------------------
// HORIZON DEEP - "Deep Meridian"
// -------------------------------------------------------------------------
export const createHorizonSynths = (): SynthChainConfig => {
    const effects: any[] = []
    const synths: any[] = []

    const reverb = new Tone.Reverb({ decay: 8, preDelay: 0.4, wet: 0.55 }).toDestination()
    effects.push(reverb)

    const pingPong = new Tone.PingPongDelay('4n', 0.15).connect(reverb)
    effects.push(pingPong)

    const padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1.5, decay: 1, sustain: 0.7, release: 6 }
    }).connect(pingPong)
    padSynth.volume.value = -14
    synths.push(padSynth)

    const blipSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 1.5 }
    }).connect(reverb)
    blipSynth.volume.value = -20
    synths.push(blipSynth)

    return { synths, effects }
}

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
    }

    const creator = creators[shipType]
    return creator ? creator() : { synths: [], effects: [] }
}
